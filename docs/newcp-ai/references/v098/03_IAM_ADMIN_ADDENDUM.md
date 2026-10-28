# v0.9.8 IAM Admin Addendum

**Source:** NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028
**Authority:** 00_README_REVISION_SCOPE.md (IAM ADMIN addendum carried from Oct 27)
**Status:** APPROVED additions; runtime verification NOT performed by this repository

## Admin Role

| Property | Value |
|---|---|
| Role name | admin |
| is_system | true |
| Seeded capabilities | 20 total (16 baseline + 4 IAM read) |
| Behavior | Immutable, audited, least privilege |

## 4 IAM Read Capabilities (v0.9.8 addition)

- iam.users.read
- iam.user_roles.read
- iam.roles.read
- iam.capabilities.read

## Provisioning Rules

- Provisioning NEVER grants ADMIN automatically
- Idempotent role/capability seeds separate from explicitly authorized iam.user_roles assignment
- Prohibit client identities and unauthorized cross-tenant grants
- No unrestricted bootstrap, no automatic legacy admin inheritance
- ADMIN-to-ADMIN delegation PROHIBITED per existing API

## CRITICAL: Environment-Specific Constraint

The developer demo IAM employee candidate iam.users.id=44020 was environment-specific.
NEVER use id 44020 for another database.
Valid employee/tenant/Google OIDC issuer+subject validation is REQUIRED BEFORE any ADMIN grant.

## Deferred (Documentation Only)

Future delegation policy, access review workflows, configurable IAM UI, revocation governance,
multi-tenant administrator models, additional capability codes -- all require future approval.
