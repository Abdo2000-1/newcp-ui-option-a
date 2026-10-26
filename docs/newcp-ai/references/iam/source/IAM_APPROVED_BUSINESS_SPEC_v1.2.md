# New CP — Approved IAM, Google Authentication & Casbin Requirements

**Specification:** IAM-BR v1.2 · **Approval basis:** Technical Lead decisions through 26 October 2026, including IAM-HIER-001  
**Delivery scope:** October CEO demo (Models and Conversion, internal-clerk journeys) plus explicitly deferred requirements  
**Business authority:** User-approved decisions D01–D13 and M01–M04, latest clarifications; earlier CP/CS naming, Admin export and demo-identity assumptions superseded.  
**Implementation status:** This is an APPROVED BUSINESS REQUIREMENTS reference and engineering acceptance baseline. **It is not evidence that the live backend, OAuth adapter, Casbin policies, V3 schemas, ETL, or QA tests have been executed.**

## UPDATE v1.2 — Approved same-family transitive inheritance (supersedes v1.1 hierarchy uncertainty)

**Approved business rule IAM-HIER-001 (26 October 2026):** Every Senior or Manager role automatically inherits **all permissions of every subordinate/child role within the SAME internal business group/family**, including transitively through intermediate levels. For a confirmed relationship `OPS_MANAGER > OPS_SENIOR > OPS_JUNIOR`, OPS_SENIOR receives all OPS_JUNIOR permissions, and OPS_MANAGER receives all OPS_SENIOR + OPS_JUNIOR permissions, **plus each role's direct permissions**. The labels/codes and the exact parent-child graph in this illustration are NOT asserted to be verified database records. Equivalent behavior applies to verified CS/FINANCE/QC hierarchy grades. ADMIN remains governed by its already approved full-functional, tenant-scoped rule.

**This is a mandatory business rule, not an optional future-phase feature.** The concrete roles, direct permissions and edges must be discovered from authorized legacy/V3 data and confirmed in the mapping before being seeded. Do not infer a link solely from the text of a role name. A hierarchy cannot cross CS/OPS/FINANCE/QC/ADMIN family boundaries; inherited permissions remain subject to tenant, service-type, financial-lock, workflow and audit controls. Role revocation or parent-child change must affect the next protected request. The implementation may use reviewed internal IAM capability closure or Casbin inherited role links; missing native V3 hierarchy persistence requires a DB-owner decision, not a weakened business rule.

## UPDATE v1.1 — Authentication-only Google; internal V3 hierarchy (supersedes v1.0 IAM wording)

**Approved 26 October 2026:** Google is used exclusively for interactive identity authentication (Google Sign-In/OpenID Connect). **Google Groups is not part of the New CP solution** for access checks, staff-group discovery, role assignment, role refresh, or tenant assignment. PostgreSQL V3 `iam` tables provide internal user identities, business-role/group assignments, and capability relationships; Casbin evaluates application authorization from those trusted internal records. This is an approved clarification, **not an invitation to implement Google Group synchronization later by default**.

The five already-approved access families (`CS`, `OPS`, `FINANCE`, `QC`, `ADMIN`) define business-level permissions. Legacy CP also contains more granular staff groups/grades (e.g. **Senior Ops** and **Junior Ops**). They must be *discovered, mapped, and validated* as internal IAM roles/capability variants. These names are confirmed as **examples of business hierarchy**, not verified V3 role codes. **Approved inheritance applies to all confirmed subordinate Senior/Junior/Manager role relationships within one business family.** Do not assume a concrete parent-child *relationship* merely from a name, that every legacy group should migrate, or that a team's place in an org chart itself grants any capability.

V3 source DDL (`V006__iam_tables.sql`) defines `iam.users`, `iam.roles`, `iam.user_roles`, `iam.capabilities`, `iam.role_capabilities`, `iam.teams`, and `iam.team_capabilities`. It does **not** explicitly define `iam.groups`, an `iam.role_inheritance` relation, or a `parent_role_id`. Teams and organizational manager relationships are not automatically security roles. Transitive same-family inheritance is **mandatory business behavior**. A reviewed, flattened effective-role-capability projection can implement it without new V3 DDL; a native parent-role relation is an alternative requiring DB-owner architectural review and approved schema/policy changes. Neither approach may omit inheritance once confirmed hierarchy edges exist.

