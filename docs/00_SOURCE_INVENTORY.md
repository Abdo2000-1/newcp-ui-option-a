# Source Inventory and Precedence

## Inspection result

This repository is the exact `main` clone of `https://github.com/Abdo2000-1/cp-pro-max.git` at commit `37a39e5c74d73a931f23b1474fbef8e5aecedeb5`. The engineering system has now been merged into this same repository root. The canonical OpenAPI 3.0.3 contract is present at `docs/newcp-ai/references/api/newcp.openapi.yaml`. The live backend service remains external/unconnected in this frontend repository.

The repository provides a verifiable current-state baseline: React/TypeScript/Vite source under `src/`, static JSON fixtures under `public/data/`, an existing `package.json`/`package-lock.json`, Vite configuration, repository documentation, and the merged Claude engineering controls under `.claude/`. Local ignored dependency/build artifacts are not part of the preserved source snapshot.

## Source inventory

| Source | Type | Status and use | Key content used |
|---|---|---|---|
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/00_START_HERE.txt` | Package notice | Explicitly says the bundle is discussion draft V1.2 and proposed structures/80% target are not formally approved until kickoff decisions are recorded | Precedence and approval-status warning |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/00_READ_FIRST_Team_Guide.md` | Team guide | Selected package reading order and cross-repository rules | API-first work, repeated same-type instances, POC proof, dates, exclusions |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/00_READ_FIRST_Team_Package_Guide.docx` | Team guide | Duplicate Word version of the selected guide | Confirms stack, role headlines, evidence expectations, six-day baseline |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/01_Team_Discussion_and_Execution_Plan.docx` | Discussion plan V1.2 | Proposed execution baseline; contains confirmed directions and decisions needed at kickoff | Core scope, role allocation, gates, Definition of Ready/Done, risks |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/02_Repository_Structure_and_Engineering_Standards.docx` | Standards draft | Proposed minimum structure and quality/security baseline; explicitly says to preserve working repos | Backend/frontend boundaries, OpenAPI ownership, CI/testing, POC policy |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/docs/03_API_Contract_and_Domain_Guardrails.md` | API/domain guardrails | Contract-first rules; candidate paths are explicitly illustrative | OpenAPI authority, instance identity, tenant/error/idempotency questions |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/docs/04_Demo_Evaluation_and_Scope_Boundaries.md` | Demo scope | Evaluation journey and exclusions | CEO vs later UAT, rehearsal evidence, out-of-scope items |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/docs/05_Quality_and_Demo_Acceptance_Checklist.md` | Acceptance checklist | Required checklist with status/evidence/reviewer convention | Functional, platform, telemetry, CI, rehearsal, and CEO evidence |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/templates/Developer_Task_Breakdown_Template.md` | Developer template | Required per-developer breakdown format | Hours, dependencies, PRs, acceptance evidence, exceptions |
| `New_CP_TEAM_Selected_Sharing_Package_2026-10-19/templates/POC_Integration_Register.md` | Integration register | Required POC readiness and smoke-proof fields | POC ownership, proof, limitations, fallback |
| `02_Team_Selected_Files_Explanation_and_Kickoff_Guide (1).docx` | Distribution guide | Consolidated package explanation; calls the package a proposed baseline | Same-type services, role headlines, deliverables, exclusions |
| `DB_Analysis_Report_V3_Initial_Review.docx` | Supporting database review | Abdo-authored initial familiarization; explicitly not a full audit or sign-off | V3 tenant/RLS and domain context; no application implementation proof |
| `WBS.docx` | Supporting WBS draft | Proposed baseline with scope confirmation pending | Analysis/documentation checkpoints and later implementation examples |
| `NewCP_Approved_IAM_Developer_Handoff_v0.9.5_2026-10-26` | IAM Handoff Pack | Authoritative business requirements for IAM v1.2, 5 business families, Google Sign-in only, no Google Groups, and role hierarchy | IAM business baseline, role capability matrix, user journeys, error contract |
| `NewCP_Approved_IAM_Developer_Handoff_v0.9.7_2026-10-26` | Tenant Clarification Pack | Authoritative clarification separating user grants, active session context, and transaction RLS. Supersedes v0.9.6 for tenant handling only | `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`, acceptance tests TEN-01..30, example env |
| `NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028` | v0.9.8 Review Package | Authoritative v0.9.8 updates: Google login contract (`POST /api/v1/auth/login`, `GET /auth/me`, `POST /auth/logout`), Orders Dashboard is DESIGN-ONLY (no API integration assigned to FE; `02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml` is proposed only), Admin role 20 capabilities, F07 Bill To reported complete (runtime verification pending) | `00_README_REVISION_SCOPE.md`, `04_RASHAD_ALL_QUESTIONS_ANSWERS.md`, `05_TESTS_AND_RELEASE_GATES.md` |
| Repository root | Existing frontend repository plus merged engineering system | Exact clone of the user-designated frontend baseline with project-specific documentation, rules, skills, specialist agents, and evidence controls merged into the same root | Current frontend structure, scripts, dependencies, local data boundary, and governed workflow |
| `C:\Users\Abdo Al Adawy\Desktop\ai-for-software-engineers-guide.pdf` | Methodological reference | Read as requested; Part 2 establishes documentation, rules, skills, task workflow, and human ownership | Method for this engineering system; not a project specification |
| User engineering task in this conversation | Individual-task authority | Controls this requested organizational deliverable and the stated Abdo boundary | Required artifacts, non-fabrication rules, Abdo Option A/MUI exclusion |

## Precedence used

1. User task and explicit individual constraints for this workspace.
2. Approved task documents and approved project plan. The supplied package is not yet an approval record; its status is preserved.
3. Merged project engineering controls in this repository for workflow, traceability, review, and evidence integrity; these take precedence over conflicting generic or legacy repository documentation.
4. Actual repository implementation and configuration for existing behavior and compatibility.
5. The AI engineering guide as methodology only.
6. Existing team or mentor decisions, when documented in the supplied files; unresolved contradictions are recorded rather than silently reconciled.

## Missing sources

The following were referenced or expected but are not deployed in this local frontend environment: the live backend repository runtime, sanitized database/app-role runtime access, and live VPN/Google OAuth credentials. Note that canonical `docs/newcp-ai/references/api/newcp.openapi.yaml` and v0.9.8 handoff documentation are present in this repository. In v0.9.8, Google authentication (`POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`) and IAM are reported completed by Hesham (backend owner), while live runtime verification remains unverified in this repository. F07 Bill To remediation (`billed_to_contact_id` and `billed_party_origin` separation from `is_billable`) is reported completed by the Technical Lead, with runtime database verification pending. Orders Dashboard API extension (`02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml`) is proposed only; the frontend Orders Dashboard scope is UI/UX and labeled synthetic/mock data only. The user-provided selected-package files were also unavailable at their stated filesystem paths during this merge; their earlier inspection status and unresolved source availability are preserved here rather than replaced with fabricated copies. The frontend manifest, lockfile, source, Git metadata, and merged engineering system are present at the repository root.
