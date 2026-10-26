# New CP AI Reference Index

## Purpose

This index is the entry point for the integrated New CP AI material in the React Option A repository. It tells an AI agent which source to read, what authority it has, and which work it may or may not authorize.

The files in this directory are reference and workflow controls. They do not, by themselves, authorize application changes, backend integration, database migrations, production operations, or a change to the approved Option A visual direction.

## Required reading order

1. Repository root `AGENTS.md` or `CLAUDE.md`, depending on the active tool.
2. `docs/00_READ_FIRST.md` and the repository source inventory.
3. `docs/newcp-ai/README_START_HERE.md`.
4. `docs/newcp-ai/INTEGRATION_WITH_REPOSITORY.md`.
5. `docs/newcp-ai/policy/STATUS_AND_DECISIONS.md`.
6. `docs/newcp-ai/tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md`.
7. `docs/newcp-ai/templates/option-a/AGENTS.md`.
8. The smallest task file that matches the approved work.
9. Only the versioned references required by that task.

For IAM/authentication work, additionally read:

10. `policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`.
11. `references/iam/README.md` and the relevant IAM reference files.
12. `tasks/iam/IAM-001-read-only-assessment.md` or a later approved IAM task.

## Source and authority map

| Resource | Role | Authority and use |
| --- | --- | --- |
| `references/project/AAA_New_CP_October_2026_Demo_Meeting_Guide_20261006_V1.2.pdf` | Demo and business-context reference | Describes the October demo scenario, expected Plan A/Plan B scope, roles, validation expectations, and evidence/monitoring direction. It is not permission to invent implementation details. |
| `README_START_HERE.md` | Handoff entry point | Defines the V0.9 package scope, read order, F07 status, and required gates. |
| `policy/STATUS_AND_DECISIONS.md` | Status and precedence | Separates confirmed, legacy, target, blocked, and unverified states. |
| `policy/F07_DECISION_AND_RELEASE_GATES.md` | F07 policy | Defines service-level payer behavior and the V204/ETL/finance release gates. |
| `tasks/00_READ_ONLY_REPOSITORY_PREFLIGHT.md` | First implementation task | Requires a read-only repository assessment before code changes. |
| `tasks/04_FRONTEND_OPTION_A.md` | Option A frontend scope | Defines the selected Biomodel and Conversion service-form work, Option A independence, mock/live boundaries, and error behavior. |
| `tasks/07_F07_PAYER_VERTICAL_SLICE.md` | F07 frontend/backend slice | Defines per-service payer selection, API fields, tests, and the no-migration boundary. |
| `tasks/06_INTEGRATION_EVIDENCE.md` | Evidence workflow | Defines authentic evidence requirements and the `MOCK` versus `INTEGRATED` distinction. |
| `references/f07/integration/newcp-demo-f07.openapi.yaml` | Provisional API design source | Use for contract-oriented analysis only. It explicitly does not prove a live deployed API or schema. |
| `references/f07/integration/newcp-demo-client-f07.ts` | Provisional typed client | Framework-independent reference for API shape; do not treat it as a live integration or copy it blindly into the application. |
| `references/v06/form_biomodel.json` and `form_conversion.json` | Form field sources | Use the source-grounded controls and validation matrix; do not activate unattached validators. |
| `references/f07/fixtures/` | Synthetic examples | Safe development/test examples only. They do not prove persistence, tenant isolation, finance correctness, or production readiness. |
| `scripts/check_handoff.py` | Local integrity check | Offline validator for the integrated file layout and reference data. It does not access a database, network, or production system. |
| `policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md` | IAM business baseline | Approved Google-only authentication, internal V3 IAM/Casbin authorization, tenant, session, audit, capability, and same-family inheritance rules. It does not prove runtime implementation. |
| `references/iam/` | IAM engineering references | Role discovery, capability boundaries, journeys, acceptance groups, and implementation gaps. Exact role codes and hierarchy edges remain evidence-dependent. |
| `tasks/iam/IAM-001-read-only-assessment.md` | IAM first task | Requires a read-only comparison of the repository with the v0.9.5 IAM baseline before code changes. |

## Status labels required in plans and evidence

Use the package labels instead of vague claims:

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

## What these references do not authorize

- No database migration, ETL run, privileged SQL, or production operation.
- No real patient data, credentials, tokens, production dumps, or sensitive screenshots in the repository or AI prompts.
- No invented endpoint, field, callback URL, permission, authentication behavior, or persistence claim.
- No replacement of Option A with another option's component tree or visual system.
- No switch from the repository's approved React + MUI direction without the applicable project decision and an explicit documented exception.
- No statement that F07 is live until the V204 schema, ETL stage 90, API deployment, and finance validation gates have evidence.

## Local validation

Run from the repository root:

```text
python docs/newcp-ai/scripts/check_handoff.py
```

This validates the copied handoff structure and selected JSON/CSV references only. It is not an API, database, ETL, finance, or end-to-end integration test.
