import test from 'node:test';
import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { readConfig, nativeUrl } from '../src/config.js';
import { prepareForMode, publicDescriptor, confirmsListAction } from '../src/dynamic.js';
import { callDynamicNative } from '../src/native.js';
import { createApp } from '../src/server.js';

const env = {
  BC_TENANT_ID: '11111111-1111-4111-8111-111111111111', BRIDGE_CLIENT_ID: '22222222-2222-4222-8222-222222222222',
  COWORK_CLIENT_ID: '33333333-3333-4333-8333-333333333333', BRIDGE_CLIENT_SECRET: 'test-only',
  BRIDGE_PUBLIC_URL: 'https://bridge.test', BC_ENVIRONMENT_NAME: 'atico', BC_COMPANY: 'CRONUS USA, Inc.',
  BC_CONFIGURATION_NAME: 'cowork-dynamic', BC_TOOL_MODE: 'dynamic'
};
// Native BC 28 describe response supplied by Javier on 2026-09-07. No business records.
const vendorDescribeText = String.raw`{"name":"List_Vendors_PAG30010","description":"Lists records for an entity Vendors. Exposes vendor master data including company details, addresses, contact information, payment terms, tax registration, currency, and financial balances. Supports full CRUD operations for supplier onboarding, procurement automation, and synchronizing vendor records with external ERP or procurement systems. Enables seamless integration and lifecycle management of supplier information for purchasing and financial processes.","schema":{"type":"object","properties":{"_availableFields":{"type":"string","description":"Available fields: id [string/uuid], number [string], displayName [string], addressLine1 [string], addressLine2 [string], city [string], state [string], country [string], postalCode [string], phoneNumber [string], email [string], website [string], taxRegistrationNumber [string], currencyId [string/uuid], currencyCode [string], irs1099Code [string], paymentTermsId [string/uuid], paymentMethodId [string/uuid], taxLiable [boolean], blocked [string ['\u0020', 'Payment', 'All']], balance [number/decimal], lastModifiedDateTime [string/date-time] (22 total). All fields can be used in select. Non-filterable fields cannot be used in filter and orderby.","readOnly":true,"x-non-filterable":["taxRegistrationNumber","currencyCode","irs1099Code"]},"filter":{"type":"string","description":"OData V4.0 filter. Supported Operators: eq, ne, lt, le, gt, ge, and, or. Functions: contains, startswith, endswith, tolower, toupper. Use tolower() for case-insensitive: contains(tolower(field),'text'). 'or' ONLY works on the same field; use 'and' across fields. 'not' is unsupported; for simple inequality, use 'ne'. Avoid negating expressions or compound predicates. No arithmetic, no length/month/year/cast/concat. See _availableFields for filterable properties and their types. Non-filterable fields are not filterable (see x-non-filterable extension)."},"orderby":{"type":"string","description":"OData V4.0 orderby (e.g. 'property asc', 'property1 desc, property2'). See _availableFields for sortable properties. Non-filterable fields are not sortable (see x-non-filterable extension)."},"select":{"type":"string","description":"Comma-separated list of properties to include in the response, e.g., \"select=name,id\". Returns all if not specified. See _availableFields for available properties."},"top":{"type":"number","description":"Maximum records to return (default/recommended: 10). Use with $skip for pagination."},"skip":{"type":"number","description":"Number of records to skip before returning results. Use with $top for pagination."},"resultFormat":{"enum":["text","resource"],"type":"string","description":"Controls how results are returned. Use 'text' (default) for quick inline answers or when you will interpret the response data directly. Use 'resource' when your intent is to run code execution tools for data analysis, visualizations, or when the response may be large."}}}}`;
const vendorDescribe = JSON.parse(vendorDescribeText);
const config = readConfig(env);
const invoke = { ActionName: 'List_Customers_PAG30009', RequestParameters: '{"top":5,"select":"number,displayName"}' };
const search = { SearchText: 'customers', SearchMode: 'keyword', ActionType: ['List'] };

