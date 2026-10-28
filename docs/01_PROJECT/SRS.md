# Project Software Requirements Specification (SRS): 3DDX CP PRO MAX

**Document Identifier:** `SRS-3DDX-PROJECT-2026-V1.0`  
**Classification:** Enterprise Medical Software Specification / Frontend Web Application  
**Standard Compliance:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018  
**Scope:** Whole-Project Frontend Application (`newcp-ui-option-a`)  
**Parent Workspace:** `H:\3DDX\DEMO\newcp-ui-option-a`  
**Primary Domain Source:** `H:\3DDX\02 Backend\New DB V3\03 BUSINESS_GUIDE.html`  
**Package Authority:** `New_CP_TEAM_Selected_Sharing_Package_2026-10-19`  

---

## 1. Scope and Purpose

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the end-to-end system and functional requirements for the **3DDX CP PRO MAX Frontend** (`newcp-ui-option-a`). It encompasses the complete clinical, operational, financial, and administrative interface for 3D Diagnostix, replacing the legacy client portal and staff control panels with a unified, high-performance web platform.

*Note on Component References:* A pre-existing component-level specification (`docs/90_PRODUCT_REFERENCE/SRS_SOFTWARE_REQUIREMENTS_SPECIFICATION.md`) governs the isolated `<TeethChart />` 3D anatomical engine. This document establishes the authoritative **whole-project** requirements across all product lines, operational workflows, and integration boundaries.

### 1.2 System Scope
The 3DDX platform orchestrates digital design and physical manufacturing for dental professionals across ten distinct product lines. The frontend provides:
1. **Clinical Case Management:** Multi-service intake, tooth charting, file upload management (DICOM CBCT, optical STL/PLY).
2. **Operational Workflow Boards:** Real-time departmental tracking across Cairo (digital engineering) and Boston (physical manufacturing).
3. **Clinical Review & Approval:** Treatment plan consultation scheduling, 3D anatomical odontogram visualization, plan approval gates.
4. **Physical Logistics & Quality Control:** Model intake, barcode scanning, printer queue tracking, post-processing wash/cure logs, loaner drill kit management, shipping.
5. **Customer Support Task Engine:** Event-driven action queues for case holds, scan issues, and client communication.
6. **Financial Management:** Multi-currency client price books, immutable voucher ledgers, and automated charging cycles.

---

## 2. Stakeholders and User Roles

The system supports both external commercial clients and internal operational teams across multiple geographic locations:

### 2.1 External Client Roles
| Role | Description & Permissions |
|---|---|
| **Dentist / Surgeon (Doctor)** | Primary clinician. Submits cases, charts clinical sites, uploads scans, attends fine-tuning video calls, approves treatment plans, downloads surgical protocols, views invoices. |
| **Scanning Centre** | Imaging facility taking CBCT scans. Submits cases on behalf of doctors; may upload scans without access to clinical pricing or billing unless designated as the paying account. |
| **Dental Laboratory / Partner** | Commercial laboratory ordering surgical guides or prosthetic restorations. May operate on special B2B price lists with digital-only delivery options. |
| **DSO Administrator** | Multi-clinic Dental Support Organization manager. Oversees cases across multiple doctor accounts, manages pooled voucher credit, and accesses consolidated billing. |

