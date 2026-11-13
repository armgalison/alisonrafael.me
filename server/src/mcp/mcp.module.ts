import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { Application, Request, Response } from 'express';
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js';
import { getOAuthProtectedResourceMetadataUrl, mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AuthModule } from '../auth/auth.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { PageViewsModule } from '../page-views/page-views.module.js';
import { McpAuthorizationCode } from './entities/mcp-authorization-code.entity.js';
import { McpClient } from './entities/mcp-client.entity.js';
import { McpGrant } from './entities/mcp-grant.entity.js';
import { McpAdminController } from './mcp-admin.controller.js';
import { McpOAuthController } from './mcp-oauth.controller.js';
import { McpOAuthService } from './mcp-oauth.service.js';
import { McpServerFactory } from './mcp-server.factory.js';
import { MCP_PATH, MCP_SCOPE } from './mcp.constants.js';

// The Admin MCP (ADR 0021). The MCP SDK's OAuth router and the /mcp
// endpoint are plain Express handlers — the SDK requires them at the app
// root (/.well-known/*, /authorize, /token, /register, /revoke) — so they
// are mounted on the underlying Express app here rather than as Nest
// controllers. onModuleInit runs after Nest registers its own routes and
// before its 404 handler, so both coexist.
@Module({
  imports: [
    TypeOrmModule.forFeature([McpClient, McpGrant, McpAuthorizationCode]),
    AuthModule,
    PageViewsModule,
    ChatModule,
  ],
  controllers: [McpOAuthController, McpAdminController],
  providers: [McpOAuthService, McpServerFactory],
})
export class McpModule implements OnModuleInit {
  private readonly logger = new Logger(McpModule.name);

  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly oauth: McpOAuthService,
    private readonly servers: McpServerFactory,
  ) {}

  onModuleInit() {
    const app = this.adapterHost.httpAdapter.getInstance<Application>();

    app.use(
      mcpAuthRouter({
        provider: this.oauth,
        issuerUrl: this.oauth.publicUrl,
        resourceServerUrl: this.oauth.resourceUrl,
        resourceName: 'alisonrafael.me Admin MCP',
        scopesSupported: [MCP_SCOPE],
        // Client secrets never expire on their own: revoking is done per
        // Connected client, and an expired secret would silently break a
        // claude.ai connector's refresh after 30 days.
        clientRegistrationOptions: { clientSecretExpirySeconds: 0 },
      }),
    );

    const bearer = requireBearerAuth({
      verifier: this.oauth,
      requiredScopes: [MCP_SCOPE],
      resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(this.oauth.resourceUrl),
      expectedResource: this.oauth.resourceUrl,
    });

    app.post(MCP_PATH, bearer, async (req: Request, res: Response) => {
      const server = this.servers.create();
      // Stateless: one server + transport per request, plain JSON replies,
      // no session to keep and no long-lived SSE stream behind nginx-proxy.
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        void transport.close();
        void server.close();
      });
      try {
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (err) {
        this.logger.error('Admin MCP request failed', err instanceof Error ? err.stack : String(err));
        if (!res.headersSent) {
          res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal error' }, id: null });
        }
      }
    });

    // Stateless: no SSE stream to open and no session to end.
    app.all(MCP_PATH, bearer, (_req: Request, res: Response) => {
      res
        .status(405)
        .set('Allow', 'POST')
        .json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null });
    });
  }
}
