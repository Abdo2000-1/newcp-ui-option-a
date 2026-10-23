# New CP AI Handoff Integration

## Purpose

This directory contains the New CP AI Development Handoff Package V0.9 integrated into the React Option A repository. It is the reference set for the October New CP service-instance work, F07 payer behavior, source-grounded form fields, validation evidence, and API-contract preparation.

The package is copied from the supplied handoff without replacing existing repository documentation. The repository rules and the handoff must be read together.

## Reading order for Option A work

1. `README_START_HERE.md`
2. `policy/STATUS_AND_DECISIONS.md`
3. `policy/F07_DECISION_AND_RELEASE_GATES.md` for payer or financial behavior
4. `tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md`
5. `templates/option-a/AGENTS.md`
6. The smallest relevant task file under `tasks/`
7. Only the relevant versioned references under `references/v06/`, `references/v07/`, or `references/f07/`

## Repository mapping

- Handoff policy: `docs/newcp-ai/policy/`
- Handoff tasks: `docs/newcp-ai/tasks/`
- Form, validation, mapping, fixture, contract, and F07 references: `docs/newcp-ai/references/`
- Tool-specific handoff templates: `docs/newcp-ai/templates/`
- Upstream package manifest: `docs/newcp-ai/MANIFEST_SHA256.csv` (its `payload/` paths are preserved from the supplied handoff package)
- Repository-local layout validator: `docs/newcp-ai/scripts/check_handoff.py`

## Authority and status rules

- Explicit New CP decisions take precedence over evidenced legacy behavior.
- F07 target fields are authoritative for code-generation design: `billedToContactUuid` at the API boundary, `billed_to_contact_id` and `billed_party_origin` in the target V3 model.
- The F07 package does not prove that V204 was deployed, that ETL stage 90 passed, or that downstream finance is integrated. Those states remain gated and must be reported as `NOT VERIFIED`, `BLOCKED`, or another evidence-based status.
- V0.7 and older artifacts are historical evidence where the V0.9 policy says they are superseded. Do not use an archival blocker as a current implementation rule.
- Synthetic fixtures are simulated. They never prove live integration, tenant isolation, financial correctness, or production readiness.
- Do not run migrations, ETL, privileged SQL, production operations, or real-data workflows from this frontend repository.

## Option A boundary

Option A must produce the same business outcomes and consume the same approved API contract as the other frontend option while preserving its independent interaction, layout, and navigation design. The selected demo scope is Biomodel and Conversion service instances; the Implant Analog Model reference is not automatically a committed demo scope.

Use the repository's existing visual and ownership decisions. Do not copy the other option's component tree, invent catalog identifiers, or claim that a mock adapter is a live backend integration.

## Required status labels

Use these labels when recording findings or evidence:

- `NEWCP_CONFIRMED`
- `LEGACY_UI_OBSERVED`
- `LEGACY_CP_OBSERVED`
- `V3_DDL_VERIFIED`
- `CANDIDATE_UNVERIFIED`
- `DEMO_ONLY_APPROVED`
- `BLOCKED`
- `MOCK`
- `INTEGRATED`
- `NOT VERIFIED`

## Handling conflicts

Do not silently reconcile a conflict between the repository, the handoff, the business guide, or an API contract. Record both sources, explain the impact, identify the decision owner, and stop only the affected work while continuing safe work.
