import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, exportJWK, createLocalJWKSet, SignJWT } from 'jose';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readConfig, nativeHeaders, nativeScope, nativeUrl } from '../src/config.js';
import { AuthError, makeVerifier, exchangeToken } from '../src/auth.js';
import { discoverNative, readNative } from '../src/native.js';
import { createApp } from '../src/server.js';
import { prepareArguments } from '../src/catalog.js';

const config = readConfig({
  BC_TENANT_ID: '11111111-1111-4111-8111-111111111111',
  BRIDGE_CLIENT_ID: '22222222-2222-4222-8222-222222222222',
  COWORK_CLIENT_ID: '33333333-3333-4333-8333-333333333333',
  BRIDGE_CLIENT_SECRET: 'unit-test-secret', BRIDGE_PUBLIC_URL: 'https://bridge.test',
  BC_ENVIRONMENT_NAME: 'atico', BC_COMPANY: 'CRONUS USA, Inc.', BC_CONFIGURATION_NAME: 'v1 workshop'
});
const keys = await generateKeyPair('RS256');
const jwk = await exportJWK(keys.publicKey);
const verify = makeVerifier(config, createLocalJWKSet({ keys: [{ ...jwk, kid: 'unit-test', alg: 'RS256' }] }));
async function issue(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ ver: '2.0', tid: config.tenantId, oid: 'test-user',
    azp: config.callerClientId, scp: 'access_as_user', ...overrides })
    .setProtectedHeader({ alg: 'RS256', kid: 'unit-test' })
    .setIssuer(config.issuer).setAudience(config.clientId).setIssuedAt().setExpirationTime('5m')
    .sign(keys.privateKey);
}

test('accepts only delegated v2 tokens for the fixed tenant, API and OAuth client', async () => {
  const token = await issue();
  assert.equal(await verify(`Bearer ${token}`), token);
  for (const overrides of [{ tid: 'other' }, { azp: 'other' }, { ver: '1.0' },
    { scp: undefined, roles: ['access_as_user'] }, { scp: 'other_scope' }]) {
    await assert.rejects(verify(`Bearer ${await issue(overrides)}`), AuthError);
  }
  const wrongAudience = await new SignJWT({ tid: config.tenantId }).setProtectedHeader({ alg: 'RS256', kid: 'unit-test' })
    .setIssuer(config.issuer).setAudience('another-api').setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  await assert.rejects(verify(`Bearer ${wrongAudience}`), AuthError);
  await assert.rejects(verify(), AuthError);
  await assert.rejects(verify('Bearer forged'), AuthError);
});

test('OBO targets native MCP, preserves the user assertion and does not return provider diagnostics', async () => {
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(url, config.tokenUrl);
    const body = new URLSearchParams(String(init?.body));
    assert.equal(body.get('assertion'), 'user-assertion');
    assert.equal(body.get('requested_token_use'), 'on_behalf_of');
    assert.equal(body.get('scope'), nativeScope);
    assert.equal(body.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer');
    assert.equal(init?.redirect, 'error');
    return Response.json({ access_token: 'opaque-native-token', token_type: 'Bearer' });
  };
  assert.equal(await exchangeToken(config, 'user-assertion', fetcher), 'opaque-native-token');
  await assert.rejects(exchangeToken(config, 'user-assertion', async () => Response.json({
    error: 'invalid_client', error_description: 'sensitive-provider-detail'
  }, { status: 400 })), (error: AuthError) => error.code === 'token_exchange_failed' && !error.message.includes('sensitive'));
  await assert.rejects(exchangeToken(config, 'user-assertion', async () => Response.json({
    error: 'interaction_required', claims: '{"access_token":{}}'
  }, { status: 400 })), (error: AuthError) => error.status === 401 && Boolean(error.claims));
});

test('BC headers encode Unicode and reject line breaks', () => {
  assert.equal(nativeHeaders(config).ConfigurationName, 'v1 workshop');
  assert.equal(nativeHeaders({ ...config, company: 'Ático' }).Company,
    `=?base64?${Buffer.from('Ático').toString('base64')}?=`);
  assert.throws(() => nativeHeaders({ ...config, company: 'company\r\nInjected: value' }));
});

test('native discovery sends fixed headers and the exchanged token, follows pagination, never calls business tools', async () => {
  const methods: string[] = [];
  const fetcher: typeof fetch = async (url, init) => {
    assert.equal(String(url).replace(/\/$/, ''), nativeUrl);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('Authorization'), 'Bearer native-only');
    assert.equal(headers.get('TenantId'), config.tenantId);
    assert.equal(headers.get('EnvironmentName'), 'atico');
    assert.equal(headers.get('ConfigurationName'), 'v1 workshop');
    assert.equal(headers.get('Company'), config.company);
    assert.equal(init?.redirect, 'error');
    if (init?.method !== 'POST') return new Response(null, { status: 405 });
    const request = JSON.parse(String(init.body));
    methods.push(request.method);
    if (!('id' in request)) return new Response(null, { status: 202 });
    let result;
    if (request.method === 'initialize') result = {
      protocolVersion: request.params.protocolVersion, capabilities: { tools: {} },
      serverInfo: { name: 'fake-native-for-test', version: 'test' }
    };
    else {
      assert.equal(request.method, 'tools/list');
      result = request.params?.cursor ? { tools: [{ name: 'test-two', inputSchema: { type: 'object' } }] }
        : { tools: [{ name: 'test-one', inputSchema: { type: 'object' } }], nextCursor: 'page2' };
    }
    return Response.json({ jsonrpc: '2.0', id: request.id, result });
  };
  const result = await discoverNative(config, 'native-only', fetcher);
  assert.equal(result.tools.length, 2);
  assert.deepEqual(methods, ['initialize', 'notifications/initialized', 'tools/list', 'tools/list']);
});

