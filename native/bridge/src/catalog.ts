import { readFileSync } from 'node:fs';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const version = '0.3.2';
export const readToolNames = ['List_Items_PAG30008', 'List_Customers_PAG30009'] as const;
export const descriptor: { tools: Tool[] } = JSON.parse(readFileSync(
  new URL('../../../appPackage/tools/bc-native-read.json', import.meta.url), 'utf8'));
export const isReadTool = (name: string) => (readToolNames as readonly string[]).includes(name);

export function prepareArguments(name: string, args: unknown): Record<string, unknown> {
  if (args === undefined) args = {};
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Arguments must be an object.');
  const input = args as Record<string, unknown>;
  if (name === 'bc_connection_check') {
    if (Object.keys(input).length) throw new Error('Connection check takes no arguments.');
    return {};
  }
  if (!isReadTool(name)) throw new Error('This tool is not enabled by the read-only adapter.');
  return prepareListArguments(input);
}

export function prepareListArguments(input: Record<string, unknown>): Record<string, unknown> {
  const allowed = ['filter', 'orderby', 'select', 'top', 'skip', 'resultFormat'];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new Error('Unsupported argument.');
  for (const key of ['filter', 'orderby', 'select']) {
    if (input[key] !== undefined && (typeof input[key] !== 'string' || (input[key] as string).length > 4096)) {
      throw new Error(`${key} must be a string of at most 4096 characters.`);
    }
  }
  const top = input.top === undefined ? 10 : input.top;
  if (typeof top !== 'number' || !Number.isInteger(top) || top < 1 || top > 100) throw new Error('top must be an integer from 1 to 100.');
  if (input.skip !== undefined && (typeof input.skip !== 'number' || !Number.isSafeInteger(input.skip) || input.skip < 0)) {
    throw new Error('skip must be a non-negative safe integer.');
  }
  if (input.resultFormat !== undefined && input.resultFormat !== 'text') throw new Error('Only resultFormat text is supported.');
  return { ...input, top, resultFormat: 'text' };
}
