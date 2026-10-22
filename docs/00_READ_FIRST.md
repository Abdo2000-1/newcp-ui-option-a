# Read First: Repository Navigation

This repository contains the existing CP PRO MAX frontend plus the merged engineering system that governs future work. The numbered documentation sections are intentional:

1. `AGENTS.md` — Antigravity workspace instructions and approval gates.
2. `docs/00_SOURCE_INVENTORY.md` — source precedence, confirmed facts, and unavailable dependencies.
3. `docs/01_PROJECT/` — project purpose, current architecture, conventions, security, and engineering guidelines.
4. `docs/02_REQUIREMENTS/` — requirements inventory, traceability matrix, and open questions.
5. `docs/03_WORKFLOW/` — task lifecycle, Definition of Done, ownership, decisions, and AI-tool compatibility.
6. `docs/04_INTEGRATION/` — OpenAPI and frontend/backend integration status.
7. `docs/05_QUALITY/` — testing strategy, quality gates, and evidence procedures.
8. `docs/90_PRODUCT_REFERENCE/` — original frontend product specifications and design references.

## New CP AI handoff

For work that depends on the October New CP handoff or F07 service-level billing, also read `docs/newcp-ai/REFERENCE_INDEX.md` and `docs/newcp-ai/INTEGRATION_WITH_REPOSITORY.md` before selecting a task. The handoff is integrated as source material and workflow guidance; it does not authorize backend, database, production, or unapproved application changes.

## AI workflow order

Use the relevant skill in this order for implementation work:

1. `.agents/skills/plan-task/`
2. `.agents/skills/groom-task/`
3. `.agents/skills/implement-task/`
4. `.agents/skills/code-review-task/`
5. Human review and approval
6. `.agents/skills/finalize-task/`

Use the specialist skills only when their narrower responsibility is needed:

- `repository-audit` for current-state discovery.
- `api-contract-analysis` for OpenAPI and integration questions.
- `testing-quality` for test planning and quality gates.
- `evidence-acceptance` for evidence and acceptance verification.

Antigravity discovery details and the Claude compatibility layer are documented in `docs/03_WORKFLOW/ai-tooling-compatibility.md`.

## Application source order

The application itself remains organized according to its existing conventions:

`src/main.tsx` → `src/App.tsx` → `src/pages/`, `src/components/`, `src/contexts/`, `src/hooks/`, `src/services/`, `src/types/`, and `src/utils/`.

Do not move or refactor application code merely to make the documentation tree look cleaner. Future source changes require an approved task and must follow the traceability and quality gates above.