**Normative source order:** new v1.2 IAM policy > older v1.1/v1.0/v0.9.3 IAM material > older speculative Google Group or five-exact-roles assumptions. Older source/legacy evidence remains informative; it is not necessarily approved target policy.

## 1. Authority and precedence

1. Current approved IAM rules in this document supersede conflicting provisional IAM/Google-Group statements in New CP v0.9–v0.9.2.2 references. The correct business group is **CS**, not a separate "CP" role. CP is the application name.
2. Approved Q-B8–Q-B15 service behavior, F07 independent Bill To/billability rules, the internal-CP-first business evidence, and existing OpenAPI scope remain in force except where IAM rules explicitly narrow the actor permissions.
3. PostgreSQL V3 migration SQL and actual deployed schema determine what *exists*, not what the business expects. Any missing IAM persistence, approved permissions, or audit coverage must be reported and separately migrated/tested; no AI coding agent may invent or apply database migrations without authorization.
4. New CP internal IAM assignments are authoritative for *application role permissions*. Google authenticates identity; Google Groups are **not used for New CP authentication or authorization**. Any future Google Groups integration would require a separately approved change. Google domain eligibility is not a tenant assignment or operational permission.
5. Five approved **business access families**: `CS`, `OPS`, `FINANCE`, `QC`, `ADMIN`. Internal IAM may additionally hold more granular roles (e.g., Senior Ops / Junior Ops); their precise codes, direct capability grants and parent-child links require verified mapping; same-family transitive inheritance itself is approved. No `CP` role. A distinct `CROSS_TENANT_ADMIN` capability may be designed later; `ADMIN` alone does not grant cross-tenant access.

## 2. Approved business rules (normative)

| ID | Business rule |
|---|---|
| IAM-001 | Google Sign-In is the **only interactive employee sign-in method for the October demo**. Do not infer a permanent prohibition on future noninteractive system credentials. |
| IAM-002 | First-time internal identity provisioning may occur for an authenticated `@3ddx.com` identity or an **explicitly approved demo identity**. Provisioning **does not** grant roles, tenant access, or protected API privileges. |
| IAM-003 | PostgreSQL V3 IAM group/role assignments and capability grants are the **sole authoritative source** for New CP business authorization. Google only verifies sign-in identity. Google Group membership must not be fetched, used, required or synchronized to assign capabilities. |
| IAM-004 | Only an authorized `ADMIN` manages user role/group assignments for authorized tenant(s). Role changes are audited; granular group assignment follows the same Admin-only policy. |
| IAM-005 | An authenticated, unassigned employee receives restricted **Pending Access** UI; all protected business endpoints return `403`. No default privileged role. |
| IAM-006 | The demo tenant is `3ddx.com`, `tenant_id=1`. Access uses **explicit internal user-to-tenant assignment**; never derive authorization merely from matching the email domain. |
| IAM-007 | One **authorized active tenant per demo application session**. Every protected operation validates the user's tenant and resource scope; server/database tenant context is trusted, not taken unvalidated from the client. |
| IAM-008 | `ADMIN` has full functional permissions **within authorized tenant(s)**. Cross-tenant administration requires a distinct, explicitly approved privilege; do not infer it from ADMIN. |
| IAM-009 | `CS`, `OPS`, `FINANCE`, `QC`, `ADMIN` may **view all reports** for their authorized tenant in the **sanitized demo-data environment**. Report field-level visibility remains a deferred separate policy. |
| IAM-010 | Report **download/export** is permitted only to `FINANCE`, `QC`, and `ADMIN`. `CS` and `OPS` may view but may not use report export/download endpoints. An export API must enforce this independently of UI. |
| IAM-011 | Configurable application session policies: **30-minute idle timeout; 8-hour absolute maximum**. Expiration is enforced server-side. |
| IAM-012 | An internal role/permission change must apply on the **next protected request**, not only at next Google sign-in. Logout revokes the application session. |
| IAM-013 | Auditable events include internal actor ID, suitable identity snapshot, tenant, effective role/authorization context, resource, action, time, successful changes, and security-relevant denials. Do not log raw tokens, secrets, or patient data in security event payloads. |
| IAM-014 | CS may perform broad operational CP actions other than financial **transactions**, QC audits or administrative tasks. CS may perform pre-financial-lock operational commercial adjustments within authorized scope. |
| IAM-015 | OPS may perform **Models and Conversion** operational actions (create/edit/transition/On Hold), including service-level commercial adjustments, but not on unrelated service types unless separately granted. |
| IAM-016 | FINANCE may perform financial edits/actions (charging, invoicing, etc.) and authorized commercial service adjustments; QC may view all reports and perform QC audits; ADMIN has full functional scope within tenant. |
| IAM-017 | Operational commercial adjustments include permitted price override, Bill To change, `isBillable` change, and zero-charge reason. They **do not grant** charging/invoicing/payment functions and must obey F07 financial locks, validations, tenancy and audit. |
| IAM-018 | A user may have **multiple internal IAM roles/groups** and effective permissions are the **union of applicable allow permissions**, scoped by tenant/resource and nonbypassable business checks. This architectural support is required, but demo multi-role testing is deferred. |
| IAM-019 | Google reauthentication ('step-up') for sensitive Admin/Finance actions is **deferred**; normal session validity, backend authorization, audit, and financial locks remain mandatory now. |
| IAM-020 | Live demonstration uses **only three actual Google identities** representing CS, OPS and ADMIN. FINANCE/QC behavior is covered by automated test fixtures; multi-role demonstration/testing is explicitly **after the demo**. |
| IAM-021 | Live core journeys: Google login, allowed action, denied action, CS/OPS commercial price override, F07 Bill To change, tenant-isolation denial. Other capabilities require automated acceptance verification where possible. |

