# New CP Project Overview

## Purpose

New CP is being prepared for an October 2026 CEO demonstration of two distinct React + MUI user experiences that deliver equivalent Models and Conversion business outcomes over one shared backend. The implementation baseline described by the selected package is Node.js, TypeScript, Express, Drizzle, Zod, and PostgreSQL V3.

## Stakeholders and evaluation

The technical lead owns business and architecture approvals, coordination, risk gates, demo narrative, and acceptance. The October CEO demo is directional design evaluation. Later business and operator UAT is expected in a dedicated non-production environment and is not an October implementation deliverable.

The source package assigns headline roles to a backend intern, frontend intern, full-stack intern, full-time developer, and technical lead. It does not identify individuals by name. Abdo's individual boundary is supplied separately by the user and is recorded in `docs/03_WORKFLOW/ownership/abdo.md`.

## Confirmed or package-level boundaries

- One shared API and PostgreSQL V3 baseline support both frontend options.
- An order may contain multiple independently identifiable instances of the same service type.
- Legacy Swagger is historical reference only; New CP OpenAPI must be derived from approved business requirements and architecture.
- Backend domain rules belong in services; Drizzle access belongs in repositories; Express handlers should not query the database directly.
- Tenant context must be server-validated and tested with an appropriate application role.
- POCs are reusable starting points only. Each must pass New CP runtime proof before being called integrated.
- Broad V3 review, migration, ETL/reconciliation, production rollout, operator UAT completion, and unapproved stretch scope are excluded from the October implementation.

## Scope status vocabulary

Use `confirmed fact`, `approved requirement`, `existing implementation`, `proposed engineering practice`, `assumption`, `open question`, or `blocker` in plans and evidence. A document mention is not proof that an implementation or acceptance criterion is complete.
