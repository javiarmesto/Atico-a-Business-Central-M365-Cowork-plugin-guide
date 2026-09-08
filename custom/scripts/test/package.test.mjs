import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, readdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildPackage, validateConfig } from '../build-package.mjs';

const config = {
  appId: 'aaaaaaaa-1111-4111-8111-bbbbbbbbbbbb', version: '1.0.0', language: 'en', example: 'none',
  endpoint: 'https://custom.test/mcp', oauthReferenceId: 'abc12345+/==',
  name: { short: 'My BC', full: 'My Business Central MCP' },
  description: { short: 'BC reads', full: 'Reads from my custom MCP.' },
  developer: { name: 'My company', websiteUrl: 'https://company.test', privacyUrl: 'https://company.test/privacy', termsOfUseUrl: 'https://company.test/terms' }
};
test('EN/ES packages preserve OAuth and identity; collections are opt-in and removed on rebuild', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'custom-package-'));
  try {
    const path = resolve(dir, 'config.json'), output = resolve(dir, 'package');
    for (const language of ['en', 'es']) {
      for (const example of ['collections', 'none']) {
        await writeFile(path, JSON.stringify({ ...config, language, example }));
        await buildPackage(path, output);
        const first = await readFile(resolve(output, 'manifest.json'), 'utf8');
        const m = JSON.parse(first), server = m.agentConnectors[0].toolSource.remoteMcpServer;
        assert.equal(m.id, config.appId); assert.deepEqual(m.developer, config.developer);
        assert.equal(server.mcpServerUrl, config.endpoint);
        assert.deepEqual(server.authorization, { type: 'OAuthPluginVault', referenceId: config.oauthReferenceId });
        assert.equal(server.mcpToolDescription.file, `tools/bc-custom-read.${language}.json`);
        const catalog = JSON.parse(await readFile(resolve(output, server.mcpToolDescription.file), 'utf8'));
        assert.deepEqual(catalog.tools.map(t => t.name), ['get-customers', 'get-customer']);
        assert.deepEqual(await readdir(resolve(output, 'tools')), [`bc-custom-read.${language}.json`]);
        if (example === 'collections') {
          assert.deepEqual(m.agentSkills, [{ folder: './skills/bc-collections-intervention' }]);
          for (const name of ['SKILL.md','references/decision-policy.md','references/demo-cases.md','references/output-contract.md','references/live-connector-contract.md']) {
            assert.equal(await readFile(resolve(output, 'skills/bc-collections-intervention', name), 'utf8'),
              await readFile(new URL(`../../../examples/collections/${language}/skills/bc-collections-intervention/${name}`, import.meta.url), 'utf8'));
          }
        } else {
          assert.equal(m.agentSkills, undefined);
          assert(!(await readdir(output)).includes('skills'));
        }
        await buildPackage(path, output);
        assert.equal(await readFile(resolve(output, 'manifest.json'), 'utf8'), first);
      }
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('invalid configs cannot replace an existing output or disable authentication', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'custom-invalid-'));
  try {
    const path = resolve(dir, 'config.json'), output = resolve(dir, 'package');
    await writeFile(path, JSON.stringify(config)); await buildPackage(path, output);
    const original = await readFile(resolve(output, 'manifest.json'), 'utf8');
    for (const change of [{ appId: '' }, { endpoint: 'http://custom.test/mcp' }, { endpoint: 'https://custom.test/mcp?token=invalid' }, { oauthReferenceId: '' }, { language: '../es' }, { example: 'other' }, { clientSecret: 'never-here' }, { authorization: { type: 'None' } }, { mode: 'static' }]) {
      assert.throws(() => validateConfig({ ...config, ...change }));
      await writeFile(path, JSON.stringify({ ...config, ...change }));
      await assert.rejects(buildPackage(path, output));
      assert.equal(await readFile(resolve(output, 'manifest.json'), 'utf8'), original);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('custom initializer assigns distinct IDs and preserves configuration on rerun', async () => {
  const dir = await mkdtemp(resolve(tmpdir(), 'custom-init-'));
  try {
    const ids = [];
    for (const name of ['one','two']) {
      const root = resolve(dir, name);
      await cp(new URL('../../plugin.config.example.json', import.meta.url), resolve(root,'plugin.config.example.json'), { recursive: true });
      await cp(new URL('../init-plugin.mjs', import.meta.url), resolve(root,'scripts/init-plugin.mjs'), { recursive: true });
      execFileSync(process.execPath,[resolve(root,'scripts/init-plugin.mjs')]);
      const first=await readFile(resolve(root,'plugin.config.local.json'),'utf8');
      execFileSync(process.execPath,[resolve(root,'scripts/init-plugin.mjs')]);
      assert.equal(await readFile(resolve(root,'plugin.config.local.json'),'utf8'), first);ids.push(JSON.parse(first).appId);
    }
    assert.notEqual(ids[0],ids[1]);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
