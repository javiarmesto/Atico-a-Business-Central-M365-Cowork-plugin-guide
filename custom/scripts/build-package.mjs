import { mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validateConfig as validateIdentity } from '../../native/scripts/build-package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export function validateConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Config must be an object');
  const allowed = ['appId', 'version', 'language', 'example', 'endpoint', 'oauthReferenceId', 'name', 'description', 'developer'];
  if (Object.keys(c).some(k => !allowed.includes(k))) throw new Error('Unsupported config field; never add secrets or authentication overrides');
  if (!['en', 'es'].includes(c.language)) throw new Error('language must be en or es');
  if (!['none', 'collections'].includes(c.example)) throw new Error('example must be none or collections');
  const { language, example, ...identity } = c;
  validateIdentity({ ...identity, mode: 'dynamic' });
  return c;
}
export async function buildPackage(configPath = resolve(root, 'plugin.config.local.json'), output = resolve(root, 'build/appPackage')) {
  const c = validateConfig(JSON.parse(await readFile(configPath, 'utf8')));
  const manifest = JSON.parse(await readFile(resolve(root, 'appPackage/manifest.template.json'), 'utf8'));
  const toolFile = `bc-custom-read.${c.language}.json`;
  const toolText = await readFile(resolve(root, 'appPackage/tools', toolFile), 'utf8');
  const catalog = JSON.parse(toolText);
  if (!Array.isArray(catalog.tools) || !catalog.tools.length || catalog.tools.some(t => typeof t.name !== 'string' || !t.name.trim() || t.inputSchema?.type !== 'object') || new Set(catalog.tools.map(t => t.name)).size !== catalog.tools.length) throw new Error('Invalid custom tool catalog');
  const icons = {};
  for (const [name, size] of [['color.png', 192], ['outline.png', 32]]) {
    const data = await readFile(resolve(root, 'appPackage/icons', name));
    if (data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.readUInt32BE(16) !== size || data.readUInt32BE(20) !== size) throw new Error(`${name} must be a ${size}x${size} PNG`);
    icons[name] = data;
  }
  const skill = resolve(root, '../examples/collections', c.language, 'skills/bc-collections-intervention');
  if (c.example === 'collections') await readFile(resolve(skill, 'SKILL.md'), 'utf8');
  Object.assign(manifest, { id: c.appId, version: c.version, name: c.name, description: c.description, developer: c.developer });
  manifest.agentConnectors = [{
    id: 'bc-custom-connection',
    displayName: c.language === 'es' ? 'Business Central MCP personalizado' : 'Business Central custom MCP',
    description: c.description.short,
    toolSource: { remoteMcpServer: {
      mcpServerUrl: c.endpoint, mcpToolDescription: { file: `tools/${toolFile}` },
      authorization: { type: 'OAuthPluginVault', referenceId: c.oauthReferenceId }
    } }
  }];
  if (c.example === 'collections') manifest.agentSkills = [{ folder: './skills/bc-collections-intervention' }];
  await rm(output, { recursive: true, force: true });
  await mkdir(resolve(output, 'tools'), { recursive: true });
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(resolve(output, 'tools', toolFile), toolText);
  for (const [name, data] of Object.entries(icons)) await writeFile(resolve(output, name), data);
  if (c.example === 'collections') await cp(skill, resolve(output, 'skills/bc-collections-intervention'), { recursive: true });
  return output;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--config')) throw new Error('Usage: node custom/scripts/build-package.mjs [--config PATH]');
  console.log(`Generated ${await buildPackage(args.length ? resolve(args[1]) : undefined)}. Package with atk package.`);
}
