import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(await readFile(resolve(root, 'plugin.config.example.json'), 'utf8'));
config.appId = randomUUID();
try {
  await writeFile(resolve(root, 'plugin.config.local.json'), JSON.stringify(config, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  console.log('Created custom/plugin.config.local.json. Set your endpoint, OAuth reference and publisher details. Select language en/es and example none/collections. Preserve the app ID for updates.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('Existing custom configuration and app ID preserved.');
}