### v1.2 approved clarifications and outstanding mapping evidence

| ID | Rule | Approval/evidence status |
|---|---|---|
| IAM-022 | Google is for **authentication only**. No Google Group membership lookup, mapping, or role sync. | Approved 26 Oct 2026 |
| IAM-023 | PostgreSQL V3 `iam` assignments/capabilities are the authoritative source of **authorization**, evaluated through Casbin. | Approved 26 Oct 2026 |
| IAM-024 | Preserve support for granular/hierarchical **internal business groups/roles** (e.g. Senior Ops, Junior Ops) rather than collapsing all employees into five physical roles. | Approved principle; exact hierarchy unknown |
| IAM-025 | Inventory exact legacy/V3 role codes, direct capabilities, and each parent-child relationship before seeding; do not infer a concrete edge from naming alone. | Mapping discovery required; inheritance semantics approved |
| IAM-026 | Same-family parent roles MUST have the transitive union of all confirmed child permissions. Implement using a reviewed effective-capability projection or tenant-aware role links; any new inheritance persistence needs approved schema design. | Approved business behavior; technical design pending |
| IAM-HIER-001 | Any Senior/Manager internal role inherits every permission of all confirmed subordinate roles in its OWN business family, transitively, in addition to its own grants. No cross-family escalation. | Approved 26 Oct 2026 |

## 2A. Internal group hierarchy and resolution (approved principle; exact mapping pending)

| Concept | Rule / verification |
|---|---|
| Business access family | `CS`, `OPS`, `FINANCE`, `QC`, `ADMIN` define the approved high-level functional boundaries, not an exhaustive list of every physical `iam.roles.code`. |
| Granular staff group | Examples: Senior Ops, Junior Ops. Actual names, codes, legacy IDs, active status and capability variations must be inventoried from legacy records / approved owners. |
| Group assignment | Admin assigns internal IAM role(s) to a user, with tenant scope and audit. No Google Group membership query or synchronization. |
| Permission union | Effective permissions are the union of assigned roles, their direct grants, and the transitive grants of confirmed child roles in the same family. No permission-ranking conflict priority. |
| Inheritance | MANDATORY for every confirmed same-family Senior/Manager→child relation: parent receives all child direct and inherited grants, plus its own. Exact graph/edges must be evidenced before activation. Unknown edges grant nothing. |
| Casbin | Evaluates the mandatory transitive role grants from a reviewed PostgreSQL IAM projection or Casbin role links. Enforce tenant-scoped and same-family edges, prevent cycles, and never generate edges from name prefixes. |
| V3 schema caveat | Role assignments and per-role capabilities exist in V006; native role hierarchy is not present in inspected DDL. Do not create or apply a new table without DB-owner review. |
| Guardrails | Permissions remain tenant/resource/service-type limited; financial locks and F07 rules are never inherited away. |

