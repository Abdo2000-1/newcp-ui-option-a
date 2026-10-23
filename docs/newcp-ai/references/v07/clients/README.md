# Frontend handoff: Option A and Option B

Both React options must call the same New CP contract using `makeNewCpDemoClient`.

**Neither frontend has been integrated by this package.** The available Option A source presently uses `src/services/api.ts` to fetch `/data/*.json`; that is fine for its approved prototype but does not prove backend integration. Add the client in a dedicated feature/data module, replace the **selected demo paths only**, and retain existing layout and UI distinctions. Do not blindly replace all mock APIs. Option B repository was not available in the reviewed material.

Gate A: `getServiceFormSchema` returns real V3 tenant fields, all relevant controls rendered, Connect active validation applied, CP-specific financial/status controls separately permissioned.

Gate B: create two same-type service items with different UUIDs; editing item B does not mutate item A, and report counts both.

Gate C: transition options from backend workflow, never client-entered arbitrary state; history and tenant-safe report reconcile.

Gate D: in both UIs, inspect network calls; no `/data/*.json` calls for the committed demo vertical slice. Shared contract, different UI presentation.

Security: token comes from approved auth adapter; no hardcoded credentials or non-anonymized fixtures. Financial `Bill To` write requires DB-owner mapping decision.
