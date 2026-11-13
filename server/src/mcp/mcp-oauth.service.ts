import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { LessThan, Repository } from 'typeorm';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import {
  InvalidClientMetadataError,
  InvalidGrantError,
  InvalidTargetError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import type { AuthorizationParams, OAuthServerProvider } from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  OAuthClientInformationFull,
  OAuthTokenRevocationRequest,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { AuthService } from '../auth/auth.service.js';
import { McpAuthorizationCode } from './entities/mcp-authorization-code.entity.js';
import { McpClient } from './entities/mcp-client.entity.js';
import { McpGrant } from './entities/mcp-grant.entity.js';
import { sendConsentPage } from './mcp-consent-page.js';
import {
  API_PUBLIC_URL_DEFAULT,
  MCP_ACCESS_TOKEN_PREFIX,
  MCP_ACCESS_TOKEN_TTL_SECONDS,
  MCP_ALLOWED_REDIRECT_URIS,
  MCP_AUTHORIZATION_CODE_TTL_SECONDS,
  MCP_LAST_USED_RESOLUTION_MS,
  MCP_LOOPBACK_HOSTS,
  MCP_PATH,
  MCP_REFRESH_TOKEN_PREFIX,
  MCP_REFRESH_TOKEN_TTL_SECONDS,
  MCP_SCOPE,
  MCP_UNUSED_CLIENT_TTL_MS,
} from './mcp.constants.js';

export interface ConnectedClient {
  id: string;
  clientName: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function randomToken(prefix = ''): string {
  return prefix + randomBytes(32).toString('base64url');
}

// True for redirect URIs Dynamic Client Registration may accept (ADR 0021).
export function isAllowedRedirectUri(uri: string): boolean {
  if (MCP_ALLOWED_REDIRECT_URIS.includes(uri)) return true;
  try {
    const url = new URL(uri);
    return url.protocol === 'http:' && MCP_LOOPBACK_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

// The Admin MCP's OAuth 2.1 authorization server, as the MCP SDK's
// mcpAuthRouter expects it. The SDK handles the protocol (metadata, DCR,
// PKCE checks, client authentication, error formats); this class only
// stores clients, codes and Connected clients.
@Injectable()
export class McpOAuthService implements OAuthServerProvider, OnModuleInit {
  private readonly logger = new Logger(McpOAuthService.name);
  readonly publicUrl: URL;
  readonly resourceUrl: URL;

  constructor(
    @InjectRepository(McpClient) private readonly clients: Repository<McpClient>,
    @InjectRepository(McpGrant) private readonly grants: Repository<McpGrant>,
    @InjectRepository(McpAuthorizationCode) private readonly codes: Repository<McpAuthorizationCode>,
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.publicUrl = new URL(config.get<string>('API_PUBLIC_URL', API_PUBLIC_URL_DEFAULT));
    this.resourceUrl = new URL(MCP_PATH, this.publicUrl);
  }

  onModuleInit() {
    // A new password must lock out every AI client the old one let in.
    this.auth.onPasswordChanged(async () => {
      await this.revokeAll();
    });
  }

  // --- Registered clients (Dynamic Client Registration) ---

  readonly clientsStore: OAuthRegisteredClientsStore = {
    getClient: async (clientId: string) => {
      const client = await this.clients.findOne({ where: { clientId } });
      return client?.info;
    },
    registerClient: async (info: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>) => {
      const full = info as OAuthClientInformationFull;
      const rejected = full.redirect_uris.filter((uri) => !isAllowedRedirectUri(uri));
      if (rejected.length > 0) {
        throw new InvalidClientMetadataError(`redirect_uri not allowed: ${rejected.join(', ')}`);
      }
      await this.clients.insert({ clientId: full.client_id, info: full });
      return full;
    },
  };

  // --- Authorization ---

  // GET /authorize: the SDK has already checked the client, the redirect
  // URI and PKCE parameters; show the Admin the login + consent page.
  async authorize(client: OAuthClientInformationFull, params: AuthorizationParams, res: Response): Promise<void> {
    this.assertResource(params.resource);
    sendConsentPage(res, {
      clientName: client.client_name ?? client.client_id,
      fields: {
        client_id: client.client_id,
        redirect_uri: params.redirectUri,
        code_challenge: params.codeChallenge,
        state: params.state,
        resource: params.resource?.href,
      },
    });
  }

  // Called by McpOAuthController once the Admin's credentials check out.
  async issueAuthorizationCode(
    client: OAuthClientInformationFull,
    adminId: string,
    codeChallenge: string,
    redirectUri: string,
  ): Promise<string> {
    const code = randomToken();
    await this.codes.insert({
      codeHash: sha256(code),
      clientId: client.client_id,
      adminId,
      codeChallenge,
      redirectUri,
      expiresAt: new Date(Date.now() + MCP_AUTHORIZATION_CODE_TTL_SECONDS * 1000),
    });
    return code;
  }

  async challengeForAuthorizationCode(client: OAuthClientInformationFull, authorizationCode: string): Promise<string> {
    const code = await this.findLiveCode(client, authorizationCode);
    return code.codeChallenge;
  }

  // The SDK has verified the PKCE verifier against challengeForAuthorizationCode.
  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    this.assertResource(resource);
    const code = await this.findLiveCode(client, authorizationCode);
    // Single use, whatever happens next.
    await this.codes.delete({ codeHash: code.codeHash });
    if (redirectUri !== undefined && redirectUri !== code.redirectUri) {
      throw new InvalidGrantError('redirect_uri does not match the authorization request');
    }

    const grant = this.grants.create({
      clientId: client.client_id,
      clientName: (client.client_name ?? client.client_id).slice(0, 255),
      adminId: code.adminId,
      lastUsedAt: null,
    });
    const tokens = this.rotate(grant);
    await this.grants.save(grant);
    return tokens;
  }

  // Rotation: the presented refresh token is replaced, so reusing an old
  // one fails (it no longer matches any Connected client).
  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    _scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    this.assertResource(resource);
    const grant = await this.grants.findOne({
      where: { refreshTokenHash: sha256(refreshToken), clientId: client.client_id },
    });
    if (!grant || grant.refreshTokenExpiresAt.getTime() <= Date.now()) {
      throw new InvalidGrantError('Invalid or expired refresh token');
    }
    const tokens = this.rotate(grant);
    await this.grants.save(grant);
    return tokens;
  }

  // --- Resource server ---

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const grant = await this.grants.findOne({ where: { accessTokenHash: sha256(token) } });
    if (!grant || grant.accessTokenExpiresAt.getTime() <= Date.now()) {
      throw new InvalidTokenError('Invalid or expired access token');
    }
    const now = Date.now();
    if (!grant.lastUsedAt || now - grant.lastUsedAt.getTime() >= MCP_LAST_USED_RESOLUTION_MS) {
      await this.grants.update({ id: grant.id }, { lastUsedAt: new Date(now) });
    }
    return {
      token,
      clientId: grant.clientId,
      scopes: [MCP_SCOPE],
      expiresAt: Math.floor(grant.accessTokenExpiresAt.getTime() / 1000),
      resource: this.resourceUrl,
    };
  }

  // RFC 7009: either token of a pair revokes the whole Connected client.
  async revokeToken(client: OAuthClientInformationFull, request: OAuthTokenRevocationRequest): Promise<void> {
    const hash = sha256(request.token);
    await this.grants.delete({ clientId: client.client_id, accessTokenHash: hash });
    await this.grants.delete({ clientId: client.client_id, refreshTokenHash: hash });
  }

  // --- Connected clients (Admin Panel → Settings) ---

  async listConnectedClients(): Promise<ConnectedClient[]> {
    const grants = await this.grants.find({ order: { createdAt: 'DESC' } });
    return grants.map((g) => ({
      id: g.id,
      clientName: g.clientName,
      createdAt: g.createdAt,
      lastUsedAt: g.lastUsedAt,
      expiresAt: g.refreshTokenExpiresAt,
    }));
  }

  // Returns whether anything was revoked.
  async revokeConnectedClient(id: string): Promise<boolean> {
    const result = await this.grants.delete({ id });
    return (result.affected ?? 0) > 0;
  }

  async revokeAll(): Promise<void> {
    await this.grants.clear();
    await this.codes.clear();
    this.logger.log('Revoked every Admin MCP Connected client.');
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async purgeExpired(): Promise<void> {
    const now = new Date();
    await this.codes.delete({ expiresAt: LessThan(now) });
    await this.grants.delete({ refreshTokenExpiresAt: LessThan(now) });
    // Clients registered but never allowed in (or whose grants all ended).
    await this.clients
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoff', { cutoff: new Date(Date.now() - MCP_UNUSED_CLIENT_TTL_MS) })
      .andWhere('clientId NOT IN (SELECT g.clientId FROM mcp_grants g)')
      .execute();
  }

  // --- Helpers ---

  private rotate(grant: McpGrant): OAuthTokens {
    const accessToken = randomToken(MCP_ACCESS_TOKEN_PREFIX);
    const refreshToken = randomToken(MCP_REFRESH_TOKEN_PREFIX);
    const now = Date.now();
    grant.accessTokenHash = sha256(accessToken);
    grant.accessTokenExpiresAt = new Date(now + MCP_ACCESS_TOKEN_TTL_SECONDS * 1000);
    grant.refreshTokenHash = sha256(refreshToken);
    grant.refreshTokenExpiresAt = new Date(now + MCP_REFRESH_TOKEN_TTL_SECONDS * 1000);
    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: MCP_ACCESS_TOKEN_TTL_SECONDS,
      refresh_token: refreshToken,
      scope: MCP_SCOPE,
    };
  }

  private async findLiveCode(client: OAuthClientInformationFull, code: string): Promise<McpAuthorizationCode> {
    const row = await this.codes.findOne({ where: { codeHash: sha256(code) } });
    if (!row || row.clientId !== client.client_id || row.expiresAt.getTime() <= Date.now()) {
      throw new InvalidGrantError('Invalid or expired authorization code');
    }
    return row;
  }

  // RFC 8707: a client may name the resource it wants a token for; the
  // only one this server issues tokens for is the Admin MCP itself.
  assertResource(resource: URL | undefined): void {
    if (!resource) return;
    const normalize = (u: URL) => u.href.split('#')[0].replace(/\/$/, '');
    if (normalize(resource) !== normalize(this.resourceUrl)) {
      throw new InvalidTargetError(`Unknown resource: ${resource.href}`);
    }
  }
}
