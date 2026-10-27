# Route & Page Audit against Official Business Documentation (Task 2)

## Executive Summary
This document records the official route audit conducted against the New CP business requirements, clinical workflows, and OpenAPI contracts.

---

## 1. Approved Application Routes

| Route | Page Component | Business Domain | Data Source / Contract |
| :--- | :--- | :--- | :--- |
| `/home` | `HomePage.tsx` | Gateway Landing | Session & Workspace Quick Actions |
| `/flow`, `/orders` | `Flow.tsx` | Production & Orders Queue | `GET /api/v1/orders` |
| `/add-case` | `AddCase.tsx` | Prescription & Scan Intake | `POST /api/v1/orders` |
| `/order-details` | `OrderDetailsPage.tsx` | Case & Sub-Orders Matrix | `GET /api/v1/orders/:id` |
| `/edit-case` | `EditCasePage.tsx` | Safe Prescription Editing | `PUT /api/v1/orders/:id` (ETag Safe) |
| `/quarter-targets` | `QuarterTargetsReport.tsx` | Production Targets Reporting | `GET /api/v1/reports/targets` |
| `/task-47` | `Task47ModelWorkReport.tsx` | 3D Laboratory & Models | `GET /api/v1/reports/model-work` |
| `/task-31` | `Task31StaffTargets.tsx` | Technician Capacity & Targets | `GET /api/v1/reports/staff-targets` |
| `/dashboard` | `Dashboard.tsx` | Clinical CRM & Telemetry | Live Throughput & Active Cases |
| `/workflow-board` | `WorkflowBoard.tsx` | Visual Kanban Transition Lanes | `GET /api/v1/workflow/stages` |
| `/cases` | `Cases.tsx` | Historical Case Directory | `GET /api/v1/cases` |
| `/patients` | `Patients.tsx` | Patient Demographic Directory | `GET /api/v1/patients` |
| `/doctors` | `Doctors.tsx` | Clinician & Practice Registry | `GET /api/v1/doctors` |
| `/clinics` | `Clinics.tsx` | Clinic & Facility Registry | `GET /api/v1/clinics` |
| `/billing` | `Billing.tsx` | Invoices & Payer Statements | `GET /api/v1/billing` |
| `/scan-center` | `ScanCenter.tsx` | CBCT & Intraoral Scan Ingestion | Scan Intake Pipeline |
| `/documents` | `Documents.tsx` | Digital Prescriptions & PDFs | Documents Archive |
| `/change-requests`| `ChangeRequests.tsx` | Modification & Revision Tickets | Workflow Change Tickets |
| `/reports` | `Reports.tsx` | Laboratory Operations Hub | Operations Summaries |
| `/profile` | `Profile.tsx` | Operator Credentials & Setup | Auth Context |
| `/settings` | `Settings.tsx` | Workstation & App Preferences | Local Storage & User State |
| `/cms` | `CmsControls.tsx` | Local Administration CMS | Local In-Memory & PostHog Boundary |

---

## 2. Deprecated / Non-Workflow Routes

| Route | File Source | Reason for Deprecation | Remediation |
| :--- | :--- | :--- | :--- |
| `/grid` | `src/features/settings/pages/Grid.tsx` | Generic test-bench table created for preliminary UI mockups. Contains no business workflow, no validation rules, and no backend API contract. | Hidden from primary sidebar navigation; redirected to `/flow`. |
| `/forms` | `src/features/settings/pages/Forms.tsx` | Generic component showcase with disconnected input fields. Superseded by DynamicFormRenderer and AddCase. | Hidden from primary sidebar navigation; redirected to `/settings`. |