**Implementation sequencing:** (1) read-only inventory of actual V3 roles, user_roles, role_capabilities and legacy AuthGroup/permissions; (2) map and validate all same-family child→parent links plus each role's direct grants; (3) calculate transitive effective permissions via reviewed capability closure or Casbin links; (4) test parent gains all child grants, child does not gain parent-only grants, no cross-family grants, cycle rejection and timely revocation. For the October demo, keep the three approved Google identities (CS, OPS, ADMIN), and use role fixtures based on approved seeded data; do not invent Senior/Junior privileges.

## 3. Role and Casbin capability matrix

**Source of truth for machine-readable rows:** `references/iam/ROLE_CAPABILITY_MATRIX.csv`. The table shows **approved access-family envelopes**, not the final privilege list of every Senior/Junior/other internal IAM role. Specific child/grade roles must be mapped before assignment. Keys below are **proposed application capability codes**, not a claim they are already seeded in `iam.capabilities`. Review/seed/migrate explicitly. `Scope=service_type` means OPS is limited to **Models and Conversion**; CS business access remains subject to specific resource/tenant workflow permissions. An unlisted capability is **not** implicitly granted. A role grant never bypasses mandatory business guards.

| Business capability | CS | OPS | FINANCE | QC | ADMIN |
|---|:---:|:---:|:---:|:---:|:---:|
| Read orders / services | Y | S | R | R | Y |
| Create / update services | Y | S | – | – | Y |
| Change status / On Hold | Y | S | – | – | Y |
| Override service price | Y | S | Y | – | Y |
| Edit service Bill To | Y | S | Y | – | Y |
| Edit service billability | Y | S | Y | – | Y |
| Edit zero-charge reason | Y | S | Y | – | Y |
| View all reports | Y | Y | Y | Y | Y |
| Download / export reports | – | – | Y | Y | Y |
| Financial transactions | – | – | Y | – | Y |
| QC audits | – | – | – | Y | Y |
| Assign / revoke roles | – | – | – | – | Y |
| Cross-tenant administration | – | – | – | – | Separate privilege |

**Legend:** `Y` authorized within assigned tenant and business guards; `S` authorized for Models and Conversion only; `R` may read these records *through reports* but not edit them operationally; `–` not granted by that role alone. Use the machine-readable capability-code matrix for exact scoped grants and deny tests.

`FINANCE`/`QC` may inspect all reports, but this does not automatically grant general order/service editing in operational screens. Operational change history is accessible to the actor when relevant and authorized; full audit investigation is subject to QC/Admin capabilities. Exact read-history capability splits should be ratified during API contract mapping, not invented as extra role privileges.

**Casbin decision conditions:** `allow = authenticated_session AND authorized_tenant AND effective_capability_for(resource_type, action, service_type) AND applicable_business_guards`. Effective permissions are the union of eligible **internal IAM** role grants, including mandatory same-family transitive inheritance along verified parent-child links. A Junior role must not receive Senior/Manager-only grants through reverse inheritance; a Senior/Manager must receive every evidenced child grant. A family envelope is not itself an automatic grant to every junior member. Avoid a global `ADMIN` bypass of tenant scope; avoid allowing `OPS` commercial functions on non-Models/Conversion resource types. Do not equate `reports.view_all` with `reports.export` or unbounded underlying data exports.

## 4. Google sign-in and user journeys

### J-01 — First-time Google sign-in, eligible company account, no role

**Actor:** employee using approved `@3ddx.com` identity; **preconditions:** Google identity successfully verified; employee has no New CP internal user identity.  
1. Employee opens New CP; app redirects to Google Sign-In. Google returns a verifiable identity assertion to the backend.
2. Backend validates provider, token signature/audience/issuer/expiry, and appropriate identity claim. Do **not** authorize on an unverified email string.
3. If the account meets approved provisioning eligibility, create/link a durable New CP user identity (no privileged role). Internal identity and email must be linked safely; don't overwrite an unrelated existing staff identity based on untrusted matching alone.
4. Resolve explicit tenant assignment. Eligibility for initial provisioning via `@3ddx.com` **does not create a user-to-tenant grant by itself**.
5. With no approved role and/or required tenant access, show **Pending Access** without operational modules or data; protected APIs return `403 ACCESS_NOT_ASSIGNED` (or a tenant-denial code where appropriate).
6. Admin later assigns tenant authorization/role. On subsequent protected requests and UI capability refresh, newly authorized access becomes effective without forcing Google sign-out.