### 2.2 Internal Operational Roles
| Role | Geographic Base | Core Responsibilities |
|---|---|---|
| **Customer Support (CS)** | Global / Remote | Manages client relationships via event-driven tasks; chases scan uploads, stone models, and surgical dates; communicates registration compromise verdicts. |
| **Treatment Planner** | Cairo | Performs 3D DICOM conversion, virtual implant placement in CoDiagnostiX, plan replication, and sleeve design configuration. |
| **Fine-Tuner (FTer)** | Cairo / Remote | Clinician conducting live video consultations with doctors to adjust implant positions, angulations, and prosthetic margins. |
| **Operations Technician** | Cairo | Performs optical scan STL registration onto CBCT coordinates; evaluates registration verdicts (Options 1–4); executes surgical guide CAD body modeling. |
| **Planning QC Specialist** | Cairo | Inspects sleeve positioning, safety zones, and instruction sheets prior to client approval. |
| **Boston Lab Technician** | Boston, USA | Receives physical packages, pours stone impressions, performs laser scanning, operates 3D printers (Formlabs/Carbon), conducts wash/UV curing, performs fit checks on fitting surfaces (FS). |
| **Boston Logistics / Shipping** | Boston, USA | Packages printed guides, assigns loaner drill kits, generates paired outbound/return shipping labels, manages QR-coded shelf bin archives. |
| **Sales Representative** | Global | Tracks client onboarding, door activations, voucher sales, and commissionable close records. |
| **Finance Officer** | Global | Oversees daily charging batches, payment gateway card captures, voucher ledger balances, and monthly invoicing. |

---

## 3. Functional Requirements

### 3.1 Domain Hierarchy & Entity Structure
- **FR-01 (Domain Structure):** The system SHALL enforce the structural hierarchy:  
  `Account (Client) -> Case (Patient & Clinical Intent) -> Order (Submission Container) -> Service Lines (Billable Units)`.
- **FR-02 (Patient Anonymization):** The frontend SHALL display pseudonymous `patient_code` identifiers in standard workflow tables and reports. Patient names and dates of birth SHALL be isolated and fetched only through explicit, purpose-logged identity requests.
- **FR-03 (Service Line Independence):** Every billable item within an order SHALL maintain an independent lifecycle with its own service type, unique instance ID, assigned technician, progress status, history log, target delivery date, and charge status.
- **FR-04 (Multiplicity of Same-Type Services):** The system SHALL support multiple service instances of the exact same type (e.g. two surgical guides, or dual arches) under one order without ID collision, shared status, or cross-instance data contamination.

### 3.2 Clinical Case Intake & Tooth Charting
- **FR-05 (Clinical Intake):** The case creation interface SHALL capture clinical intent, arch selection (Maxilla, Mandible, Both), patient code, reference tags, and service selection.
- **FR-06 (Interactive Odontogram Integration):** The interface SHALL provide interactive 2D and 3D tooth charting via the `<TeethChart />` component, allowing clinicians to mark:
  - Missing teeth.
  - Teeth planned for extraction.
  - Planned implant sites (1 to 16 sites driving guide pricing).
  - Abutment, crown, and restoration sites.
- **FR-07 (Document Upload Engine):** The intake workflow SHALL enforce upload rules according to product configuration (`catalog.item_upload_requirements`):
  - DICOM archives (ZIP/TAR) with SHA-256 integrity verification.
  - Optical surface scans (STL, PLY, OBJ).
  - Clinical photographs and bite registrations.

### 3.3 Registration & Clinical Verdict Engine
- **FR-08 (Support Type Dependency):** The workflow engine SHALL mandate registration based on surgical guide support:
  - *Tooth-Supported:* Optical STL registration is mandatory.
  - *Tissue-Supported:* Dual-scan registration is mandatory.
  - *Bone-Supported:* Registration is bypassed unless a Pre-Positioning Guide (PPG) is flagged.
- **FR-09 (Registration Options 1–4 Handling):**
  - **Option 1 (Clean):** The UI SHALL transition the case automatically to Planning upon file upload.
  - **Option 2 (Clean with Note):** The UI SHALL advance the case to Planning while raising an informational dispatch to Customer Support.
  - **Option 3 (Compromise / Clinical Hold):** The UI SHALL hold the case, require the technician to select standardized findings, present available compromise options, generate an email with clickable links, and create a high-priority CS task.
  - **Option 4 (Unusable / Hard Block):** The UI SHALL immediately halt the workflow, forbid file upload downstream, and notify Customer Support to request fresh scans.

