# v0.9.8 Authentication Contract Reference

**Source:** NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028
**Authority:** 2026-10-28_DASHBOARD_IAM_API_UPDATES/00_README_REVISION_SCOPE.md + 04_RASHAD_ALL_QUESTIONS_ANSWERS.md
**Status:** APPROVED contract decisions; live runtime verification NOT performed by this repository

## Authentication Architecture

| Principle | Rule |
|---|---|
| Identity authentication | Google Identity Services (GIS) only |
| Authorization authority | PostgreSQL V3 IAM + Casbin (backend) |
| Google Groups | STRICTLY EXCLUDED -- not used for any auth/authz |
| Tenant selection | Backend only -- frontend never selects or infers tenant |
| Role selection | Backend only -- frontend never selects or infers roles |
| Capability inference | Backend only -- auth/me provides backend-resolved capabilities |

## Login Flow

### Step 1 -- Google Identity Services

The frontend uses Google Identity Services to obtain a Google ID token.
VITE_GOOGLE_CLIENT_ID must be obtained from Hesham (backend owner) -- never invent.

### Step 2 -- POST /api/v1/auth/login

```
POST /api/v1/auth/login
Content-Type: application/json
{ "idToken": "<google-id-token>" }
```

#### AUTHORIZED response
```json
{ "accessStatus": "AUTHORIZED", "token": "<session-token>", "expiresAt": "<timestamp>" }
```
- Store token securely. Use Authorization: Bearer <token> for subsequent requests.
- Proceed to GET /api/v1/auth/me.

#### PENDING_ACCESS response
```json
{ "accessStatus": "PENDING_ACCESS" }
```
- No session token issued. Display Pending Access message. Do NOT grant access.

### Step 3 -- GET /api/v1/auth/me (AUTHORIZED only)

Returns: email, userUuid, tenantSlug, roleCodes, capabilities, isPendingAccess

NOTE: roleCodes are UI hints only. Do NOT use as a permission oracle.

## Pending Access Message (exact text required)

"Your account is authenticated, but access has not been assigned yet."

## Logout

POST /api/v1/auth/logout with Authorization: Bearer <session-token>
Clear all local session state after call (success OR failure).

## Error Handling

| Status | Meaning | Frontend behavior |
|---|---|---|
| 401 | Authentication failure / expired session | Redirect to login; clear local session |
| 403 ACCESS_NOT_ASSIGNED | Authenticated but no tenant/role grant | Show Pending Access view |
| 403 (other) | Permission denied | Show access denied |
| 404 on auth endpoint | Endpoint not deployed | Show backend unavailable; mark BLOCKED |
| 503 | Backend unavailable | Show retry/unavailable state |

Auth errors: nested {error: Problem}. Other errors: flat Problem shape.

## Session Lifecycle

| Parameter | Value |
|---|---|
| Idle timeout | 30 minutes (server-enforced) |
| Absolute lifetime | 8 hours (server-enforced) |
| Refresh/revocation | Role changes apply on next protected request |

## Authorization Rules (Non-Negotiable)

- Google Groups are NOT used for any authorization purpose.
- Frontend does NOT select, infer, or hardcode tenant IDs.
- Frontend does NOT select, infer, or hardcode role names.
- Frontend does NOT hardcode capability decisions.
- @3ddx.com email domain is NOT a grant -- provisioning eligibility only.
- DEMO_SEED_TENANT_ID=1 is seed/test configuration ONLY -- never a session fallback.
- Never hardcode tenantId: 1 as a default grant.
- Do NOT add a tenant selector or tenant switcher UI.

## Verification Status

| Item | Status |
|---|---|
| Contract defined | APPROVED (v0.9.8 handoff) |
| Backend IAM implementation | OWNER_REPORTED_COMPLETE (Hesham) |
| Runtime acceptance tests | NOT_VERIFIED (no live backend in this repo) |
| Google client ID | BLOCKED (must be obtained from Hesham/backend) |
| Live VPN/backend access | NOT VERIFIED |
| Persistence behavior across reload | PARTIAL -- requires Hesham confirmation |
| Exact 401/403 code matrix | PARTIAL -- requires Hesham confirmation |
