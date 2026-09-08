[English](CONTRIBUTING.md) · [Castellano](CONTRIBUTING.es.md)

# Contributing

Open an issue to discuss a substantial change, or submit a focused pull request with the problem, resulting behavior and verification. Use English or Spanish. Keep user-facing documentation in both languages and link each page to its counterpart. Do not translate tool names, JSON keys or protocol identifiers.

Use Node.js 22+. From the root:

```sh
npm ci --prefix native/bridge
node --test native/scripts/test/package.test.mjs
npm test --prefix native/bridge
node scripts/check-public-files.mjs
```

Preserve delegated identity and read-only behavior in the native bridge. Propose changes to write behavior explicitly. Use fictitious fixtures and test doubles; no contributor should need the maintainer's tenant or credentials to run tests. A test suite passing is not evidence of a live Cowork installation.

Follow [SECURITY.md](SECURITY.md) for private reports. Review [brand usage](assets/BRAND-USAGE.md) when changing visual assets. Keep the MIT notice with reused code and identify third-party material and its license.
