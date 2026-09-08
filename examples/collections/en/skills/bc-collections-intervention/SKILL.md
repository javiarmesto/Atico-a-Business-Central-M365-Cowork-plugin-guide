---
name: bc-collections-intervention
description: |
  Analyze and prioritize payment collection interventions using financial evidence
  from Business Central and context from Outlook and Teams. Use when the user asks
  which customers to contact, to prioritize collections, review overdue debt,
  prepare a collection intervention, or test the included fictitious cases.
license: MIT
metadata:
  author: Javier Armesto
  version: "0.2.1"
---

# Collections intervention

## Goal

Answer with traceable evidence:

> Which customers need action today, why, and what is the appropriate next step?

Business Central supplies financial facts. Outlook and Teams supply operational context. Classify, explain and propose; do not turn an inference into a fact or perform a visible action without approval.

## Modes

### Connected data

Use this mode only when authorized Business Central and Microsoft 365 tools are available.

- Use `get-customers` to find candidates and obtain an initial balance signal.
- Use `get-customer` to confirm each customer's identity and balance.
- Treat these tools as reads. Do not invoke tools starting with `create-`, `add-`, `delete-` or `update-`.
- The sample contract does not provide overdue invoices, due dates or aging. A positive balance alone does not justify **Act**.
- Do not simulate calls or data.
- State missing sources and limit the conclusion accordingly.
- Identify what comes from Business Central and what comes from Microsoft 365.

### Included demonstration

Use references/demo-cases.md only when the user explicitly requests the included fictitious cases, a simulation or a demonstration.

Start the response with:

> Demonstration mode — fictitious data included in the plugin.

Never present these records as live query results.

## Workflow

1. Establish the analysis date, thresholds and maximum customers. If unspecified, use the current date and limit a demonstration to the three included cases.
2. Obtain or load financial evidence: customer, invoices, remaining amount, due date, days overdue and status. In connected mode, start with `get-customers` and confirm selected customers with `get-customer`.
3. Look for relevant subsequent signals in Microsoft 365: an active payment promise, a dispute, previous follow-up or absence of relevant activity.
4. Apply the policy in references/decision-policy.md exactly.
5. Present results according to references/output-contract.md.
6. Separate facts, inferences and missing information.
7. Request approval before creating a draft, task, message or record.
8. In this version, stop after the approval checkpoint. Do not execute actions.

## Source rules

- **Business Central:** amounts, documents, status, dates and due dates.
- **Outlook/Teams:** commitments, disputes, conversations and follow-up.
- **Inference:** classification and reasoned recommendation.

When sources conflict, classify as **Escalate** and explain the conflict.

## Limits

- Do not send emails, block customers, change credit limits or register payments.
- Do not post, modify or delete documents.
- Do not treat a missing search result as proof that no communication exists.
- Do not hide uncertainty or expose unrelated customer data.
- Do not use tools outside references/live-connector-contract.md even if the server advertises them.

## Approval

After the analysis, ask a specific question:

> The proposal is ready. Do you approve creating the indicated drafts? No email will be sent.

A request for analysis is not approval to act. This version stops at the checkpoint even if approval is given.

## References

- references/decision-policy.md: classification rules and precedence.
- references/demo-cases.md: fictitious cases for demonstrations.
- references/output-contract.md: required response structure.
- references/live-connector-contract.md: permitted tools and evidence limits.
