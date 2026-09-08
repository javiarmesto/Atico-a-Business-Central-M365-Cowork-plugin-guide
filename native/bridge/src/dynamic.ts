import { readFileSync } from 'node:fs';
import { CallToolResultSchema, type Tool } from '@modelcontextprotocol/sdk/types.js';
import { prepareListArguments, prepareArguments, descriptor } from './catalog.js';
import type { Config } from './config.js';

export const dynamicNames = ['bc_actions_search', 'bc_actions_describe', 'bc_actions_invoke'] as const;
export const dynamicDescriptor: { tools: Tool[] } = JSON.parse(readFileSync(
  new URL('../../../appPackage/tools/bc-native-dynamic.json', import.meta.url), 'utf8'));

export function publicDescriptor(config: Config) {
  if (config.toolMode === 'static') return descriptor;
  return dynamicDescriptor;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Arguments must be a JSON object.');
  return value as Record<string, unknown>;
}
function keys(input: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(input).some(k => !allowed.includes(k))) throw new Error('Unsupported argument.');
}

export function prepareForMode(config: Config, name: string, args: unknown): Record<string, unknown> {
  if (name === 'bc_connection_check' || config.toolMode === 'static') return prepareArguments(name, args);
  const input = object(args ?? {});
  if (name === 'bc_actions_search') {
    keys(input, ['SearchText', 'SearchMode', 'ActionType', 'Top']);
    if (typeof input.SearchText !== 'string' || !input.SearchText.trim() || input.SearchText.length > 4096) {
      throw new Error('SearchText must contain 1–4096 characters.');
    }
    if (input.SearchMode !== 'keyword' && input.SearchMode !== 'semantic') throw new Error('Invalid SearchMode.');
    if (!Array.isArray(input.ActionType) || input.ActionType.length !== 1 || input.ActionType[0] !== 'List') {
      throw new Error('Only ActionType ["List"] is supported.');
    }
    const top = input.Top ?? 15;
    if (!Number.isInteger(top) || (top as number) < 5 || (top as number) > 50) throw new Error('Top must be an integer from 5 to 50.');
    return { ...input, Top: top };
  }
  if (name !== 'bc_actions_describe' && name !== 'bc_actions_invoke') throw new Error('Tool is not enabled in dynamic mode.');
  keys(input, name === 'bc_actions_describe' ? ['ActionName'] : ['ActionName', 'RequestParameters']);
  if (typeof input.ActionName !== 'string' || !input.ActionName.trim() || input.ActionName.length > 256 || /[\r\n]/.test(input.ActionName)) {
    throw new Error('Invalid ActionName. Use the exact name returned by search.');
  }
  // Metadata discovery is delegated to BC.
  if (name === 'bc_actions_describe') return { ActionName: input.ActionName };
  // A preliminary operation-shape check, not authorization. The live BC descriptor
  // and delegated user permissions decide whether this action can actually execute.
  if (!/^List(?!Update)(?:_|[A-Z])[^\r\n]+_PAG[0-9]+$/.test(input.ActionName)) {
    throw new Error('Only List API-page queries are supported; writes and bound actions are not enabled.');
  }
  if (typeof input.RequestParameters !== 'string' || input.RequestParameters.length > 16384) {
    throw new Error('RequestParameters must be a JSON object encoded as a string (maximum 16384 characters).');
  }
  let parsed: unknown;
  try { parsed = JSON.parse(input.RequestParameters); }
  catch { throw new Error('RequestParameters is not valid JSON.'); }
  const parameters = prepareListArguments(object(parsed));
  return { ActionName: input.ActionName, RequestParameters: JSON.stringify(parameters) };
}

const listActionName = /^List_[A-Za-z0-9_]+_PAG[0-9]+$/;

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// BC 28 describe returns {name, description, schema}, not an MCP Tool.
// Verify the live List query contract. BC remains the authorization boundary;
// _availableFields.readOnly describes a schema property, not action permissions.
export function confirmsListAction(input: unknown, actionName: string): boolean {
  if (!listActionName.test(actionName)) return false;
  const parsed = CallToolResultSchema.safeParse(input);
  if (!parsed.success) return false;
  const result = parsed.data;
  if (result.isError) return false;
  const candidates: Record<string, unknown>[] = [];
  const collect = (value: unknown) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const item = value as Record<string, unknown>;
      candidates.push(item);
    }
  };
  collect(result.structuredContent);
  for (const block of result.content) {
    if (block.type !== 'text') continue;
    const start = block.text.indexOf('{');
    const end = block.text.lastIndexOf('}');
    if (start < 0 || end < start) continue;
    try { collect(JSON.parse(block.text.slice(start, end + 1))); } catch { return false; }
  }
  return candidates.length > 0 && candidates.every(item => {
    if (item.name !== actionName) return false;
    const hints = item.annotations;
    if (hints !== undefined && (!record(hints) || hints.readOnlyHint === false || hints.destructiveHint === true)) return false;
    if (item.schema === undefined) {
      // Retain compatibility with actual MCP Tool descriptors, when supplied.
      return record(item.inputSchema) && item.inputSchema.type === 'object' &&
        record(hints) && hints.readOnlyHint === true;
    }
    // Do not resolve ambiguous descriptors or arbitrary nested schema examples.
    if (item.inputSchema !== undefined || !record(item.schema)) return false;
    const schema = item.schema;
    if (schema.type !== 'object' || !record(schema.properties)) return false;
    const properties = schema.properties;
    const types: Record<string, string[]> = {
      _availableFields: ['string'], filter: ['string'], orderby: ['string'],
      select: ['string'], top: ['number', 'integer'], skip: ['number', 'integer'], resultFormat: ['string']
    };
    if (!['filter', 'orderby', 'select', 'top', 'skip', 'resultFormat'].every(key => key in properties)) return false;
    if (!Object.entries(properties).every(([key, value]) =>
      key in types && record(value) && types[key].includes(String(value.type)))) return false;
    if (schema.required !== undefined && (!Array.isArray(schema.required) ||
        !schema.required.every(key => typeof key === 'string' && key !== '_availableFields' && key in types))) return false;
    const format = properties.resultFormat as Record<string, unknown>;
    return Array.isArray(format.enum) && format.enum.includes('text') &&
      format.enum.every(value => value === 'text' || value === 'resource');
  });
}
