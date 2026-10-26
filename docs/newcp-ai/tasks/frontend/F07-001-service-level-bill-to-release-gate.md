# Task F07-001: Service-Level Bill To Release Gate Assessment (BLOCKED)

## Executive Summary
This document provides the authoritative release gate assessment for the F07 Service-Level Bill To feature in the New CP React Option A repository. 

As confirmed in `NewCP_Dev_Package_v0.9.2.2`, `policy/CURRENT_V3_DATABASE_STATUS.md`, and `policy/F07_DECISION_AND_RELEASE_GATES.md`, the required schema columns (`billed_to_contact_id` and `billed_party_origin`) remain **absent** from the active V3 PostgreSQL database. Consequently, this PR is submitted as a **documentation-only BLOCKED PR**. No autonomous database migrations, ETL scripts, fake live persistence, or order-level `contact_id` fallbacks have been executed.

---

## 1. Release Gate Verification Matrix

| # | Release Gate Criterion | Current Status | Responsible Owner | Exact Missing Evidence | Affected Frontend Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | V204 migration applied | **BLOCKED (NOT APPLIED)** | Database Lead / DBA | Certified execution log of `V204__service_level_billed_party.sql` applied to target database. | Frontend cannot persist `billedToContactUuid` to real database rows. |
| **2** | `billed_to_contact_id` exists | **BLOCKED (ABSENT)** | Database Lead | PostgreSQL `\d orders.order_items` schema dump proving column exists with foreign key to `crm.contacts.id`. | Any live SQL write targeting item payer will fail with column undefined. |
| **3** | `billed_party_origin` exists | **BLOCKED (ABSENT)** | Database Lead | PostgreSQL schema dump proving `billed_party_origin` enum column exists with valid provenance domain. | Provenance tracking (`legacy_explicit`, `user_selected`) cannot be enforced by DB triggers. |
| **4** | Corrected ETL / backfill | **BLOCKED (NOT EXECUTED)** | ETL Owner | Restored MySQL dump profile report, mapping approval, and execution logs of corrected stage-30 order items. | Historical service lines lack authoritative payer provenance. |
| **5** | Stage-90 reconciliation | **BLOCKED (NOT RUN)** | ETL / QA Owner | Stage-90 audit report proving zero orphaned, invalid, or mismatched `billed_to_contact_id` values. | Risk of data corruption or billing errors during live checkout. |
| **6** | Downstream finance checks | **BLOCKED (NOT VERIFIED)** | Finance Systems Lead | Reconciled trial run proving invoices and charges group strictly by item-level payer without mixing currencies/parties. | Downstream financial modules may still default to order-level billing contact. |
| **7** | Tenant/contact eligibility | **BLOCKED (NOT VERIFIED)** | Security Lead | Server-side query logs verifying cross-tenant and outside-order contact selections are rejected with 422. | Tenant isolation must be backed by live database constraints, not frontend checks alone. |
| **8** | Payer edit locks verified | **BLOCKED (NOT VERIFIED)** | Backend / DB Lead | Trigger/API verification proving payer modifications on invoiced items (`isInvoiced: true`) are rejected with 403/409. | Frontend enforces read-only badge, but backend enforcement is unverified. |
| **9** | Backend API exposes F07 | **BLOCKED (PROPOSAL ONLY)** | Backend Lead | Staging API endpoint `/api/v1/orders/{orderId}/eligible-billed-parties` and PATCH handling deployed and verified. | Production persistence disabled; client operates in proposal review mode. |

---

## 2. Strict Architectural Safeguards & Current Safe Behavior

In accordance with explicit New CP policy:
1. **No Database Migrations or ETL Execution:** Frontend code does not attempt to execute SQL scripts, run DDL statements, or alter local/remote databases.
2. **No Fallback to `order.contact_id`:** Existing service items without an explicit item-level payer are never retroactively assigned the order-level `contact_id` as their item payer. They are labeled `[PROPOSAL_PENDING_BACKEND_REVIEW]` or `"Not available"`.
3. **No Client-Supplied `billedPartyOrigin`:** The browser boundary (`serviceClient.ts`, `payerClient.ts`) strictly forbids sending provenance origins from client payloads. Provenance is exclusively managed by database triggers and server transactions.
4. **Isolated Mock Boundary:** The frontend provides a fully type-safe client boundary (`payerClient.ts`) and modal selector (`OrderDetailsPage.tsx` Modal 3) capable of choosing between eligible order contacts (Doctor vs Scanning Center), but keeps all live persistence disabled until gates are cleared.

---

## 3. Conditions for Reopening Task F07-001

The F07 implementation task may be reopened for live persistence verification only when all of the following conditions are met:
1. **Database Gate:** The Database Owner submits cryptographically signed or verifiable deployment logs proving `V204__service_level_billed_party.sql` was executed on staging PostgreSQL.
2. **Schema Verification:** Query `SELECT column_name FROM information_schema.columns WHERE table_name='order_items' AND column_name IN ('billed_to_contact_id', 'billed_party_origin')` returns both columns.
3. **ETL Gate:** The ETL Owner provides the stage-90 reconciliation report with 0 unresolved errors.
4. **Finance Gate:** The Finance Systems Lead provides signed evidence of invoice grouping by `order_items.billed_to_contact_id`.
5. **Runtime API:** The Backend Owner deploys the approved OpenAPI endpoints to staging with active contract validation.
