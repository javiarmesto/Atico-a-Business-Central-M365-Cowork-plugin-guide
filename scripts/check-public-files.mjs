import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, relative } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const names = [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean))];
const errors = [];
for (const name of names) {
  const path = resolve(root, name);
  if (!existsSync(path)) continue; // Files intentionally removed in this change.
  if (/(^|\/)\.env($|\.)/.test(name) && !name.endsWith('.env.example')) errors.push(`${name}: local environment file`);
  if (/\.local\.json$|\.zip$/i.test(name)) errors.push(`${name}: generated/private configuration or package`);
  if (!['.md','.json','.mjs','.ts','.yml','.yaml','.svg','.example'].includes(extname(name))) continue;
  const text = readFileSync(path, 'utf8');
  // Targeted publication guards, not a complete secret scanner or history audit.
  if (/https:\/\/[a-z0-9-]+\.up\.railway\.app/.test(text)) errors.push(`${name}: concrete Railway deployment URL`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text)) errors.push(`${name}: private key material`);
  if (/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|sk-proj-[A-Za-z0-9_-]{32,}|vb_[A-Za-z0-9_-]{20,})\b/.test(text)) errors.push(`${name}: possible provider credential`);
  if (extname(name) === '.json') {
    try {
      const value = JSON.parse(text);
      if (name.includes('manifest')) {
        for (const connector of value.agentConnectors ?? []) {
          if (connector.toolSource?.remoteMcpServer?.authorization?.type === 'None') errors.push(`${name}: anonymous connector manifest`);
        }
      }
    } catch { errors.push(`${name}: invalid JSON`); }
  }
  if (extname(name) === '.md') {
    const links = [...text.matchAll(/\]\(([^)]+)\)|(?:src|href)="([^"]+)"/g)].map(m => m[1] ?? m[2]);
    for (const raw of links) {
      if (/^(?:https?:|mailto:|#)/.test(raw)) continue;
      const link = raw.split('#')[0];
      const target = resolve(dirname(path), link);
      if (relative(root, target).startsWith('..') || !existsSync(target)) errors.push(`${name}: missing/outside-repository link ${link}`);
    }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Publication guards passed for ${names.length} tracked/unignored paths. History and live deployments need separate review.`);