test('dynamic parameters enforce List search, List operation shape and serialized bounded query parameters', () => {
  assert.deepEqual(prepareForMode(config, 'bc_actions_search', search), { ...search, Top: 15 });
  assert.deepEqual(JSON.parse(prepareForMode(config, 'bc_actions_invoke', invoke).RequestParameters as string), {
    top: 5, select: 'number,displayName', resultFormat: 'text'
  });
  for (const bad of [[], ['Create'], ['List', 'Delete']]) {
    assert.throws(() => prepareForMode(config, 'bc_actions_search', { ...search, ActionType: bad }));
  }
  for (const top of [4, 51, 5.5]) assert.throws(() => prepareForMode(config, 'bc_actions_search', { ...search, Top: top }));
  for (const action of ['Delete_Customers_PAG30009', 'ListUpdate_Customers_PAG30009', 'list_Customers_PAG30009']) {
    assert.throws(() => prepareForMode(config, 'bc_actions_invoke', { ...invoke, ActionName: action }));
  }
  for (const params of ['null', '[]', 'invalid', '{"top":101}', '{"resultFormat":"resource"}', '{"Company":"other"}', '{"method":"POST"}']) {
    assert.throws(() => prepareForMode(config, 'bc_actions_invoke', { ...invoke, RequestParameters: params }));
  }
  assert.throws(() => prepareForMode(config, 'bc_actions_invoke', { ...invoke, RequestParameters: { top: 5 } }));
  assert.throws(() => prepareForMode(config, 'List_Customers_PAG30009', {}));
  assert.throws(() => prepareForMode(config, 'mcp_microsoft_dyn_bc_actions_search', search));
  assert.throws(() => prepareForMode(readConfig({ ...env, BC_TOOL_MODE: 'static' }), 'bc_actions_search', search));
});

test('any List API entity can proceed to BC verification without a bridge list; legacy variable is ignored', () => {
  for (const legacy of ['', 'List_Customers_PAG30009', 'obsolete']) {
    const current = readConfig({ ...env, BC_DYNAMIC_READ_ACTIONS: legacy });
    assert.ok(prepareForMode(current, 'bc_actions_invoke', { ...invoke, ActionName: 'List_Vendors_PAG30010' }));
    assert.ok(prepareForMode(current, 'bc_actions_invoke', { ...invoke, ActionName: 'List_AdditionalEntity_PAG50100' }));
    assert.doesNotMatch(JSON.stringify(publicDescriptor(current)), /BC_DYNAMIC_READ_ACTIONS|Acciones autorizadas para ejecutar/);
  }
  assert.throws(() => readConfig({ ...env, BC_TOOL_MODE: 'typo' }));
});

test('live action verification requires exact identity and explicit read-only metadata', () => {
  const name = 'List_AdditionalEntity_PAG50100';
  const schema = { name, inputSchema: { type: 'object' }, annotations: { readOnlyHint: true, destructiveHint: false } };
  assert.ok(confirmsListAction({ content: [], structuredContent: schema }, name));
  assert.ok(confirmsListAction({ content: [{ type: 'text', text: 'Here is the action schema you requested:\n' + JSON.stringify(schema) }] }, name));
  for (const bad of [{ ...schema, name: 'List_Other_PAG50101' }, { ...schema, annotations: {} },
    { ...schema, annotations: { readOnlyHint: false } }, { ...schema, annotations: { readOnlyHint: true, destructiveHint: true } }]) {
    assert.equal(confirmsListAction({ content: [{ type: 'text', text: JSON.stringify(bad) }] }, name), false);
  }
  assert.equal(confirmsListAction({ content: [{ type: 'text', text: 'This action is readOnly=true' }] }, name), false);
  assert.equal(confirmsListAction({ isError: true, content: [], structuredContent: schema }, name), false);
  assert.equal(confirmsListAction({ content: [{ type: 'text', text: '{invalid}' }] }, name), false);
});

