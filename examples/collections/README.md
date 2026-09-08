[English](README.md) · [Castellano](README.es.md) · [Custom connection](../../custom/README.md)

# Optional example: collections review

This example comes from Javier Armesto's corporate sessions. It illustrates how an MCP connector and a skill can combine financial evidence with Microsoft 365 context. It is not the purpose of the repository and is not included in the default connector.

The sample skill is available in `en/skills/` and `es/skills/`. To include one version, set `example: collections` and `language: en` or `es` in `custom/plugin.config.local.json`, then rebuild. Only the selected language is packaged. Tool names remain unchanged.

The three fictitious cases use the fixed analysis date **6 September 2026**. Try:

> Test the three included fictitious collections cases using 6 September 2026 as the analysis date. Classify each customer, show evidence and stop at the proposal. Do not execute actions.

| Case | Expected result |
|---|---|
| Alpine Office | Do not contact: active payment promise. |
| Contoso Retail Sur | Escalate: open dispute. |
| Fabrikam Servicios | Act: propose a reminder draft, subject to approval. |

This version stops at the approval checkpoint and creates no drafts, messages or ERP records. Connected use requires authorized BC and M365 tools. A customer balance alone is insufficient to determine overdue debt; the sample `get-customers` / `get-customer` contract does not supply full aging evidence.