test('HTTP MCP isolates two callers, exposes only selected tools and rejects invalid calls before OBO', async () => {
  const received: string[] = [];
  const readReceived: string[] = [];
  let exchanges = 0;
  const tokens = [await issue({ oid: 'user-a' }), await issue({ oid: 'user-b' })];
  const app = createApp(config, {
    verify,
    exchange: async (token) => {
      exchanges++;
      const index = tokens.indexOf(token);
      assert.notEqual(index, -1);
      return `native-user-${index}`;
    },
    discover: async (token) => {
      received.push(token);
      return { connected: true, source: nativeUrl,
        target: { tenantId: config.tenantId, environment: config.environment, company: config.company, configuration: config.configuration },
        nativeServer: undefined, tools: [], note: 'simulated' };
    },
    read: async (token, name, args) => {
      readReceived.push(token);
      assert.equal(name, 'List_Customers_PAG30009');
      assert.deepEqual(args, { top: 5, select: 'number,displayName', resultFormat: 'text' });
      return { content: [{ type: 'text' as const, text: 'simulated business data' }] };
    }
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}/mcp`;
  const clients: Client[] = [];
  try {
    const unauthorized = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get('WWW-Authenticate')!, /resource_metadata/);
    await Promise.all(tokens.map(async (token) => {
      const client = new Client({ name: 'test-cowork', version: 'test' });
      clients.push(client);
      await client.connect(new StreamableHTTPClientTransport(new URL(url), {
        requestInit: { headers: { Authorization: `Bearer ${token}` } }
      }));
      const catalog = await client.listTools();
      assert.deepEqual(catalog.tools.map(tool => tool.name), ['bc_connection_check', 'List_Items_PAG30008', 'List_Customers_PAG30009']);
      const denied = await client.callTool({ name: 'create-sales-order', arguments: {} });
      assert.equal(denied.isError, true);
      const result = await client.callTool({ name: 'bc_connection_check', arguments: {} });
      assert.notEqual(result.isError, true);
      const invalid = await client.callTool({ name: 'List_Customers_PAG30009', arguments: { top: 101 } });
      assert.equal(invalid.isError, true);
      const data = await client.callTool({ name: 'List_Customers_PAG30009', arguments: { top: 5, select: 'number,displayName' } });
      assert.deepEqual(data.content, [{ type: 'text', text: 'simulated business data' }]);
    }));
    assert.deepEqual(received.sort(), ['native-user-0', 'native-user-1']);
    assert.deepEqual(readReceived.sort(), ['native-user-0', 'native-user-1']);
    assert.equal(exchanges, 4);
  } finally {
    await Promise.all(clients.map(client => client.close()));
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
});

test('read parameters constrain pagination, reject routing overrides and never infer unsupported operations', () => {
  const name = 'List_Items_PAG30008';
  assert.deepEqual(prepareArguments(name, {}), { top: 10, resultFormat: 'text' });
  for (const args of [{ top: 0 }, { top: 1.5 }, { top: 101 }, { skip: -1 }, { skip: null },
    { filter: {} }, { resultFormat: 'resource' }, { TenantId: 'other' }, { _availableFields: 'id' }]) {
    assert.throws(() => prepareArguments(name, args));
  }
  assert.throws(() => prepareArguments('Update_Items_PAG30008', {}));
});

test('native read uses exact names and arguments, checks live read-only annotations, preserves errors and data', async () => {
  for (const name of ['List_Items_PAG30008', 'List_Customers_PAG30009']) {
    for (const mode of ['success', 'business-error', 'not-read-only', 'destructive', 'missing']) {
      let calls = 0;
      const expected = { content: [{ type: 'text', text: mode === 'business-error' ? 'BC rejected filter' : 'BC records' }],
        structuredContent: { value: mode === 'business-error' ? [] : [{ number: '10000' }] }, isError: mode === 'business-error' };
      const fetcher: typeof fetch = async (_url, init) => {
        if (init?.method !== 'POST') return new Response(null, { status: 405 });
        const request = JSON.parse(String(init.body));
        if (!('id' in request)) return new Response(null, { status: 202 });
        let result;
        if (request.method === 'initialize') result = {
          protocolVersion: request.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'fixture', version: 'test' }
        };
        else if (request.method === 'tools/list') result = { tools: mode === 'missing' ? [] : [{
          name, inputSchema: { type: 'object' }, annotations: { readOnlyHint: mode !== 'not-read-only', destructiveHint: mode === 'destructive' }
        }] };
        else {
          assert.equal(request.method, 'tools/call'); calls++;
          assert.equal(request.params.name, name);
          assert.deepEqual(request.params.arguments, { top: 5, skip: 10, select: 'number,displayName', filter: "number eq '10000'", orderby: 'number asc', resultFormat: 'text' });
          result = expected;
        }
        return Response.json({ jsonrpc: '2.0', id: request.id, result });
      };
      const read = readNative(config, 'native-token', name, { top: 5, skip: 10, select: 'number,displayName', filter: "number eq '10000'", orderby: 'number asc' }, fetcher);
      if (['not-read-only', 'destructive', 'missing'].includes(mode)) {
        await assert.rejects(read); assert.equal(calls, 0);
      } else { assert.deepEqual(await read, expected); assert.equal(calls, 1); }
    }
  }
});
