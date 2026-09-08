# Custom MCP sample contract

## Permitted tools

| Tool | Use | Expected effect |
|---|---|---|
| `get-customers` | Find customers and inspect an initial balance signal. | Read only |
| `get-customer` | Confirm customer identity, basic data and balance. | Read only |

Do not invoke any other tool even if the server advertises it through `tools/list`.

## Evidence limit

A positive balance does not prove overdue debt. **Act** needs at least an outstanding document, remaining amount, due date, days overdue, and no dispute or active payment promise. If unavailable, state the limitation. Do not invent invoices or dates or automatically turn the result into a payment demand.

## Authentication

The public package requires `OAuthPluginVault` and your own server that authenticates and authorizes every call. The package generator does not implement server security. Confirm the deployed endpoint's contract and permissions before using real data.

## Possible future extension

A future extension, not implemented in this skill, could use `list_collection_candidates`, `get_customer_collection_status`, and later `register_collection_intervention` with approval. Any extension must enforce authentication and authorization on the server. Tool annotations do not replace these controls.