test('BC 28 schema envelope works without annotations; property readOnly is not authorization', () => {
  const name = vendorDescribe.name;
  for (const response of [
    { content: [{ type: 'text', text: vendorDescribeText }] },
    { content: [{ type: 'text', text: 'Here is the action schema you requested:\n' + vendorDescribeText }] },
    { content: [], structuredContent: vendorDescribe }
  ]) assert.ok(confirmsListAction(response, name));
  const withoutPropertyHint = structuredClone(vendorDescribe);
  delete withoutPropertyHint.schema.properties._availableFields.readOnly;
  assert.ok(confirmsListAction({ content: [], structuredContent: withoutPropertyHint }, name));
  const unknownEntity = { ...vendorDescribe, name: 'List_AdditionalEntity_PAG50100' };
  assert.ok(confirmsListAction({ content: [], structuredContent: unknownEntity }, unknownEntity.name));
  for (const bad of [
    { ...vendorDescribe, name: 'List_Other_PAG50101' },
    { ...vendorDescribe, schema: {} },
    { ...vendorDescribe, schema: { type: 'object', properties: { _availableFields: { type: 'string', readOnly: true } } } },
    { ...vendorDescribe, annotations: { readOnlyHint: false } },
    { ...vendorDescribe, annotations: { destructiveHint: true } },
    { ...vendorDescribe, inputSchema: { type: 'object' } },
    { ...vendorDescribe, schema: { ...vendorDescribe.schema, properties: { ...vendorDescribe.schema.properties, body: { type: 'object' } } } },
    { ...vendorDescribe, schema: { ...vendorDescribe.schema, properties: { ...vendorDescribe.schema.properties, top: { type: 'string' } } } },
    { ...vendorDescribe, schema: { ...vendorDescribe.schema, required: ['body'] } }
  ]) assert.equal(confirmsListAction({ content: [], structuredContent: bad }, name), false);
  for (const action of ['Create_Vendors_PAG30010', 'Delete_Vendors_PAG30010', 'ListUpdate_Vendors_PAG30010']) {
    assert.equal(confirmsListAction({ content: [], structuredContent: { ...vendorDescribe, name: action } }, action), false);
  }
  assert.equal(confirmsListAction({ content: [{ type: 'text', text: JSON.stringify({ ...vendorDescribe, name: 'List_Other_PAG50101' }) }], structuredContent: vendorDescribe }, name), false);
});