**Exceptions:** failed Google authentication -> unauthenticated; disallowed external email -> no automatic provisioning; suspended/deactivated user -> deny; no tenant mapping -> no business data access; duplicate/conflicting identity -> reject and flag for manual resolution. **No default role**.

### J-02 — Returning, authorized employee

1. Google-authenticated employee resolves to a linked internal `iam.users` employee identity, active account and authorized tenant.
2. Backend obtains current internal role grants, computes applicable capabilities for that tenant, and starts/refreshes the application session with one active tenant.
3. UI renders the authorized navigation and permitted actions; backend checks every protected request independently. 
4. For roles CS / OPS / ADMIN, employee operates within the role's resource scope. Finance/QC access their relevant reporting/finance/audit functions according to matrix.
5. Session ends on logout, idle expiration, absolute expiration or revocation. No silent continuation through expired/revoked session.

### J-03 — Admin assigns/revokes role

1. Authorized ADMIN (for target tenant) selects an existing employee, including a pending user.
2. Backend validates Admin functional permission and both actor/target tenant scope.
3. ADMIN assigns or removes one/more roles; the app stores actor and timestamp, writes a role change audit event, and invalidates stale permission caches.
4. Changes apply at the affected employee's **next protected request**. The UI refreshes capabilities or gracefully handles `403` if permissions were revoked.
5. A user with no remaining business role returns to **Pending Access**; don't allow old role claims embedded in a token to preserve access.

### J-04 — CS/OPS permitted service update and commercial adjustment

1. User opens an order with an independent Models/Conversion service instance in an authorized tenant.
2. Backend checks `service.read`; action-level checks enforce CS general scope or OPS service-type scope.
3. Employee updates fields / status or overrides price, sets zero-charge reason, modifies `isBillable`, or selects the intended Doctor/Scanning Center Bill To contact.
4. Backend validates relevant capability, tenant, service status, F07 payer eligibility and financial lock; price must not be silently reset to the original contract amount after authorized override.
5. Persist atomically with concurrency protection and audit actor/changes. Existing approved Q-B8 behavior requires ETag/If-Match for update or transition; a stale precondition fails with `412`, missing `If-Match` with `428`. On Hold requires type and reason. Zero final charge requires a reason.
6. Changes only affect selected service instance; two identical service types on one order remain independently editable.

**Negative scenarios:** OPS attempts a non-Models/Conversion item; CS attempts financial charge; QC attempts price override; payer not an eligible order contact; financially locked service; concurrency conflict; cross-tenant service lookup.

### J-05 — Reports: viewing is not exporting

1. Any one of the five roles requests an authorized tenant's report in sanitized demo environment: **view allowed**.
2. CS/OPS attempt to export/download the same report: backend **denies with `403`**; hide/disable export controls in the UI, but do not rely on them.
3. FINANCE/QC/ADMIN may export/download within tenant and permitted data scope, and such event must be audited as data export.
4. Fine-grained report-field visibility/masking is deferred. Do **not** infer that a future production report may expose sensitive data without approval; use sanitized demo fixtures and retain an extensible response-filtering design.

### J-06 — Tenant isolation and denied action

1. User authenticated and assigned to demo tenant `1` requests an item from different, unassigned tenant (isolated test fixture), or submits another tenant ID.
2. Server refuses out-of-scope resource access; RLS/database transaction context must remain bound to **authorized** tenant, not user-supplied value.
3. Return nonleaking denial (`403` for explicit rejected tenant selection; `404` permissible for out-of-scope resource lookup), log security-relevant denial and ensure no record mutation/data exposure.
4. One active authorized tenant per session for the demo. A second tenant for test fixtures is not authorization to build the deferred multi-tenant switching UI.

### J-07 — Pending, expiry, logout and revoked access