### 3.4 Planning, Consultation & Manufacturing Approval Gate
- **FR-10 (Planning Session Scheduling):** The system SHALL restrict fine-tuning appointment scheduling to cases where treatment planning is complete and marked ready. Standard durations: 45 minutes for quadrant, 60 minutes for full arch.
- **FR-11 (Mandatory Manufacturing Approval Gate):** Under NO circumstances SHALL a surgical guide advance to 3D printing or physical manufacturing without verified doctor approval. The UI SHALL validate approval provenance:
  - Doctor confirmation via secure portal button.
  - Cryptographically tracked confirmation email link.
  - Recorded verbal approval logged during a fine-tuning video session.

### 3.5 Physical Manufacturing, QC & Logistics (Boston)
- **FR-12 (Physical Intake & Bin Archiving):** Boston intake screens SHALL barcode-scan incoming physical courier envelopes, record contents (stone models, impressions), generate Pouring fee line items if applicable, and assign a physical numbered shelf bin location.
- **FR-13 (Batch Production Records):** Regulated manufacturing screens SHALL log mandatory production telemetry:
  - Assigned 3D printer hardware ID and calibrated resin vat lot number.
  - IPA bath temperature, duration, and wash stage.
  - UV curing oven cycle time and temperature.
  - Sleeve component article numbers seated in each osteotomy site.
  - Fitting surface (FS) physical seating verification score.
- **FR-14 (Loaner Drill Kit Tracking):** When a loaner kit is ordered, the system SHALL simultaneously generate paired outbound and return shipping labels, bind the hardware kit serial number, and automatically trigger a return retrieval task for the day following scheduled surgery.

### 3.6 Financial Ledger, Vouchers & Charging
- **FR-15 (Client-Specific Pricing):** The billing module SHALL calculate prices dynamically based on client account ID, service option, currency (USD, EUR, GBP), and delivery mode (Digital STL delivery vs. Boston Manufacturing).
- **FR-16 (Append-Only Voucher Ledger):** Voucher credit SHALL be represented as an immutable transaction ledger (`vouchers.voucher_transactions`). Balances SHALL be computed from ledger records. Credit drawdown order SHALL strictly follow:
  1. General credit before product-restricted credit.
  2. Oldest issued credit first.
  3. Pre-purchased cases before additional bonus credit before original monetary credit.
- **FR-17 (Charging Cycle Invariants):** A service item SHALL enter the charging queue only when it possesses a completion timestamp and lacks an existing charge timestamp. Post-charge modifications SHALL require an explicit extra charge or refund transaction with human reason logging.

### 3.7 Customer Support Task Engine
- **FR-18 (Event-Driven CS Tasks):** The Customer Support interface SHALL present an actionable task list grouped by client account, dynamically populated by system events:
  - *Scan failure / missing upload:* Due same day.
  - *Treatment plan ready:* Schedule fine-tuning due same day.
  - *Confirmation sent (model needed):* Chase confirmation and model within 2 days (or immediately if surgery is <= 5 days).
  - *Registration Option 3/4:* Chase doctor decision within 1 day of email dispatch.
  - *Due date constraint:* Task due dates SHALL move only forward, requiring an audit reason.

---

## 4. Product-Specific Status Specifications

The frontend SHALL decode status codes strictly within the context of the active service line:

