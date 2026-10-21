# Current and Target Architecture

## Current-state assessment

The backend repository is not present in this repository. The frontend observations below are confirmed from the existing source tree; they are not claims about the missing backend:

- `src/main.tsx` is the browser entry point and renders `src/app/App.tsx`.
- `src/app/` owns application bootstrap, root providers (`src/app/providers/`), route definitions (`src/app/router/`), and application shell layout (`src/app/shell/`).
- Feature pages and clinical business workflows are organized under `src/features/` (`auth/`, `orders/`, `models/`, `conversion/`, `reporting/`, `settings/`).
- Cross-cutting reusable UI primitives, hooks, utilities, types, mock services, and configuration are consolidated under `src/shared/` (`shared/components/`, `shared/hooks/`, `shared/utils/`, `shared/types/`, `shared/services/`, `shared/api/`).
- `src/shared/services/api.ts` currently fetches typed JSON fixtures from `/data/*.json`; this is a local-data boundary, not verified backend integration.
- `public/data/` supplies the fixture resources consumed by the frontend.
- The repository has an existing Vite/TypeScript build and an Oxlint script. It has no verified New CP OpenAPI client or approved backend connection.
- The database report records conceptual/documented V3 behavior, including tenant context and RLS, but explicitly says it is not a full audit, security certification, or production-readiness approval.

Do not call the proposed repository trees an existing architecture. Do not perform migration or refactoring until the missing backend/contract dependencies and an approved implementation task are supplied.

## Target-state proposal

The selected package proposes a modular-monolith backend and two independent frontend repositories, subject to topology confirmation:

```text
newcp-api/
  openapi/newcp.openapi.yaml
  src/
    app and server composition
    common errors/http/middleware/logging
    infrastructure database and integrations
    modules orders, service-instances, models, conversion, reporting, iam
  tests/unit integration contract

newcp-ui-option-a/
  src/app providers router features shared/api components hooks utils types theme
  test/

newcp-ui-option-b/
  src/app providers router features shared/api components hooks utils types theme
  test/
```

This is a proposed target architecture derived from `02_Repository_Structure_and_Engineering_Standards.docx`, not an approved rewrite plan. The two UIs may have different routing, components, navigation, and API adapter code, but must consume one approved contract and produce equivalent business outcomes. A shared component library or shared generated client is not required for the October comparison.

## Boundaries and dependency direction

For the backend proposal:

```text
HTTP route/controller -> service/domain rules -> designated adapters/repositories -> Drizzle/PostgreSQL V3
                                      |-> auth/tenant/policy adapters
                                      |-> cache/telemetry adapters
```

- Controllers handle transport and DTO mapping; they do not own business rules.
- Zod validates application inputs/configuration; it does not make the database schema the public API.
- Services own authorization decisions, transactions, status transitions, and side-effect ordering.
- Repositories contain Drizzle queries and schema mappings.
- Tenant context must come from server-validated identity/membership and be applied through a scoped transaction/application role.
- Service-instance identity must be independent of service type. Reporting, updates, transitions, and history must target the instance.
- Frontends call the backend API; they do not access PostgreSQL directly.

For each frontend proposal, keep rendering, feature workflow state, API transport, and data mapping separable enough to test. Do not introduce a service abstraction for every component without a demonstrated boundary or reuse case.

## Migration plan

1. Obtain the backend repository and canonical OpenAPI contract; keep the current frontend source unchanged while recording its baseline.
2. Compare the frontend's current tree to the approved package baseline, preserving established tooling and working modules.
3. Confirm the business decisions and canonical OpenAPI contract before changing API adapters or DTOs.
4. Implement one vertical slice: authenticated tenant context, one Models/Conversion read/write flow, validation, error state, and evidence.
5. Prove repeated same-type service independence and tenant isolation against controlled PostgreSQL using the correct application role.
6. Add the second flow and approved integrations incrementally; keep both UIs behaviorally comparable and visually independent.
7. Stabilize, run the actual quality gates, capture evidence, and tag a reproducible demo candidate before the rehearsal.

## Approved decisions versus proposals

Package-level directions include Drizzle instead of Prisma, OpenAPI over legacy Swagger, independent repeated instances, and modular layering. Exact business fields/transitions, POC readiness, repository topology, access, demo deployment, and Abdo's official role mapping remain unresolved in the supplied source set. Record any later decision as an ADR with its approver and source.

## Migration risks and verification

| Risk | Regression to watch | Verification |
|---|---|---|
| Existing UI behavior is lost during restructure | Broken navigation, validation, loading/error states, or responsive behavior | Before/after scenario checklist plus component/E2E/manual evidence |
| API inferred from legacy Swagger | Wrong endpoint, field, or status behavior | Contract review against approved OpenAPI and contract tests |
| Same-type multiplicity collapses to type-level uniqueness | One instance updates another or report counts are wrong | Two-instance create/update/transition/reload test |
| Tenant context leaks through pooled connections/cache keys | Cross-tenant reads or stale report data | Real PostgreSQL app-role tests and tenant-safe cache invalidation |
| Auth is simulated as a client-only button | Protected route/API behavior is false | Test environment login/logout/callback/error/protected-route evidence |
| POC is marked integrated without runtime proof | Demo fails or telemetry leaks | POC register with source, test, evidence, limitation, fallback |
