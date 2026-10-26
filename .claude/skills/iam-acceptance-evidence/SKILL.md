---
name: iam-acceptance-evidence
description: Produce authentic evidence for IAM authentication, authorization, hierarchy, tenant, session, audit, and permission acceptance scenarios.
---

# IAM Acceptance Evidence

Use `docs/newcp-ai/references/iam/user-journeys-and-acceptance.md` and the approved contracts. Map every claim to an IAM requirement and AT scenario with actor, role, tenant, request, expected status, mutation check, audit evidence, environment, and limitation. Separate frontend tests, synthetic contract tests, backend integration, and live demo evidence. Verify positive/negative hierarchy, tenant, session, revocation, and export cases. Never treat fixtures as live evidence, never run migrations or privileged operations, and mark missing runtime as BLOCKED or NOT_VERIFIED. Do not fabricate screenshots, logs, approvals, or success.
