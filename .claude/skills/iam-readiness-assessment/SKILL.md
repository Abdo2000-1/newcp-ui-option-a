---
name: iam-readiness-assessment
description: Read-only assessment of Google authentication, PostgreSQL IAM, Casbin, tenant isolation, hierarchy, sessions, and audit readiness.
---

# IAM Readiness Assessment

Read the IAM baseline and every file under `docs/newcp-ai/references/iam/`, then inspect the current auth, router, API, session, and test files. Inventory facts, contracts, missing mappings, hierarchy evidence, tenant/session/audit dependencies, and acceptance coverage. Do not edit product code or invent OAuth callbacks, IAM codes, role edges, Casbin policies, or backend endpoints. Stop on missing contracts and return one report with statuses `CONFIRMED`, `EVIDENCE_REQUIRED`, `MOCK`, `BLOCKED`, `DEFERRED`, and `NOT_VERIFIED`. Human review is required before implementation.