| Product Line | Raw Code | Canonical State Name | Operational Meaning |
|---|---|---|---|
| **Model Registration** | `1` | Awaiting Models | Waiting for courier package arrival in Boston |
| | `2` | On its way to 3DDX | Courier in transit |
| | `3` | In Progress | Model pouring / laser scanning in Boston |
| | `4` | Done | Optical model STL uploaded and available |
| | `90` | No Scans | Intra-oral digital scans missing |
| | `91` | In Progress | Intra-oral scan verification |
| | `92` | Done | Intra-oral files verified |
| **3D Conversion** | `6` | No Scans | Raw DICOM missing or corrupt |
| | `7` | In Progress | Conversion & nerve canal mapping underway |
| | `8` | Download | Conversion package completed |
| **Treatment Plan** | `10` | Waiting Conversion | Blocked waiting for 3D conversion completion |
| | `11` | No Scans | Scan issues identified during planning |
| | `12` | In Progress | CoDiagnostiX planning underway |
| | `13` | Download | Treatment plan ready for review |
| **Radiology Report** | `21` | No Scans | CBCT missing or unacceptable FOV |
| | `22` | In Progress | Radiologist evaluating pathology/sites |
| | `23` | Download | Signed diagnostic report available |
| **Surgical Guide** | `36` | Reviewing Order | Initial case intake validation |
| | `37` | Waiting Confirmation | Plan sent to doctor; awaiting approval |
| | `38` | Sleeve Design | Planner placing metal guide sleeves |
| | `47` | TP-QC | Quality control check on sleeve positions |
| | `39` | Guide Design | CAD technician modeling guide body |
| | `46` | Awaiting Modifications | Design returned for clinical adjustment |
| | `42` | Guide Printing | 3D printer running in Boston |
| | `40` | Shipped | Guide inspected, packaged, and couriered |
| | `41` | On Hold | Blocked pending client or technical resolution |
| **Appliance / Model** | `38` | In Design | Custom appliance modeling |
| | `39` | In Production | Manufacturing appliance in Boston (*Collides with SG 39*) |
| | `40` | Shipped | Appliance dispatched |
| **Restorations / GFMR** | `130` | Pending Approval | Restorative design awaiting doctor sign-off |
| | `131` | GFMR Rejected | Client requested complete remake |
| | `133` | Wax-Up In Progress | Digital diagnostic wax-up modeling |
| | `138` | Printing | Crown / bridge / hybrid milling or printing |

---

## 5. Non-Functional Requirements

### 5.1 Performance & Responsiveness
- **NFR-01 (Page Load Time):** First Contentful Paint (FCP) SHALL occur within 1.5 seconds on standard broadband connections (>= 25 Mbps).
- **NFR-02 (3D Graphics Rendering):** The `<TeethChart />` WebGL canvas SHALL sustain a minimum of 55 FPS during interactive orbit, zoom, and multi-tooth selection on standard integrated GPU hardware.
- **NFR-03 (Bundle Size Management):** Production JavaScript chunks SHALL NOT exceed 350 kB (gzip) for initial entry routes through route code-splitting and dynamic imports.

### 5.2 Security, Privacy & Compliance
- **NFR-04 (Zero Secrets in Frontend):** No API keys, client secrets, database credentials, or private certificates SHALL exist in the repository source code, environment templates, or client bundles.
- **NFR-05 (PHI / HIPAA Safeguards):** Protected Health Information (PHI) SHALL never be logged to browser consoles, crash telemetry (Sentry), web analytics (PostHog), or unencrypted storage.
- **NFR-06 (Tenant Isolation):** All API operations SHALL be scoped to the authenticated user's active tenant resolved server-side. The frontend SHALL NOT determine, select, or transmit client-controlled tenant headers (`X-Tenant-Id` is rejected/ignored). Cross-tenant data rendering is strictly prohibited.
- **NFR-07 (Orders Dashboard Scope):** Orders Dashboard work SHALL remain UI/UX and labeled synthetic/mock data based for current scope. The proposed Orders Dashboard API extension (`02_ORDERS_DASHBOARD_PROPOSED_EXTENSION.yaml`) is proposed only and SHALL NOT be integrated until formally assigned.

