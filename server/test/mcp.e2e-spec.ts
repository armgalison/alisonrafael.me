import { createHash, randomBytes } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './../src/app.module.js';
import { McpOAuthService } from './../src/mcp/mcp-oauth.service.js';
import { createValidationPipe } from './../src/validation-pipe.js';

// The Admin MCP end to end (ADR 0021): Dynamic Client Registration, the
// login + consent page, PKCE, token separation from the Admin Panel's JWT,
// refresh rotation, and revocation. Needs ADMIN_EMAIL/ADMIN_PASSWORD (CI
// sets them) for an Admin that still has that password.

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'ci@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'ci-only-not-a-secret';
const REDIRECT_URI = 'http://127.0.0.1:33418/callback';
const MCP_HEADERS = { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json' };

function pkce() {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

describe('Admin MCP (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let resource: string;
  let adminJwt: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(createValidationPipe());
    await app.init();
    http = app.getHttpServer();
    resource = app.get(McpOAuthService).resourceUrl.href;

    const login = await request(http).post('/auth/login').send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }).expect(200);
    adminJwt = login.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // Not async: callers chain supertest's .expect() on the returned request.
  function register(redirectUris = [REDIRECT_URI]) {
    return request(http)
      .post('/register')
      .send({
        client_name: 'e2e client',
        redirect_uris: redirectUris,
        token_endpoint_auth_method: 'none',
        grant_types: ['authorization_code', 'refresh_token'],
        response_types: ['code'],
      });
  }

  // Registers a client and walks the whole authorization-code flow.
  async function connect() {
    const registration = await register().expect(201);
    const clientId: string = registration.body.client_id;
    const { verifier, challenge } = pkce();

    const page = await request(http)
      .get('/authorize')
      .query({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: 'xyz',
        resource,
      })
      .expect(200);
    expect(page.text).toContain('Allow access to the Admin MCP?');
    expect(page.headers['x-frame-options']).toBe('DENY');

    const consent = await request(http)
      .post('/oauth/consent')
      .type('form')
      .send({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        code_challenge: challenge,
        state: 'xyz',
        resource,
        action: 'allow',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })
      .expect(302);
    const location = new URL(consent.headers.location);
    expect(location.origin + location.pathname).toBe(REDIRECT_URI);
    expect(location.searchParams.get('state')).toBe('xyz');
    const code = location.searchParams.get('code')!;

    const token = await request(http)
      .post('/token')
      .type('form')
      .send({
        grant_type: 'authorization_code',
        client_id: clientId,
        code,
        code_verifier: verifier,
        redirect_uri: REDIRECT_URI,
        resource,
      })
      .expect(200);
    return { clientId, code, verifier, tokens: token.body as { access_token: string; refresh_token: string } };
  }

  function callMcp(token: string | undefined, body: object) {
    const req = request(http).post('/mcp').set(MCP_HEADERS);
    if (token) req.set('Authorization', `Bearer ${token}`);
    return req.send(body);
  }

  const listTools = { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} };

  it('advertises its OAuth metadata', async () => {
    const prm = await request(http).get('/.well-known/oauth-protected-resource/mcp').expect(200);
    expect(prm.body.resource).toBe(resource);
    const as = await request(http).get('/.well-known/oauth-authorization-server').expect(200);
    expect(as.body.registration_endpoint).toBeDefined();
    expect(as.body.code_challenge_methods_supported).toEqual(['S256']);
  });

  it('rejects a client whose redirect_uri is not allowed', async () => {
    const res = await register(['https://evil.example/callback']).expect(400);
    expect(res.body.error).toBe('invalid_client_metadata');
  });

  it('re-renders the consent page on a wrong password, and redirects with access_denied on Deny', async () => {
    const { body } = await register().expect(201);
    const fields = { client_id: body.client_id, redirect_uri: REDIRECT_URI, code_challenge: pkce().challenge, resource };

    const wrong = await request(http)
      .post('/oauth/consent')
      .type('form')
      .send({ ...fields, action: 'allow', email: ADMIN_EMAIL, password: 'not-the-password' })
      .expect(401);
    expect(wrong.text).toContain('Wrong email or password.');

    const deny = await request(http).post('/oauth/consent').type('form').send({ ...fields, action: 'deny' }).expect(302);
    expect(new URL(deny.headers.location).searchParams.get('error')).toBe('access_denied');
  });

  it('connects, lists and calls tools, and a code works only once', async () => {
    const { clientId, code, verifier, tokens } = await connect();

    const list = await callMcp(tokens.access_token, listTools).expect(200);
    expect(list.body.result.tools.map((t: { name: string }) => t.name).sort()).toEqual([
      'get_access_log_summary',
      'get_chat_conversation',
      'list_chat_conversations',
      'list_page_views',
    ]);

    const call = await callMcp(tokens.access_token, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'get_access_log_summary', arguments: { days: 7 } },
    }).expect(200);
    expect(JSON.parse(call.body.result.content[0].text)).toHaveProperty('totals');

    await request(http)
      .post('/token')
      .type('form')
      .send({ grant_type: 'authorization_code', client_id: clientId, code, code_verifier: verifier, redirect_uri: REDIRECT_URI })
      .expect(400);
  });

  it('keeps MCP tokens and Admin Panel JWTs apart', async () => {
    const { tokens } = await connect();

    const anonymous = await callMcp(undefined, listTools).expect(401);
    expect(anonymous.headers['www-authenticate']).toContain('resource_metadata=');
    await callMcp(adminJwt, listTools).expect(401);

    await request(http).get('/page-views/admin').set('Authorization', `Bearer ${tokens.access_token}`).expect(401);
    await request(http).get('/mcp/admin/clients').set('Authorization', `Bearer ${tokens.access_token}`).expect(401);
  });

  it('rotates refresh tokens: the old pair stops working', async () => {
    const { clientId, tokens } = await connect();
    const refresh = (refreshToken: string) =>
      request(http)
        .post('/token')
        .type('form')
        .send({ grant_type: 'refresh_token', client_id: clientId, refresh_token: refreshToken, resource });

    const rotated = await refresh(tokens.refresh_token).expect(200);
    expect(rotated.body.refresh_token).not.toBe(tokens.refresh_token);

    const reused = await refresh(tokens.refresh_token).expect(400);
    expect(reused.body.error).toBe('invalid_grant');
    await callMcp(tokens.access_token, listTools).expect(401);
    await callMcp(rotated.body.access_token, listTools).expect(200);
  });

  it('revokes a Connected client from Settings, and every one on a password change', async () => {
    const first = await connect();
    const admin = { Authorization: `Bearer ${adminJwt}` };

    const clients = await request(http).get('/mcp/admin/clients').set(admin).expect(200);
    expect(clients.body.length).toBeGreaterThan(0);
    for (const client of clients.body) {
      await request(http).delete(`/mcp/admin/clients/${client.id}`).set(admin).expect(204);
    }
    await callMcp(first.tokens.access_token, listTools).expect(401);

    const second = await connect();
    await callMcp(second.tokens.access_token, listTools).expect(200);
    const changed = `${ADMIN_PASSWORD}-changed`;
    await request(http).patch('/auth/me').set(admin).send({ currentPassword: ADMIN_PASSWORD, newPassword: changed }).expect(204);
    try {
      await callMcp(second.tokens.access_token, listTools).expect(401);
      expect((await request(http).get('/mcp/admin/clients').set(admin).expect(200)).body).toEqual([]);
    } finally {
      await request(http).patch('/auth/me').set(admin).send({ currentPassword: changed, newPassword: ADMIN_PASSWORD }).expect(204);
    }
  });
});
