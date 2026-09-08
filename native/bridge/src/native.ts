import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { nativeHeaders, nativeUrl, type Config } from './config.js';
import { CallToolResultSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { prepareArguments, version } from './catalog.js';
import { prepareForMode, dynamicNames, confirmsListAction } from './dynamic.js';

async function withNativeClient<T>(config: Config, token: string, action: (client: Client) => Promise<T>, fetcher = fetch) {
  const client = new Client({ name: 'bc-native-cowork-bridge', version });
  const transport = new StreamableHTTPClientTransport(new URL(nativeUrl), {
    requestInit: { headers: { ...nativeHeaders(config), Authorization: `Bearer ${token}` } },
    fetch: (url, init) => fetcher(url, {
      ...init, redirect: 'error',
      signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(20000)]) : AbortSignal.timeout(20000)
    })
  });
  try {
    await client.connect(transport);
    return await action(client);
  } finally {
    await transport.terminateSession().catch(() => {});
    await client.close().catch(() => {});
  }
}

async function listNativeTools(client: Client) {
  const tools: Tool[] = [];
  const seen = new Set<string>();
  let cursor: string | undefined;
  do {
    const page = await client.listTools(cursor ? { cursor } : {});
    tools.push(...page.tools);
    if (tools.length > 200) throw new Error('Native catalog exceeds limit');
    cursor = page.nextCursor;
    if (cursor && (seen.has(cursor) || seen.size >= 20)) throw new Error('Invalid native pagination');
    if (cursor) seen.add(cursor);
  } while (cursor);
  return tools;
}

export async function discoverNative(config: Config, token: string, fetcher = fetch) {
  return withNativeClient(config, token, async client => ({
    connected: true, source: nativeUrl,
    target: { tenantId: config.tenantId, environment: config.environment, company: config.company, configuration: config.configuration },
    nativeServer: client.getServerVersion(), tools: await listNativeTools(client),
    note: 'Only initialization and tools/list were executed. Business data access and tool execution are not validated by this check.'
  }), fetcher);
}

export async function readNative(config: Config, token: string, name: string, args: unknown, fetcher = fetch) {
  // Check the fixed allowlist before opening an upstream connection.
  if (name === 'bc_connection_check') throw new Error('Not a business read tool');
  const parameters = prepareArguments(name, args);
  return withNativeClient(config, token, async client => {
    const matches = (await listNativeTools(client)).filter(tool => tool.name === name);
    if (matches.length !== 1 || matches[0].annotations?.readOnlyHint !== true ||
        matches[0].annotations?.destructiveHint !== false) {
      throw new Error('The native tool is absent or no longer explicitly read-only.');
    }
    // Preserve text, structuredContent and isError exactly as returned by BC.
    return client.callTool({ name, arguments: parameters }, CallToolResultSchema);
  }, fetcher);
}

export async function callDynamicNative(config: Config, token: string, name: string, args: unknown, fetcher = fetch) {
  if (config.toolMode !== 'dynamic' || !(dynamicNames as readonly string[]).includes(name)) {
    throw new Error('Not a dynamic tool');
  }
  // Reject unsupported operation shapes and arguments before connecting upstream.
  const parameters = prepareForMode(config, name, args);
  return withNativeClient(config, token, async client => {
    const catalog = await listNativeTools(client);
    for (const required of name === 'bc_actions_invoke' ? [name, 'bc_actions_describe'] : [name]) {
      if (catalog.filter(t => t.name === required).length !== 1) {
        throw new Error('Required dynamic tool is missing from the native catalog. Check ConfigurationName and Dynamic Tool Mode.');
      }
    }
    // Resolve the action's current descriptor in this user's BC session for every call.
    // No per-entity bridge policy, descriptor cache or client-supplied authorization.
    if (name === 'bc_actions_invoke') {
      const described = await client.callTool({ name: 'bc_actions_describe',
        arguments: { ActionName: parameters.ActionName } }, CallToolResultSchema);
      if (described.isError) return described;
      if (!confirmsListAction(described, parameters.ActionName as string)) {
        return { isError: true, content: [{ type: 'text', text:
          'Bridge validation rejected the native action descriptor: expected the exact List action name and a supported query schema. No action was executed. This is a bridge compatibility check, not a BC permission error.' }] };
      }
    }
    return client.callTool({ name, arguments: parameters }, CallToolResultSchema);
  }, fetcher);
}
