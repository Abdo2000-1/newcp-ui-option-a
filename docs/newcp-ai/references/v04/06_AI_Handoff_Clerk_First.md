# AI Implementation Handoff — Internal CP First

## Agent source precedence
1. Explicit New CP decisions and agreed October scope.
2. For internal staff actions: verified CP page/business-function evidence, then ServiceAPI implementation and service-specific config.
3. For customer-permitted actions and action-triggered side effects: verified Connect call path and its backend config.
4. Legacy source describes behavior only; New CP uses Express/TypeScript/Drizzle/Zod/approved OpenAPI 3.0.3 and V3 model.

## Safe generation requirements
- Always specify **actor**, **operation**, **service instance**, **preconditions**, **status trigger** (manual or event driven), **effects**, **error path**, and **source evidence IDs**.
- Build actual order/service instance identity; never use a fixed ApplianceID/SimID slot for addressability.
- Start with selected CP add/edit vertical slice for Models and Conversion; map V3 entities with Drizzle using provided sanitized schema.
- Preserve role and tenant checks server side; no hardcoded user IDs, frontend-only authorization or direct legacy SQL interpolation.
- Treat each suggested legacy rule as scoped to its code path. No generalization of the billed-state restriction beyond the selected service without evidence.
- POCs and SonarQube/Docker are implementation team deliverables; global V3 technical review and migration execution are explicitly external.
- Share only approved sanitized company material with AI services; do not upload full sensitive repositories/dumps or credentials without organizational approval.

## Required agent stop conditions
Stop and request verification when exact selected service code, field catalog, allowed transition, required-files configuration, billing exception, V3 Drizzle relation or authorized actor is unspecified. Do not invent fees, status labels or role permissions.

## Suggested ready-to-run task context
`BR-006, BR-004, AT-07, AT-16; IC-02,IC-03,IC-04/IC-05,IC-25; source verified field card for selected option; approved OpenAPI operation; V3/Drizzle mapping; a safe fixture and test`; do not begin without missing links.
