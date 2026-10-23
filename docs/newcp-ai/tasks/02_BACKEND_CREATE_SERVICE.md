# Task 02 — Backend create independent service instance (after R01/R02 evidence)

Target: add one of the selected Biomodel/Conversion services to an **existing order** as a distinct `orders.order_items` service instance; two intentional same-type creates must succeed.

Inputs: approved OpenAPI contract (check status), tenant-mapped V3 catalog fields/options, V0.6 active source validators and backend rules, V0.7 mapping, existing repo conventions, `BR-004`/`BR-006`, `AT-06`/`07`/`12`/`13`/`16`/`17`/`29`.

Before implementation: present exact paths, transaction boundary, app-side tenant authorization, line-number uniqueness strategy under concurrency, how intentional creates differ from retries, pricing handling, per-item billedToContactUuid→crm.contacts.id mapping, server-owned billed_party_origin, F07 readiness gate, and field value persistence. **Stop for approval if prerequisites absent**. On approval produce route/controller/service/repository/Zod plus tests; atomic write of item and answers; correct zero partial state on failure. Avoid duplicate-type uniqueness and invented finance.

No implied permission to execute schema migrations, change billing semantics or write to a live environment. Report typecheck/test outcomes and reviewable diff.

**F07 mapping is defined, not a mystery:** use the V0.9 F07 OpenAPI/Drizzle resources. Defaults are persisted on INSERT only; `is_billable` must never be derived from legacy `toBeBilled`. Demonstrate unit tests for two same-type instances with distinct payers. Real enabled writes require verified V204 deployment and source-policy/stage-90 readiness.
