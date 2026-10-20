---
trigger: always_on
description: Enforce repository scope, source precedence, ownership boundaries, and requirements traceability.
---

# Scope and Traceability

- Start implementation from a requirement ID, authoritative source section, owner, and acceptance criterion.
- Treat `docs/02_REQUIREMENTS/traceability-matrix.md` as the working map; documentation presence is not implementation evidence.
- Keep facts, requirements, existing implementation, proposed practices, assumptions, open questions, and blockers separate.
- Record contradictions with both sources. Never silently reconcile a conflict affecting scope, ownership, architecture, or compliance.
- Do not add features, dependencies, endpoints, fields, directories, CI, or ownership without source support or explicit approval.
- Apply the user-provided Abdo boundary: Full Stack 5 hours as written, React Option A only, and no MUI implementation or comparison-spike ownership.
- If work requires guessing, stop and record the blocker in `docs/02_REQUIREMENTS/open-questions.md`.