### 5.3 Accessibility (a11y) & Usability
- **NFR-07 (Accessibility Standards):** All interactive data tables, modal dialogs, and form elements SHALL conform to WCAG 2.1 Level AA requirements:
  - Minimum color contrast ratio of 4.5:1 for standard text.
  - Complete keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`) with visible focus indicators.
  - `aria-expanded`, `aria-label`, and screen reader announcements for asynchronous state changes.
- **NFR-08 (Bilingual Localization):** The application SHALL support real-time switching between English (LTR layout) and Arabic (RTL layout) without page reloads.

---

## 6. Interface & Integration Requirements

- **INT-01 (OpenAPI 3.0.3 Contract):** All API communication SHALL strictly conform to the approved canonical specification (`docs/newcp-ai/references/api/newcp.openapi.yaml`). Frontend code SHALL NOT invent undocumented endpoints or payload attributes.
- **INT-02 (Authentication):** User authentication SHALL utilize Google OAuth 2.0 / OpenID Connect with PKCE, exchanging authorization codes for short-lived JWT access tokens and secure HTTP-only refresh cookies.
- **INT-03 (Authorization):** Route and action authorization SHALL be enforced using Casbin RBAC/ABAC role claims issued by the backend server.
- **INT-04 (File Storage Transport):** Large binary uploads (DICOM ZIPs up to 2 GB, STL meshes up to 250 MB) SHALL execute via pre-signed direct-to-cloud upload URLs (S3/GCS) with client-side SHA-256 chunked calculation.

---

## 7. Acceptance Criteria & Quality Gates

To achieve production acceptance, the frontend must satisfy the following verifiable gates:
1. **Clean Type-Check:** `npx tsc -b` exits with status `0` and zero diagnostics.
2. **Deterministic Linting:** `npm run lint` passes without errors on all modified files.
3. **Automated Test Coverage:** Unit and component tests verify all critical business state machines (registration verdicts, approval gates, status transitions).
4. **Reproducible Production Build:** `npm run build` generates verified static assets in `dist/` with valid asset hashes and HTML entry points.
5. **Authentic Evidence:** Every deliverable must provide verifiable evidence logs free of simulated success claims or redacted real patient data.

---

## 8. Exclusions & Out-of-Scope Items

The following are strictly out of scope for the frontend application and individual contributor Abdo:
- **No Direct Database Connections:** The frontend SHALL NEVER connect directly to PostgreSQL or execute SQL queries.
- **No Migration / ETL Scripts:** Database migration from legacy MySQL to PostgreSQL V3 is managed exclusively by backend data engineering.
- **No MUI Implementation:** As governed by the individual project boundary, Abdo's UI scope is strictly React UI Option A (Tailwind CSS / modern CSS). Material UI (MUI) spikes or implementations are excluded.
- **Allocation Constraint:** Full Stack work is bounded to 5 hours as written.

---

## 9. Requirements Traceability Matrix Summary

| Requirement ID | Canonical Domain Source Section | Repository Implementation Area | Verification Method |
|---|---|---|---|
| **FR-01, FR-02** | Guide §4 (Shape of a Case), §13.9 (Privacy) | `src/types/index.ts`, `src/pages/Cases.tsx` | Code Audit / Schema Check |
| **FR-03, FR-04** | Guide §1, §4, §13.2 (Item Hierarchy) | `src/pages/Orders.tsx`, `SubOrderDetail.tsx` | Component Multiplicity Test |
| **FR-06** | Guide §5 (Teeth Charting) | `src/components/ui/TeethChart.tsx` | WebGL Interactive Inspection |
| **FR-08, FR-09** | Guide §5, §11 (Registration Options 1-4) | `src/pages/OrderWorkflow.tsx`, `WorkflowBoard.tsx` | State Machine Unit Test |
| **FR-11** | Guide §5, §11 (Confirmation Invariant) | `src/pages/OrderDetailsPage.tsx` | Approval Gate Verification |
| **FR-12, FR-13** | Guide §5, §9 (Boston Operations & Batch) | `src/pages/Task47ModelWorkReport.tsx` | Intake & Batch Record Audit |
| **FR-15, FR-16** | Guide §8, §13.3 (Voucher Ledger & Money) | `src/pages/Billing.tsx` | Ledger Drawdown Arithmetic Test |
| **FR-18** | Guide §10 (CS Task Engine) | `src/pages/ChangeRequests.tsx`, `Dashboard.tsx` | Event Due Date Test |

---

*Authored under Task T-000 governance. Approved project-level specification for `newcp-ui-option-a`.*