- Provisioned but unassigned: restricted Pending Access UI, business APIs `403`, no default role.
- No valid session: business APIs `401`.
- Session idle over 30 minutes OR absolute age over 8 hours: session invalid; reauthenticate through Google.
- Logout: invalidate/revoke application session server side; subsequent protected API access `401`.
- Role removed while active: next protected request evaluated against current IAM and denied as applicable. If all roles removed, route to Pending Access.

## 5. API error and frontend behavior contract

`401` when unauthenticated, expired or revoked; `403` when authenticated but missing role, permission or explicit tenant authorization. A missing/invalid tenant context **must never** produce broader access; exact `TENANT_CONTEXT_REQUIRED` handling may be `403` for a known user or `400` for malformed client input. `404` may hide the existence of a cross-tenant resource. All application error names listed below are **recommended stable codes** until the backend publishes the agreed OpenAPI contract. The already-approved Q-B8 (`412`, `428`) and zero-charge (`422 ZERO_CHARGE_REASON_REQUIRED`) contract responses have precedence.

| HTTP | Code | Meaning / frontend |
|---|---|---|
| 401 | AUTHENTICATION_REQUIRED | Request Google login / session restoration; do not expose backend details. |
| 403 | ACCESS_NOT_ASSIGNED | Valid identity without access: display Pending Access. |
| 403 | PERMISSION_DENIED | Authenticated, no capability: show access denied; disable action after capability refresh. |
| 403 | TENANT_ACCESS_DENIED | Wrong explicit tenant: show no access to tenant. |
| 404 | RESOURCE_NOT_FOUND | Resource missing or inaccessible without revealing other tenants' items. |
| 409 | FINANCIAL_LOCK_CONFLICT | Business guard forbids commercial edit; show locked-state reason safely. |
| 409 | WORKFLOW_CONFLICT | State transition no longer permitted. |
| 412 | PRECONDITION_FAILED | ETag/If-Match concurrency failure; offer reload/resolve, do not overwrite. |
| 428 | PRECONDITION_REQUIRED | If-Match mandatory but not supplied for service update/transition. |
| 422 | ZERO_CHARGE_REASON_REQUIRED | Include `details.field=zeroChargeReasonCode` as approved Q-B10. |
| 422 | BUSINESS_VALIDATION_FAILED | e.g. missing hold type/reason or invalid payer. |

Error response shape proposal: `{ "error": { "code": "PERMISSION_DENIED", "message": "...", "requestId": "...", "details": {} } }`; final envelope must be reconciled with existing API contract. No permissions, token details, unredacted PII, or cross-tenant resource existence in error payloads.

## 6. Session, security and audit technical acceptance boundaries

- Configuration: expose idle timeout 30 minutes and absolute lifetime 8 hours through application configuration (environment-backed config is acceptable); server enforces **both** with recorded activity. Role changes become effective next protected request, including token-based sessions; use a revocable server-side session/versioned permission check instead of immutable long-lived role claims.
- V3 `iam.user_sessions` has `issued_at`, `expires_at`, `revoked_at` and a token hash; **it does not itself include last activity**. Developer must propose secure inactivity tracking (state extension or session store) and confirm persistence/transactionality. Do not assume V3 already enforces idle expiration.
- V3 `iam.users` and `iam.user_roles` are tenant-scoped; **explicit user-to-tenant mapping across tenants or Google provider immutable subject mapping is not visibly modeled as a general multi-tenant identity layer in V006**. Review V3 migrations before adding lookup tables or duplicate user records; seek approved DB change if needed.
- V3 `audit.event_log` supports login/logout/role changes and `data_export`; its `event_code` CHECK has **no permission-denied code** in inspected V005. Developer must propose a safe approved way to persist security denials, such as adding an event type through authorized schema change or a separately approved structured security log. Do not reuse `login_failure` to represent an authorized-session `403` without review.
- For pooled PostgreSQL connections, bind RLS `app.tenant_id` to the **current authorized request's DB transaction**, using transaction-local setting (e.g. `SET LOCAL`) and correct role/grants. Never leak previous tenant contexts through pooled sessions.
- Audit actor by immutable internal `iam.users.id` (with UUID in external APIs as appropriate), identity snapshot where necessary, tenant ID, effective role context, action, instance ID, before/after relevant values, timestamp and request/session correlation. Filter tokens, secrets, credential material and patient/medical data from general-purpose security event details.
- Logout revokes the application session. Google login does not automatically grant a new tenant or roles; role changes can take effect during the current session.
- No step-up/Google reauthentication requirement for sensitive actions in this demo; do not silently add one. Revisit later.

