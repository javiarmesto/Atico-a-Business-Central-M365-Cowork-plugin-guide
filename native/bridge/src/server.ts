import express from 'express';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { AuthError, exchangeToken, makeVerifier } from './auth.js';
import { readConfig, type Config } from './config.js';
import { discoverNative, readNative, callDynamicNative } from './native.js';
import { version } from './catalog.js';
import { prepareForMode, publicDescriptor } from './dynamic.js';


export function createApp(config: Config, dependencies = {
  verify: makeVerifier(config),
  exchange: (assertion: string) => exchangeToken(config, assertion),
  discover: (token: string) => discoverNative(config, token),
  read: (token: string, name: string, args: Record<string, unknown>) => config.toolMode === 'dynamic' ? callDynamicNative(config, token, name, args) : readNative(config, token, name, args)
}) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/healthz', (_req, res) => res.json({ status: 'ok', version, toolMode: config.toolMode, nativeConnection: 'not_checked' }));
  app.get('/.well-known/oauth-protected-resource', (_req, res) => res.json({
    resource: `${config.publicUrl}/mcp`, authorization_servers: [config.issuer],
    bearer_methods_supported: ['header'], scopes_supported: [`api://${config.clientId}/access_as_user`]
  }));
  app.post('/mcp', express.json({ limit: '64kb' }), async (req, res) => {
    const correlationId = randomUUID();
    res.setHeader('X-Correlation-Id', correlationId);
    let server: Server | undefined;
    try {
      // No cookies or ambient browser authentication. Reject unexpected browser origins.
      if (req.headers.origin && req.headers.origin !== config.publicUrl) {
        throw new AuthError(403, 'origin_not_allowed');
      }
      const assertion = await dependencies.verify(req.headers.authorization);
      let prepared: Record<string, unknown> | undefined;
      let argumentError: string | undefined;
      if (req.body?.method === 'tools/call') {
        try { prepared = prepareForMode(config, req.body?.params?.name, req.body?.params?.arguments); }
        catch (error) { argumentError = error instanceof Error ? error.message : 'Invalid arguments'; }
      }
      // Reject unsupported operations before any OBO exchange or native request.
      const nativeToken = prepared ? await dependencies.exchange(assertion) : undefined;
      server = new Server({ name: 'bc-native-cowork-bridge', version }, { capabilities: { tools: {} } });
      server.setRequestHandler(ListToolsRequestSchema, async () => publicDescriptor(config));
      server.setRequestHandler(CallToolRequestSchema, async (request) => {
        if (argumentError || !nativeToken || !prepared) {
          return { isError: true, content: [{ type: 'text', text: argumentError ?? 'Unsupported tool or arguments.' }] };
        }
        try {
          if (request.params.name !== 'bc_connection_check') {
            return await dependencies.read(nativeToken, request.params.name, prepared);
          }
          const result = await dependencies.discover(nativeToken);
          return { content: [{ type: 'text', text: JSON.stringify(result) }] };
        } catch {
          return { isError: true, content: [{ type: 'text', text:
            `Native MCP request failed. Check BC permissions, target configuration and consent. Reference: ${correlationId}` }] };
        }
      });
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => { void server?.close().catch(() => {}); });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      const failure = error instanceof AuthError ? error : new AuthError(500, 'bridge_error');
      if (failure.status === 401 || failure.status === 403) {
        const claims = failure.claims
          ? `, claims="${Buffer.from(failure.claims).toString('base64')}"` : '';
        res.setHeader('WWW-Authenticate', `Bearer resource_metadata="${config.publicUrl}/.well-known/oauth-protected-resource", error="${failure.code}"${claims}`);
      }
      res.status(failure.status).json({ error: failure.code, correlationId });
    }
  });
  app.all('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').end());
  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? '3000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
  createApp(readConfig()).listen(port, '0.0.0.0', () => console.log(`BC native bridge ${version} listening`));
}
