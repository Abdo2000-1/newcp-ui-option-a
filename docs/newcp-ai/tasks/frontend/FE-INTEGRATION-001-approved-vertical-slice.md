# Task FE-INTEGRATION-001: Approved Backend Vertical Slice Assessment (BLOCKED)

## Executive Summary
This document provides the formal vertical slice integration readiness audit for the New CP React Option A repository against the approved New CP OpenAPI contract. In accordance with strict development policy ("*Do not fake integration; do not replace real tests with a passing mock and call it integration; create a documentation-only BLOCKED PR*"), this PR documents the missing runtime prerequisites, release blockers, responsible stakeholders, and the exact evidence required to unblock live verification.

---

## 1. Prerequisite Verification Matrix

| # | Prerequisite | Status | Responsible Owner | Required Evidence | Impact | Next Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Approved non-production backend URL | **MISSING** | DevOps / Infrastructure | Formal non-production base URL (e.g. `https://api.staging.newcp.internal/api/v1`) with TLS certificates. | Frontend transport cannot initiate live HTTP requests; remains in offline mock mode. | Provision staging ingress endpoint and configure DNS/env. |
| **2** | Deployed backend instance | **MISSING** | Backend Lead | Running backend service container implementing `newcp.openapi.yaml` endpoints. | Real server response handling cannot be validated. | Deploy backend container to staging namespace. |
| **3** | Tenant-scoped test credentials | **MISSING** | Security / Auth Owner | Valid OAuth2 bearer token / API keys bound to a verified test tenant with appropriate app roles. | Requests to protected endpoints fail with 401/403. | Provision test tenant and issue scoped service credentials. |
| **4** | Sanitized test order | **MISSING** | Data / QA Owner | Real database order row in staging PostgreSQL with valid `orderUuid` and line items. | Cannot execute vertical slice create/edit on real orders. | Seed sanitized staging order data. |
| **5** | Real catalog identifiers | **MISSING** | Catalog / Product Owner | Resolved catalog UUIDs for Biomodel and Conversion (`Decision R01`). | Creation payloads currently use synthetic catalog IDs (`cat-biomodel-sellable`). | Finalize catalog ID mappings in database seed. |
| **6** | Field metadata mappings | **MISSING** | Database / Backend Owner | Active V3 database column resolutions for Biomodel and Conversion form inputs (`Decision R02`). | Dynamic forms cannot persist answers into target database columns. | Approve column mapping matrix. |
| **7** | Allowed transitions & guards | **MISSING** | Workflow / Product Owner | Effective workflow definition rows and permission matrix in `workflow.transitions` (`Decision R03`). | State machine advancement cannot be verified against DB triggers. | Deploy transition matrix into staging DB. |
| **8** | Permission matrix | **MISSING** | Security / Product Owner | Verified Casbin / RBAC permission policies for Clerk role (`03_Actor_Action_Capability_Matrix.csv`). | Frontend cannot verify authorization boundaries against server enforcement. | Formalize and test staging RBAC policies. |
| **9** | Approved staging environment | **MISSING** | Release Engineering | Isolated, sanitized environment with network connectivity to frontend test runners. | Vertical slice cannot be executed in an authentic runtime environment. | Sign off on staging environment readiness. |
| **10** | Runtime approved OpenAPI contract | **TARGET APPROVED (RUNTIME MISSING)** | Lead Technical Architect | Running backend matching approved OpenAPI 3.0.3 YAML schema without drift. | Runtime contract conformance cannot be asserted. | Execute contract linting against live staging responses. |

---

## 2. Vertical Slice Scenario Assessment Matrix

| Scenario | Mode | Execution Status | Reason / Blocker |
| :--- | :--- | :--- | :--- |
| **Catalog Lookup** | Staging Live | **BLOCKED** | Staging backend URL missing; real catalog UUIDs unmapped (`R01`). |
| **Form Schema Lookup** | Staging Live | **BLOCKED** | Backend form metadata endpoint not deployed. |
| **Create Biomodel Instance** | Staging Live | **BLOCKED** | Mutating writes prohibited without live staging DB and order seed. |
| **Create Second Same-Type Instance** | Staging Live | **BLOCKED** | Requires database with unique `order_items.id` constraint validation. |
| **Read Both Instances** | Staging Live | **BLOCKED** | Dependent on create. |
| **Edit Each Independently** | Staging Live | **BLOCKED** | Requires live ETag validation and database transaction semantics. |
| **Transition One Item** | Staging Live | **BLOCKED** | Workflow transition engine not running on live server. |
| **Read Audit History Trail** | Staging Live | **BLOCKED** | Audit history tables unpopulated on live instance. |
| **Unauthorized & Cross-Tenant Denials** | Staging Live | **BLOCKED** | Multi-tenant auth boundary not deployed to staging. |
| **Optimistic ETag Conflict (412)** | Staging Live | **BLOCKED** | Requires concurrent requests against live HTTP server. |
| **Instance-Aware Reporting** | Staging Live | **BLOCKED** | Approved reporting endpoint does not exist in target OpenAPI. |

---

## 3. Option A Production Code Integrity
- In compliance with task instructions, **no production source code has been altered or modified to simulate a fake vertical slice pass**.
- Offline and mock boundaries remain isolated under `src/shared/api/`, preserving 100% test coverage and readiness for zero-code-change configuration switching (`VITE_API_MODE=LIVE_HTTP`) once prerequisites are fulfilled.