## 7. October demo acceptance and gate definition

**Three actual Google-backed demo identities only:** one CS, one OPS, one ADMIN (approved M01). No Finance/QC live demo identities required. Tests for Finance/QC may use **isolated automated test fixtures** without provisioned live Google accounts. The underlying multi-role *data model* must remain possible, but **multi-role testing is explicitly deferred until after the demo** (M02). Do not turn this testing deferral into a single-role database constraint.

Mandatory live demonstration (M03/M04): successful login; allowed service action; denied action; price override; Bill To edit; cross-tenant denial with isolated fixture. Demo may use three identities across scenarios. Financial/QC permissions, report view/export boundaries, pending access, timeout, role changes, logout, cross-service restriction, and denied mutation require automated integration or authorized test fixtures, tracked as PASS/FAIL/NOT RUN. Scope can be narrowed for *live presentation*, **not** by waiving required security tests before deployment.

`references/iam/ACCEPTANCE_TESTS.csv` contains test IDs, setup, actions and expected API/business results. Developers must wire tests to actual endpoints, real role assignments, sanitized fixtures and current V3 schemas. Distinguish contract/static tests from runtime/E2E tests.

## 8. Deferred / not approved for October demo

- `F01` Automatic approved email **domain → tenant access** policy; domain eligibility for account provisioning is approved, *tenant authorization by domain is not*.
- `F02` Persistent external-email exception lookup granting explicit tenant(s)+group(s), ownership/approval/revocation; explicitly approved demo identity allowlisting now is only a controlled onboarding exception, not a production policy.
- `F03` Multi-tenant account eligibility and switching UI/selection workflow; one authorized tenant per session now.
- `F04` Google Groups are EXCLUDED under the approved design; no names, membership lookup, sync or role mapping is required. Any future integration would need new approval.
- `F05` Per-report/per-field visibility, masking, redaction, row-level report policy, export field scopes and general-production sensitive-data approval; sanitized demo data only.
- `F06` Step-up authentication for privileged Admin/Finance actions and business thresholds (examples: grant Admin role, approve large credit/price change), including identity freshness policy.
- `F07` Multi-role **testing** after October demo. Multiple role assignments/permission union are approved and should not be blocked by current architecture.
- `F08` Full cross-tenant super-admin privilege and business approval process, beyond current tenant-scoped Admin.

No identified business owner for future-phase policy as of the current approval. Track owners/decisions in `references/iam/DEFERRED_REGISTER.csv`; do not fill with invented policy values.

## 9. Developer implementation ownership and release checklist

**Backend:** Google login callback/adaptor, secure internal identity resolution/provisioning, tenant-scoped role lookup, Casbin policy checks, protected API error envelope, revocable sessions, effective-next-request role updates, audit/security events, server-side report export authorization, F07/financial-lock guards.  
**Frontend (both React versions):** same shared API contract, Google login, pending-access/forbidden/expired states, capability-driven navigation, role-aware action affordances, accurate server-denial feedback, no client-trust for billing/tenant security. Both variants preserve identical business behavior.  
**DB/architecture owner:** verify V3 tables, role seed codes, tenant mappings, Google identity link strategy, session idle support, denied-event persistence, RLS, and F07 applied schema/fresh-ETL outcomes; propose migrations for review before executing.  
**QA:** automated role matrix and negative tests, tenant isolation, price/Bill To/On Hold locks, session changes, export denial, security-denial audit, and provenance coverage; label NOT RUN where appropriate.

**Do not claim production or demo runtime readiness** without passing authorized integration tests. Earlier handoff v0.9.2.2 described the **old populated V3 instance** missing F07 payer columns; the separately provided F07-integrated fresh ETL targets **a newly created PostgreSQL V3**. This IAM addendum does **not** change deployment status or execute ETL; before Bill To demo operations, verify that the currently selected demo DB has applied F07 V204 and reconciled its migrated historical data.

