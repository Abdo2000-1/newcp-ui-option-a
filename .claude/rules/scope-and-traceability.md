# Scope and Traceability Rules

- Start every implementation request from a requirement ID, source section, owner, and acceptance criterion.
- Treat `docs/02_REQUIREMENTS/traceability-matrix.md` as the working map; a documentation mention is not implementation evidence.
- Keep facts, package requirements, existing implementation, proposed practices, assumptions, open questions, and blockers separate.
- Record contradictions with both sources. Never silently reconcile a conflict that affects scope, ownership, architecture, or compliance.
- Do not add features, dependencies, directories, CI, endpoints, fields, or ownership that are not supported by the sources or explicitly approved.
- Apply the user-provided Abdo boundary: Full Stack 5 hours as written, React Option A only, and no MUI implementation or comparison-spike ownership.
- If a task would require guessing, stop and record the blocker in `docs/02_REQUIREMENTS/open-questions.md`.
