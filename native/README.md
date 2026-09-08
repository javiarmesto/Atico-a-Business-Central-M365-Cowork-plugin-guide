[English](README.md) · [Castellano](README.es.md) · [Repository](../README.md)

<p><img src="../assets/color.svg" width="64" height="64" alt="ático"></p>

# Standard Business Central MCP for Copilot Cowork

A Microsoft 365 Copilot Cowork connector with delegated access to the standard Business Central MCP. The TypeScript bridge runs on Railway and supplies authentication and the destination headers.

**[Complete implementation guide: prerequisites, deployment and first query](HOW-TO-BC-NATIVE-COWORK.en.md)**

## Scope

The bridge supports List queries over API pages with read parameters. Dynamic mode exposes `bc_connection_check`, `bc_actions_search`, `bc_actions_describe` and `bc_actions_invoke`.

Business Central determines action availability and applies the user's permissions. The bridge preserves read restrictions and does not keep an entity allowlist for each deployment. Configure `BC_TOOL_MODE=dynamic` explicitly: the code defaults to `static`. Set `mode: dynamic` in your local package configuration too.

## Components

| Path | Purpose |
|---|---|
| `bridge/` | TypeScript service, token validation, queries and argument validation. |
| `appPackage/tools/bc-native-dynamic.json` | Dynamic connector's MCP catalog. |
| `scripts/init-plugin.mjs` | Creates local configuration with a unique, stable M365 app ID. |
| `scripts/build-package.mjs` | Builds a package from that configuration. |
| `plugin.config.example.json` | Generic configuration without credentials or deployment identifiers. |
| `Dockerfile` | Service build and startup. |
| `.env.example` | Variable reference; fill in your own target and select the mode. |

Each installation has its own M365 application identity, which is preserved for updates.

## Quick start

After configuring Entra, BC, Railway and Teams OAuth as described in the guide, run from the repository root:

```powershell
node native/scripts/init-plugin.mjs
# Fill native/plugin.config.local.json with your identity, URLs and OAuth reference.
node native/scripts/build-package.mjs
```

Keep the app ID for updates. Application names and descriptions can be written in your audience's language in the local configuration. For verification:

```powershell
node --test native/scripts/test/package.test.mjs
npm ci --prefix native/bridge
npm test --prefix native/bridge
```

[Dynamic mode](DYNAMIC-MODE.en.md) · [Security](../SECURITY.md)
