[English](DYNAMIC-MODE.en.md) · [Castellano](DYNAMIC-MODE.md)

# Native BC · Dynamic mode

Business Central's MCP configuration and user permissions determine available APIs. The bridge does not maintain an entity allowlist.

## Configuration

Set `BC_TOOL_MODE=dynamic` and your `BC_CONFIGURATION_NAME` in the deployment. The legacy `BC_DYNAMIC_READ_ACTIONS` variable is ignored. In BC, add supported API pages and enable **Allow Read**; keep **Unblock Edit Tools** disabled. **Discover Additional Objects** can broaden discovery to other accessible API pages. A BC table is not automatically an API page.

The flow remains `bc_actions_search` → `bc_actions_describe` → `bc_actions_invoke`, with delegated OAuth/OBO and fixed target headers. Your package mode must match the bridge mode. Version your own package independently from the bridge; rebuild when the exposed contract changes.

## Read compatibility checks

Search is restricted to ActionType List. Write operation names and ListUpdate are rejected before OBO. Before each invoke, the bridge describes the action in the same user's session and checks:

- An exact match for the requested List action name.
- BC's `{name, description, schema}` envelope with a supported object query schema.
- Only supported query fields: `filter`, `orderby`, `select`, `top`, `skip`, `resultFormat` and `_availableFields` metadata.
- No incomplete schemas, write parameters or errors returned by describe.
- No explicit contradictory annotations, such as `readOnlyHint=false` or `destructiveHint=true`.
- For the alternate MCP Tool `{name, inputSchema, annotations}` shape, an explicit `readOnlyHint=true` is required.

The BC 28 action-description format does not include tool annotations. `_availableFields.readOnly` describes that schema field; it is not an action permission. The bridge neither uses it as authorization nor fabricates annotations.

Descriptors may arrive in `structuredContent` or JSON text with an explanatory prefix. The parser does not infer permissions from prose or nested examples. Compatibility validation does not replace BC authorization, which applies during execution.

Supported reads use `top` from 1 to 100 (default 10), nonnegative `skip`, supported filters/order/select and `resultFormat: text`. Writes, bound actions, unsupported arguments and `resources/read` are outside this implementation.

## Validation and deployment

The bridge tests cover authentication, user isolation, schema envelopes, exact names, parameter limits, parser errors and simulated describe/invoke exchanges. Fixtures contain schema metadata, not customer records. Automated checks do not establish live connectivity in your tenant.

After deploying, sign in from Cowork and read five vendors and five sales invoices from your sandbox. Confirm the selected company and available fields. If a call fails, retain the error and action description without tokens or business data.

For rollback, redeploy a previously validated commit from your own release history. If switching to static mode, configure both the bridge and a matching static package and use your own BC configuration.

[BC MCP configuration](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/configure-mcp-server)
