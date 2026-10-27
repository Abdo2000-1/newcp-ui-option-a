# Route & Page Cleanup Audit (PR 3 — chore/remove-unsupported-empty-pages)

## 1. Executive Summary

This audit reviewed every route and page component across the New CP React Option A repository against official requirements, OpenAPI contracts, and approved business workflows.

In accordance with PR 3 guidelines:
- Removed unsupported developer showcases and empty mock sandboxes that have no approved business workflow or contract.
- Retained all pages that represent approved clinical and operational workflows, including those utilizing validated mock stores while backend endpoints are under development.
- Verified that no navigation menus, deep links, or tests depend on the removed pages.

---

## 2. Removed & Obsolete Pages

| Route / File | Classification | Reason for Removal | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **`/grid`** (`src/features/settings/pages/Grid.tsx`) | Developer Sandbox | UI component showcase with mock table. Documented in `docs/04_INTEGRATION/api-coverage-matrix.md` as "Not Covered / Developer Sandbox". No approved clinical workflow depends on it. | Removed route from `AppRouter` and nav entry from `Sidebar`. 0 tests affected. |
| **`/forms`** (`src/features/settings/pages/Forms.tsx`) | Developer Sandbox | Component showcase demonstrating input states with simulated forms. Not part of clinical intake or case prescription workflow. | Removed route from `AppRouter` and nav entry from `Sidebar`. 0 tests affected. |
| **`newcp/index.php`** | Obsolete Route Alias | Legacy PHP redirect to `/login`. Legacy task parameters are natively resolved by `LegacyTaskQueryHandler` on `/`. | Removed route from `AppRouter`. No navigation or workflows reference this legacy path. |
| **`CreateOrder.tsx`** (`src/features/orders/pages/`) | Unrouted Duplicate | Early prototype form created before approved dynamic schema wizard (`AddCase.tsx`). Unrouted and unreferenced. | Deleted dead file. 0 imports across codebase. |
| **`EditOrder.tsx`** (`src/features/orders/pages/`) | Unrouted Duplicate | Early prototype form created before approved clinical case editor (`EditCasePage.tsx`). Unrouted and unreferenced. | Deleted dead file. 0 imports across codebase. |
| **`Orders.tsx`** (`src/features/orders/pages/`) | Unrouted Duplicate | Early prototype orders list. Route `/orders` is canonically aliased to `Flow.tsx` (Master Order Flow). | Deleted dead file. 0 imports across codebase. |

---

## 3. Approved & Preserved Route Inventory

### A. Approved Core Clinical & Reporting Workflows
1. **`/home`** — Minimal, calm authenticated landing gateway (`HomePage.tsx`).
2. **`/flow`** & **`/orders`** — Master Order Flow and active clinical production queue (`Flow.tsx`).
3. **`/add-case`** — Clinical case intake with dynamic form schema and catalog selection (`AddCase.tsx`).
4. **`/order-details`** — Clinical case details, ETag concurrency, hold history, and service item inspection (`OrderDetailsPage.tsx`).
5. **`/quarter-targets`** — Department quarterly delivery and turnaround targets (`QuarterTargetsReport.tsx`).
6. **`/task-47`** — 3D Laboratory Model Work fabrication report (`Task47ModelWorkReport.tsx`).
7. **`/task-31`** — Technician and CAD staff performance workload targets (`Task31StaffTargets.tsx`).
8. **`/edit-case`** — Clinical case prescription editing with preflight guards (`EditCasePage.tsx`).
9. **`/dashboard`** — Executive CRM, studio switcher, and urgent queue tracker (`Dashboard.tsx`).
10. **`/profile`** — Authenticated operator profile, workstation settings, and audit view (`Profile.tsx`).

### B. Approved Auxiliary ERP & Entity Management Routes
- **`/cases`** & **`/cases/:caseId`** — Cases directory and clinical case summaries.
- **`/orders/:orderId`**, **`.../workflow`**, **`.../files`**, **`.../sub-orders/:subOrderId`** — Order hierarchy, attachments, and transitions.
- **`/patients`** & **`/patients/:patientId`** — Patient directory, odontogram findings, and clinical history.
- **`/doctors`** & **`/doctors/:doctorId`** — Treating clinicians and practice associations.
- **`/clinics`** & **`/clinics/:clinicId`** — Practice accounts and shipping branches.
- **`/scan-center`** — Imaging center hub and scanner uploads.
- **`/workflow-board`** — Multi-stage lab technician Kanban board.
- **`/change-requests`** — Clinical change request reviews.
- **`/documents`** — Diagnostic files and prescription records.
- **`/billing`** — Financial ledger and prosthetic billing line-items.
- **`/notifications`** — Operator notification center.
- **`/settings`** — System localization, theme, and application preferences.
- **`/config-manager`** & **`/cms`** — CMS controls and local configuration manager.

### C. System & Security Boundaries
- **`/login`** — Google OAuth 2.0 PKCE authentication landing with 401/403 alerts and Pending Access trapping.
- **`/503`** / **`/maintenance`** — Frontend service maintenance view.
- **`/404`** — Standardized Not Found fallback for unmapped routes.
