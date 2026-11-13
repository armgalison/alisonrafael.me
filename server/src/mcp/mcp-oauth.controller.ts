import { Body, Controller, HttpException, HttpStatus, Ip, Post, Res, UnauthorizedException } from '@nestjs/common';
import type { Response } from 'express';
import { redirectUriMatches } from '@modelcontextprotocol/sdk/server/auth/handlers/authorize.js';
import { AuthService } from '../auth/auth.service.js';
import { ConsentDto } from './dto/consent.dto.js';
import { CONSENT_FORM_ACTION, sendConsentPage } from './mcp-consent-page.js';
import { McpOAuthService } from './mcp-oauth.service.js';

// The consent page's submit. Everything else in the OAuth flow (metadata,
// /register, /authorize, /token, /revoke) is the MCP SDK's router, mounted
// by McpModule.
@Controller()
export class McpOAuthController {
  constructor(
    private readonly oauth: McpOAuthService,
    private readonly auth: AuthService,
  ) {}

  @Post(CONSENT_FORM_ACTION)
  async consent(@Body() dto: ConsentDto, @Ip() ip: string, @Res() res: Response): Promise<void> {
    // The hidden fields are client-controlled: re-check them exactly as
    // GET /authorize did before showing the page.
    const client = await this.oauth.clientsStore.getClient(dto.client_id);
    if (!client || !client.redirect_uris.some((registered) => redirectUriMatches(dto.redirect_uri, registered))) {
      res.status(400).type('text').send('Invalid authorization request.');
      return;
    }
    let resource: URL | undefined;
    try {
      resource = dto.resource ? new URL(dto.resource) : undefined;
      this.oauth.assertResource(resource);
    } catch {
      res.status(400).type('text').send('Invalid authorization request.');
      return;
    }

    const redirect = new URL(dto.redirect_uri);
    if (dto.state) redirect.searchParams.set('state', dto.state);

    if (dto.action === 'deny') {
      redirect.searchParams.set('error', 'access_denied');
      redirect.searchParams.set('error_description', 'The Admin denied access.');
      res.redirect(302, redirect.href);
      return;
    }

    const page = {
      clientName: client.client_name ?? client.client_id,
      fields: {
        client_id: dto.client_id,
        redirect_uri: dto.redirect_uri,
        code_challenge: dto.code_challenge,
        state: dto.state,
        resource: dto.resource,
      },
      email: dto.email,
    };

    let adminId: string;
    try {
      const admin = await this.auth.authenticate(dto.email ?? '', dto.password ?? '', ip);
      adminId = admin.id;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        sendConsentPage(res, { ...page, error: 'Wrong email or password.' }, 401);
        return;
      }
      if (err instanceof HttpException && err.getStatus() === HttpStatus.TOO_MANY_REQUESTS) {
        sendConsentPage(res, { ...page, error: 'Too many failed logins. Try again in 15 minutes.' }, 429);
        return;
      }
      throw err;
    }

    const code = await this.oauth.issueAuthorizationCode(client, adminId, dto.code_challenge, dto.redirect_uri);
    redirect.searchParams.set('code', code);
    res.redirect(302, redirect.href);
  }
}
