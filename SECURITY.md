[English](SECURITY.md) · [Castellano](SECURITY.es.md)

# Security

## Supported scope

This is a reference implementation. Security fixes target the current `main` branch; there is no long-term-support commitment for older demo packages. Validate your own deployment before using business data.

### Standard MCP bridge

The native bridge validates delegated v2 tokens for a fixed tenant, API audience and OAuth client, requires `access_as_user`, and exchanges the user assertion through OBO. It supports reads only. Business Central's configuration and user permissions remain the authorization boundary. A successful health check does not establish BC connectivity.

### Custom MCP template

The generator in `custom/` requires your endpoint and OAuth registration and emits `OAuthPluginVault`. The server implementation is supplied by you: it must validate tokens and authorize every tool call. A packaged tool list, a read-only annotation or a skill instruction is not server-side authorization. The optional collections skill stops at a proposal and does not execute communications or writes.

## Configuration and data

- Keep client secrets and tokens in the deployment or platform secret store, never in Git or ZIPs.
- Keep filled-in `.env` and `*.local.json` files out of source control. Share generic examples only.
- Tenant IDs and app IDs are identifiers, not authentication secrets, but real deployment context should stay in local configuration.
- Test with fictitious sandbox data. Do not upload customer exports, screenshots containing business data, or full request/response logs in issues.
- Renew application credentials before expiry. If a real secret has entered Git, revoke or rotate it; deleting its current file is insufficient.
- Use an individual app ID per installation lineage. Reuse an ID only when intentionally updating that application.

## Reporting

Do not post credentials or vulnerability details in public issues. Use [GitHub private vulnerability reporting](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide/security/advisories/new) when enabled. If unavailable, contact the maintainer through a private channel linked from [his GitHub profile](https://github.com/javiarmesto) before sharing details. Include affected commit/version, reproduction steps and impact; redact tokens and business data. Enabling private vulnerability reporting is part of the publication checklist.
