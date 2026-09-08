[English](README.md) · [Castellano](README.es.md) · [Repository](../README.md)

# Connect Cowork to your own Business Central MCP

This folder provides a configurable Microsoft 365 package. It does not include a custom MCP server, an author-owned deployment or credentials. Use it when you already have an MCP server for Business Central, or as a template while building one.

## 1. Prepare your server and authentication

Your server must expose a remote MCP endpoint over HTTPS at `/mcp`, implement authentication and authorize every tool call. It must validate the token issuer, audience, expiry and required permissions according to your identity provider. With delegated access to BC, preserve the user's identity; with application access, document and enforce the service identity's scope explicitly.

The template uses `OAuthPluginVault`. Create an OAuth client registration in [Teams Developer Portal](https://dev.teams.microsoft.com/) for **your custom MCP**, with the client ID, secret, scopes and authorize/token endpoints required by your server. Use the redirect URI required by Microsoft: `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`. Follow the [Microsoft OAuth guide](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-oauth). Save the complete Auth config ID. Put client secrets in the platform's secret store, never in a package.

The [native guide](../native/HOW-TO-BC-NATIVE-COWORK.en.md) is an example of delegated Entra/OBO integration. Its API audience and scopes belong to that bridge; do not copy them into an unrelated MCP without adapting its server implementation.

## 2. Initialize your package

Run from the repository root with Node.js 22+:

```powershell
node custom/scripts/init-plugin.mjs
```

Fill in `custom/plugin.config.local.json`:

| Field | Value |
|---|---|
| `appId` | Keep the generated ID. Use the installed M365 app ID only when intentionally upgrading that application. |
| `version` | Your package version; increase it for installed-package updates. |
| `language` | `en` or `es`, selecting catalog descriptions and the optional skill. |
| `example` | `none` by default; `collections` to include the optional session example. |
| `endpoint` | Your custom server's HTTPS `/mcp` URL. |
| `oauthReferenceId` | Complete Auth config ID from Teams. |
| `name`, `description`, `developer` | Your application identity and your actual website, privacy and terms URLs. |

This configuration is ignored by Git. The initializer preserves an existing file and ID. The builder rejects missing values, unsupported fields and attempts to add secrets or an authentication override. It never emits anonymous authentication.

## 3. Match your actual tool contract

Edit `appPackage/tools/bc-custom-read.en.json` and `.es.json`. Both must have the same tool names and schemas; translate only human-readable descriptions. The included `get-customers` and `get-customer` entries are **sample contracts from a custom implementation**, not standard BC MCP names. Verify them against your own server's `tools/list` response, including input types and limits.

The builder validates basic catalog shape, not compatibility with a live server. Declaring fewer tools in a package or marking them as read-only does not restrict the server. Enforce permissions server-side and test an unauthorized call before distributing your package.

Replace the 192 × 192 color icon and 32 × 32 white/transparent outline icon in `appPackage/icons/` if using your own branding.

## 4. Build and install

Install a supported Microsoft 365 Agents Toolkit CLI (the linked Cowork guide specifies 1.1.12 or later):

```powershell
npm install -g @microsoft/m365agentstoolkit-cli
node custom/scripts/build-package.mjs
$manifestPath = ".\custom\build\appPackage\manifest.json"
$version = (Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json).version
$zipPath = Join-Path (Get-Location) "custom\build\bc-custom-v$version.zip"
atk package --manifest-file $manifestPath --output-package-file $zipPath --output-folder ".\custom\build\packaged"
atk auth login m365
atk install --file-path $zipPath --scope Personal
```

You can select another configuration with `node custom/scripts/build-package.mjs --config custom/another.local.json`. Generated output is under `custom/build/`, separate from `native/build/`.

In Cowork, enable the plugin, connect its MCP server and sign in with an authorized account. Start with a read of five fictitious sandbox customers. Check the actual tool name, target company and result. Do not test writes as part of this walkthrough.

## Optional example and updates

Set `example` to `collections` only for the [collections demonstration](../examples/collections/README.md). The default package contains no collection-specific skill.

When updating an installation, preserve its app ID intentionally, increase the package version and verify the server authentication configuration.

[Security](../SECURITY.md) · [Native MCP alternative](../native/README.md)
