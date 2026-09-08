[English](business-central-cowork-mcp.en.md) · [Castellano](business-central-cowork-mcp.es.md)

# Business Central inside a work conversation

Asking an agent for the latest sales invoices looks like a small demonstration. It is. But behind that query there is an interesting decision: letting the ERP take part in a work conversation while keeping control of the data and available operations.

I have connected Microsoft 365 Copilot Cowork to the standard Business Central MCP. From Cowork, I have queried customers, items, vendors and sales invoices. The user signs in, the agent identifies the action it needs, and Business Central returns data from the selected company.

What interests me is what we can build on this connection, and which responsibilities each component should keep.

Microsoft supports extending Cowork through Microsoft 365 application packages with connectors and, when needed, skills. In this case, I used an MCP connector to access Business Central. The plugin is my own; the MCP server it connects to is Microsoft's native service. [Building Cowork plugins](https://learn.microsoft.com/en-us/microsoft-365/copilot/cowork/cowork-plugin-development).

Between them, I added a small TypeScript bridge deployed on Railway. Its job is specific: receive the authenticated call, obtain a valid token for the Business Central MCP, and add the headers identifying the tenant, environment, company and configuration.

This is a choice made for this implementation. The bridge lets us handle these connection requirements in a service we control. ERP logic and its APIs remain in Business Central.

Identity matters too. Access takes place on behalf of the user through an On-Behalf-Of exchange. The token received by the bridge is intended for its own API; it then obtains another token to call the Business Central resource. Although the configuration includes application secrets, we are not replacing the user with an application account that has general access to the ERP. [Microsoft Entra delegated OBO flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-on-behalf-of-flow).

One useful part of the design is the MCP's dynamic mode. Instead of adding a plugin tool for each entity, the agent uses three operations: search for an action, describe its schema and invoke it. These operations discover the actions offered by the Business Central configuration during the conversation. [Dynamic Tool Mode in Business Central](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/configure-mcp-server).

This has a practical result. After adding the sales invoice API to the BC configuration, I could query it from Cowork without adding a specific invoice tool to the package. The business catalog is managed in the ERP, while the plugin keeps the same discovery and execution tools.

This does not turn every Business Central table into a tool. We work with exposed APIs and a defined scope. Also, this bridge supports read queries over API pages. Write operations need a different design.

From a business perspective, imagine a simple request:

> Query the five latest sales invoices. Separate drafts from open invoices and prepare a summary for administration. State what information is missing before proposing an action.

Reading invoices is already implemented. The summary and proposal are the next use we can build on these records. We need to be precise: an open invoice does not by itself prove that payment is overdue, and reviewing five documents is not the same as analyzing the whole portfolio.

The agent needs to interpret status, dates, amounts and the scope of the query. If information is missing, it should say so. Separating what the ERP returns from what the agent proposes is part of solution quality.

It also separates an access demonstration from a complete business process. Querying information, organizing it and preparing a review can be useful on their own. Posting an invoice, sending a payment reminder or confirming an order adds responsibilities for execution, approval and follow-up. Those operations are not implemented in this plugin.

Business Central keeps a central role. Its MCP configuration defines available capabilities, and access uses the user's identity and permissions. The agent has a wider work context, while the ERP still applies its controls. [Business Central native MCP overview](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/ai/mcp-overview).

I wanted this connection to be reproducible. The repository therefore includes local configuration for the plugin name, its M365 identity, endpoint and OAuth reference. Each new independent installation receives an ID that is kept for updates. Secrets remain in the services that need them.

The [implementation guide](../native/HOW-TO-BC-NATIVE-COWORK.en.md) covers BC preparation, Entra registrations, Railway deployment and Cowork installation. Some steps remain administrative: access to Cowork, consent and BC permissions. Cloning the repository helps with the software; it does not make those decisions for the organization.

I see value in starting with a small process whose result we can review: a useful query, a clearly bounded interpretation and a proposal that a person can check. From there, each new execution capability needs a clear purpose and an accountable owner.

Connecting the ERP to an agent opens possibilities. Turning that connection into a reliable way of working is the next task.

[Repository and implementation guide](https://github.com/javiarmesto/Atico-a-Business-Central-M365-Cowork-plugin-guide).
