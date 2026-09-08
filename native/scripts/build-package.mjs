import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const modes = { dynamic: 'bc-native-dynamic.json', static: 'bc-native-read.json' };
const guid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
function text(value, label, max) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\r\n]/.test(value)) throw new Error(`Invalid ${label}`);
  return value;
}
function https(value, label) {
  const url = new URL(text(value, label, 2048));
  if (url.protocol !== 'https:' || url.username || url.password || /localhost|REPLACE|example\.(com|org|net)|[<>]/i.test(url.hostname)) throw new Error(`Use your HTTPS URL for ${label}`);
  return url;
}
export function validateConfig(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Error('Config must be an object');
  const allowed = ['appId', 'version', 'mode', 'endpoint', 'oauthReferenceId', 'name', 'description', 'developer'];
  if (Object.keys(c).some(k => !allowed.includes(k))) throw new Error('Unsupported config field; never put client secrets or tokens in plugin config');
  if (!guid.test(c.appId ?? '') || /^0{8}-/.test(c.appId)) throw new Error('Use a nonzero appId generated once by init-plugin.mjs');
  if (!/^\d+\.\d+\.\d+$/.test(c.version ?? '')) throw new Error('version must be major.minor.patch');
  if (!Object.hasOwn(modes, c.mode)) throw new Error('mode must be dynamic or static');
  const url = https(c.endpoint, 'endpoint');
  if (url.pathname !== '/mcp' || url.search || url.hash || url.hostname === 'mcp.businesscentral.dynamics.com') throw new Error('endpoint must be the bridge HTTPS /mcp URL');
  if (typeof c.oauthReferenceId !== 'string' || !/^[a-zA-Z0-9_+\/-]{8,2048}={0,2}$/.test(c.oauthReferenceId) || /REPLACE|PLACEHOLDER/i.test(c.oauthReferenceId)) throw new Error('Use the OAuth auth config ID from Teams');
  for (const [key, fields] of Object.entries({ name: { short: 30, full: 100 }, description: { short: 80, full: 4000 }, developer: { name: 32, websiteUrl: 2048, privacyUrl: 2048, termsOfUseUrl: 2048 } })) {
    if (!c[key] || typeof c[key] !== 'object' || Array.isArray(c[key]) || Object.keys(c[key]).some(k => !(k in fields))) throw new Error(`Invalid ${key}`);
    for (const [field, max] of Object.entries(fields)) text(c[key][field], `${key}.${field}`, max);
  }
  for (const key of ['websiteUrl', 'privacyUrl', 'termsOfUseUrl']) https(c.developer[key], `developer.${key}`);
  return c;
}

export async function buildPackage(configPath = resolve(root, 'plugin.config.local.json'), output = resolve(root, 'build/appPackage')) {
  const c = validateConfig(JSON.parse(await readFile(configPath, 'utf8')));
  const manifest = JSON.parse(await readFile(resolve(root, 'appPackage/manifest.template.json'), 'utf8'));
  const toolFile = modes[c.mode];
  // Validate all inputs before replacing generated output.
  const toolText = await readFile(resolve(root, 'appPackage/tools', toolFile), 'utf8');
  if (!Array.isArray(JSON.parse(toolText).tools)) throw new Error('Invalid tool catalog');
  for (const [icon, size] of [['color.png', 192], ['outline.png', 32]]) {
    const data = await readFile(resolve(root, 'appPackage/icons', icon));
    if (data.length < 24 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.readUInt32BE(16) !== size || data.readUInt32BE(20) !== size) throw new Error(`${icon} must be a ${size}x${size} PNG`);
  }
  Object.assign(manifest, { id: c.appId, version: c.version, name: c.name, description: c.description, developer: c.developer });
  manifest.agentConnectors = [{
    id: 'bc-native-connection', displayName: 'Business Central MCP nativo',
    description: 'Consulta Business Central mediante el adaptador delegado.',
    toolSource: { remoteMcpServer: {
      mcpServerUrl: c.endpoint, mcpToolDescription: { file: `tools/${toolFile}` },
      authorization: { type: 'OAuthPluginVault', referenceId: c.oauthReferenceId }
    } }
  }];
  await rm(output, { recursive: true, force: true });
  await mkdir(resolve(output, 'tools'), { recursive: true });
  await writeFile(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(resolve(output, 'tools', toolFile), toolText);
  for (const icon of ['color.png', 'outline.png']) await copyFile(resolve(root, 'appPackage/icons', icon), resolve(output, icon));
  return output;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--config')) throw new Error('Usage: node native/scripts/build-package.mjs [--config PATH]. Run init-plugin.mjs first.');
  console.log(`Generated ${await buildPackage(args.length ? resolve(args[1]) : undefined)}. Package this folder with atk package.`);
}