test('native dynamic invoke checks live tool names, describes first, preserves BC errors and never needs fabricated annotations', async () => {
  for (const mode of ['ok', 'native-schema', 'describe-error', 'invoke-error', 'missing-tool', 'denied', 'not-read-only', 'wrong-action']) {
    const request = mode === 'native-schema' ? { ...invoke, ActionName: vendorDescribe.name } : invoke;
    const calls: string[] = [];
    let connections = 0;
    const expected = { content: [{ type: 'text', text: 'simulated BC result' }], structuredContent: { value: [{ number: '10000' }] }, isError: mode === 'invoke-error' };
    const fetcher: typeof fetch = async (_url, init) => {
      if (init?.method !== 'POST') return new Response(null, { status: 405 });
      const h = new Headers(init.headers);
      assert.equal(h.get('ConfigurationName'), 'cowork-dynamic');
      assert.equal(h.get('Authorization'), 'Bearer delegated-test-user');
      const req = JSON.parse(String(init.body));
      if (!('id' in req)) return new Response(null, { status: 202 });
      let result;
      if (req.method === 'initialize') {
        connections++;
        result = { protocolVersion: req.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'mock', version: 'test' } };
      } else if (req.method === 'tools/list') {
        result = { tools: (mode === 'missing-tool' ? ['bc_actions_describe'] : ['bc_actions_search', 'bc_actions_describe', 'bc_actions_invoke'])
          .map(name => ({ name, inputSchema: { type: 'object' } })) };
      } else {
        assert.equal(req.method, 'tools/call'); calls.push(req.params.name);
        assert.equal(req.params.arguments.ActionName, request.ActionName);
        if (req.params.name === 'bc_actions_describe') result = {
          content: [{ type: 'text', text: 'Here is the action schema you requested:\n' + JSON.stringify(mode === 'native-schema' ? vendorDescribe : { name: mode === 'wrong-action' ? 'List_Other_PAG50101' : invoke.ActionName, inputSchema: { type: 'object' }, annotations: { readOnlyHint: mode !== 'not-read-only', destructiveHint: false } }) }], isError: mode === 'describe-error'
        };
        else {
          assert.equal(req.params.name, 'bc_actions_invoke');
          assert.equal(typeof req.params.arguments.RequestParameters, 'string');
          assert.equal(JSON.parse(req.params.arguments.RequestParameters).top, 5);
          result = expected;
        }
      }
      return Response.json({ jsonrpc: '2.0', id: req.id, result });
    };
    const promise = callDynamicNative(config, 'delegated-test-user', 'bc_actions_invoke',
      mode === 'denied' ? { ...invoke, ActionName: 'Delete_Customers_PAG30009' } : request, fetcher);
    if (mode === 'missing-tool' || mode === 'denied') {
      await assert.rejects(promise); assert.deepEqual(calls, []);
      if (mode === 'denied') assert.equal(connections, 0);
    } else if (['describe-error', 'not-read-only', 'wrong-action'].includes(mode)) {
      assert.equal((await promise).isError, true); assert.deepEqual(calls, ['bc_actions_describe']);
    } else {
      assert.deepEqual(await promise, expected); assert.deepEqual(calls, ['bc_actions_describe', 'bc_actions_invoke']);
    }
  }
});

test('HTTP dynamic catalog and calls keep delegated callers isolated and reject writes before OBO', async () => {
  const exchanged: string[] = [];
  const received: string[] = [];
  const app = createApp(config, {
    verify: async header => { assert.match(header!, /^Bearer user-[ab]$/); return header!.slice(7); },
    exchange: async token => { exchanged.push(token); return `native-${token}`; },
    discover: async () => ({ connected: true, source: nativeUrl, target: { tenantId: config.tenantId,
      environment: config.environment, company: config.company, configuration: config.configuration }, nativeServer: undefined, tools: [], note: 'mock' }),
    read: async (token, name, args) => {
      assert.equal(name, 'bc_actions_search'); assert.deepEqual(args.ActionType, ['List']); received.push(token);
      return { content: [{ type: 'text' as const, text: 'mock search result' }] };
    }
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const clients: Client[] = [];
  try {
    for (const user of ['user-a', 'user-b']) {
      const client = new Client({ name: 'test', version: '1' }); clients.push(client);
      await client.connect(new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${address.port}/mcp`), {
        requestInit: { headers: { Authorization: `Bearer ${user}` } }
      }));
      assert.deepEqual((await client.listTools()).tools.map(t => t.name), ['bc_connection_check', 'bc_actions_search', 'bc_actions_describe', 'bc_actions_invoke']);
      assert.equal((await client.callTool({ name: 'bc_actions_invoke', arguments: { ...invoke, ActionName: 'Delete_Customers_PAG30009' } })).isError, true);
      assert.notEqual((await client.callTool({ name: 'bc_actions_search', arguments: search })).isError, true);
    }
    assert.deepEqual(exchanged, ['user-a', 'user-b']);
    assert.deepEqual(received, ['native-user-a', 'native-user-b']);
  } finally {
    for (const client of clients) await client.close();
    await new Promise<void>((resolve, reject) => server.close(e => e ? reject(e) : resolve()));
  }
});
