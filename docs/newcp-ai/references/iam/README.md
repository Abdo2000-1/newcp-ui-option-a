# IAM v0.9.5 & v0.9.7 Reference Index

This directory contains the repository-integrated engineering summary for the approved IAM v1.2 and v0.9.7 tenant-clarification handoffs.

Read in this order:

1. `../../policy/IAM_APPROVED_BUSINESS_BASELINE_v1.2.md`
2. `tenant-context-integration.md` (v0.9.7 authoritative tenant specification)
3. `TENANT_OCT_DEMO_IMPLEMENTATION_SPEC_v1.1.md`
4. `role-hierarchy-and-discovery.md`
5. `capability-boundaries.md`
6. `user-journeys-and-acceptance.md`
7. `implementation-gaps-and-deferred.md`
8. `V096_TO_V097_USER_SESSION_TENANT_CHANGELOG.md`
9. `source/` for the important source-package files copied without semantic rewriting.

The source package remains the detailed authority. The summary files make the approved rules discoverable to repository agents, while `source/` preserves the exact IAM specification and machine-readable acceptance/mapping references. None of these files authorize product code, database, OAuth, Casbin, or deployment changes by themselves.

Important labels:

- `APPROVED`: business decision is approved.
- `EVIDENCE_REQUIRED`: the technical mapping or runtime proof is missing.
- `MOCK`: synthetic/offline behavior only.
- `BLOCKED`: cannot be enabled until the named dependency is verified.
- `DEFERRED`: explicitly postponed by the package.

Never use this reference set to invent OAuth callback URLs, IAM codes, Casbin policies, database migrations, tenant grants, credentials, or production claims.
