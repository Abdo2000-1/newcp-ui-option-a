# Two-React-option end-to-end testing — requirements and honest current status

**NOT EXECUTED:** Option A source is present only as a standalone mock-data prototype and has not been connected to the New CP backend. Option B source was not available in the accessible sources. No deployed API server, PostgreSQL test connection, or credentials were supplied in this run.

Once both repositories are accessible and integrated, run the *same business assertions* against each option using each option's own navigation implementation; do not require identical layouts.

1. App user signed in with approved Google/Auth and Casbin/tenant context.
2. List real tenant catalog services; select chosen Biomodel and Conversion instances by confirmed UUID (not developer sample codes).
3. Render all required/conditional Connect fields, with CP-only controls shown according to actual internal permissions.
4. Attempt invalid mandatory field; UI prevents invalid submission where legacy Angular actually attached validators; API independently verifies critical rules.
5. Create two same-type services under one order, verify different UUIDs and two report rows; edit one, other remains unchanged.
6. Query current available transitions; perform a permitted transition with proper actor/history; verify rejected action is not persisted.
7. Pricing/Redo/zero charge controls obey verified DB constraints; service billed-party edit blocked pending approved pre-charge relationship.
8. No `/data/*.json` mock calls for the committed live vertical slice, inspect network to confirm new API endpoints.
9. Unauthorized and cross-tenant attempts fail; no unsafe sensitive data appears in browser logs, PostHog, Sentry or metrics.
10. Save screenshot and HTTP trace for each UI; compare **business results**, not navigation layout.

Implementation suggestion: create `src/features/services/data/serviceApi.ts` adapter in both React repos using `clients/newcp-demo-client.ts`; wire only the selected demo route. Adopt the product's existing test runner. Do not declare these gates PASS until each browser test executes against the same real staging API and dataset.
