# F07 reconciliation with previous references

| Subject | V0.8 reference | V0.9 F07 rule | Remaining evidence |
|---|---|---|---|
| Pre-charge payer | 'Schema missing; writable Bill To blocked' | Defined in supplied V204: `orders.order_items.billed_to_contact_id` | Verify target V204 migration actually deployed |
| Payer provenance | Not in mapping | `billed_party_origin` read-only in API, source/DB owned | Exact dump policy + legacy migration metadata |
| Create service | Bill To omitted | `billedToContactUuid` optional; V204 default persists once when omitted | Tenant contact UUID lookup and permissions |
| Edit service | Bill To display-only | `billedToContactUuid` can PATCH one item pre-charge; origin `user_selected` | Live financial lock and audit tests |
| Eligible payer choice | Not mapped | Doctor/default or Scanning Center from order context | Staging order-scoped contacts / API approval |
| Financial flow | Order default might be guessed | Prices, voucher, charges, invoices must use item payer | Downstream source/integration checks |
| Legacy import | Historical payer could be lost | Profile exact dump, approve domain hash, fail-closed stage 30, stage 90 reconciles | Sign-off and execution logs remain missing |
| Repeated same-type items | Supported | Each instance has independent payer | Service-instance API + integration tests |

**Interpretation:** The user supplied a completed remediation **code package**, not proof of an applied live migration. Treat F07 as incorporated into the **target architecture** now; don't keep incorrectly calling its schema an undecided business gap. Keep deployment, source-data and finance readiness gates separate, not merged into a single 'resolved' flag.
