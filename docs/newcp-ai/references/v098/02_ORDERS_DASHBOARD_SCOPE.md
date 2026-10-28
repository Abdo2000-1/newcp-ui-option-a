# v0.9.8 Orders Dashboard Scope

**Source:** NewCP_Approved_Developer_Handoff_v0.9.8_REVIEW_20261028
**Status:** APPROVED DESIGN SCOPE; API integration NOT assigned to frontend

## CRITICAL SCOPE CONSTRAINT

Orders Dashboard is DESIGN-ONLY for both React candidates.
Both deliver visually complete UX/flows with labeled synthetic/mock data.
There is NO requirement to integrate dashboard API endpoints in this phase.

## Scope Classification

| Concern | Status |
|---|---|
| Dashboard UI/UX design | APPROVED |
| Dashboard synthetic/mock data | APPROVED (must be clearly labeled) |
| Dashboard API integration | NOT ASSIGNED to frontend |
| Proposed extension YAML | PROPOSED_ONLY -- not canonical |

## Canonical vs Proposed API

- Canonical: docs/newcp-ai/references/api/newcp.openapi.yaml
- Proposed (dashboard extension): 02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml -- PROPOSED ONLY
- The proposed YAML must NOT replace or be merged into the canonical contract.

## Approved OD Decisions (Design Reference)

OD-01: FINANCE order/service details with approved financial edits
OD-02: QC read-only order/service details plus authorized audits
OD-03: FINANCE/QC full tenant-authorized data visibility
OD-04: One row per distinct order with child instances
OD-05: Family/subtype filters (TP/SG; nested crowns)
OD-06: Instance status filtering
OD-07: Default 50 orders/page
OD-08: Server sorting eligible columns
OD-09: Creation-date and order ID/patient/doctor/scanning-center search
OD-10: Expanded order shows only matching valid instances
OD-11: Local loaded-page instant search
OD-12: Eligible = valid, non-deleted including Completed/On Hold
OD-13: Rolling date presets: today/yesterday/last 7/14 days/last month
OD-14: Global server and local loaded-page search
OD-15: Matching service sum with separately available full-order sum, by currency
OD-16: Latest matching event for service-derived parent dates
OD-17: Applied voucher amount, per-instance details
OD-18: Parent summary of independent service locks
OD-19: Received mapping open (pending legacy verification)
OD-20: Notes/CR/CS-Task visible but unsupported controls disabled
OD-21: Main-order archive date subject to V3 verification
OD-22: Charged = latest real charge among matching instances, not invoice flag
OD-23: More only implements authorized actions; unsupported disabled
OD-24: Sent meaning remains open pending original Flow/legacy verification

## Frontend Implementation Constraint

Do NOT call any of the following from the frontend (not assigned, proposed only):
- GET /api/v1/orders/dashboard-summary
- Any endpoint from 02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml
- Any endpoint from 03_NEWCP_API_WITH_DASHBOARD_REVIEW.yaml

The existing GET /api/v1/orders/{orderUuid}/services canonical endpoint is not affected.
