import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildPackage, validateConfig } from '../build-package.mjs';

const config = {
  appId: 'aaaaaaaa-1111-4111-8111-bbbbbbbbbbbb', version: '1.0.0', mode: 'dynamic',
  endpoint: 'https://bridge.test/mcp', oauthReferenceId: 'abc12345+/==',
  name: { short: 'Mi BC', full: 'Mi Business Central' },
  description: { short: 'Lecturas de BC', full: 'Lecturas delegadas de Business Central.' },
  developer: { name: 'Mi empresa', websiteUrl: 'https://company.test', privacyUrl: 'https://company.test/privacy', termsOfUseUrl: 'https://company.test/terms' }
};
test('isolated configuration generates a repeatable package without a root Atico template', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'bc-package-'));
  try {
    const path = resolve(dir, 'config.json'), output = resolve(dir, 'package');
    await writeFile(path, JSON.stringify(config));
    await buildPackage(path, output);
    const first = await readFile(resolve(output, 'manifest.json'), 'utf8');
    const m = JSON.parse(first);
    assert.equal(m.id, config.appId); assert.deepEqual(m.developer, config.developer);
    assert.equal(m.agentSkills, undefined);
    assert.equal(m.agentConnectors[0].toolSource.remoteMcpServer.authorization.referenceId, config.oauthReferenceId);
    assert.equal(JSON.parse(await readFile(resolve(output, 'tools/bc-native-dynamic.json'), 'utf8')).tools.length, 4);
    await buildPackage(path, output);
    assert.equal(await readFile(resolve(output, 'manifest.json'), 'utf8'), first);
    await writeFile(path, JSON.stringify({ ...config, mode: 'static' }));
    await buildPackage(path, output);
    assert.deepEqual(await readdir(resolve(output, 'tools')), ['bc-native-read.json']);
    assert.doesNotMatch(first, /7b1d390a|javiarmesto|patient-intuition|techspheredynamics/i);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('initializer creates distinct IDs per copy and preserves existing configuration', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'bc-init-'));
  try {
    const ids = [];
    for (const name of ['one', 'two']) {
      const root = resolve(dir, name);
      await cp(new URL('../../plugin.config.example.json', import.meta.url), resolve(root, 'plugin.config.example.json'), { recursive: true });
      await cp(new URL('../init-plugin.mjs', import.meta.url), resolve(root, 'scripts/init-plugin.mjs'), { recursive: true });
      execFileSync(process.execPath, [resolve(root, 'scripts/init-plugin.mjs')]);
      const first = await readFile(resolve(root, 'plugin.config.local.json'), 'utf8');
      execFileSync(process.execPath, [resolve(root, 'scripts/init-plugin.mjs')]);
      assert.equal(await readFile(resolve(root, 'plugin.config.local.json'), 'utf8'), first);
      ids.push(JSON.parse(first).appId);
    }
    assert.notEqual(ids[0], ids[1]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('incomplete configuration and secret fields fail before producing a package', () => {
  for (const change of [{ appId: '' }, { mode: 'typo' }, { endpoint: 'https://mcp.businesscentral.dynamics.com/mcp' }, { oauthReferenceId: 'PLACEHOLDER' }, { clientSecret: 'never-here' }, { developer: { ...config.developer, privacyUrl: '' } }]) {
    assert.throws(() => validateConfig({ ...config, ...change }));
  }
});
