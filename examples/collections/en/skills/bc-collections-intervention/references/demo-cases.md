# Fictitious demonstration cases

**Analysis date:** 6 September 2026

**Currency:** EUR

**All data in this file is fictitious.**

## Customer A — Alpine Office

Business Central: customer C-10010; overdue outstanding amount EUR 12,500.00; invoices FV-260801 and FV-260814; oldest overdue item 22 days; status Open.

Microsoft 365: customer email dated 4 September promising payment on 10 September. No dispute indicated.

Expected: **Do not contact**, High confidence. Review on 11 September.

## Customer B — Contoso Retail Sur

Business Central: customer C-10020; overdue outstanding amount EUR 8,900.00; invoice FV-260733; 37 days overdue; status Open.

Microsoft 365: Teams conversation dated 5 September. The customer disputes EUR 1,400.00 for an incomplete delivery. Commercial administration has not resolved the difference.

Expected: **Escalate**, High confidence. Assign review to commercial administration; do not request payment until the dispute is resolved.

## Customer C — Fabrikam Servicios

Business Central: customer C-10030; overdue outstanding amount EUR 6,200.00; invoice FV-260790; 18 days overdue; status Open.

Microsoft 365: no relevant follow-up in the preceding 30 days within the fictitious dataset. No promise or dispute is recorded in the test cases.

Expected: **Act**, Medium confidence. Propose a reminder draft; do not send it.
