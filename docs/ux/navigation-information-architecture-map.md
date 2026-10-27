# Navigation Information Architecture Map (NAV-001)

## Overview & Principles
This document establishes the official Information Architecture (IA) for the New CP React Option A navigation system, eliminating duplicate CTA buttons, structuring destinations into logical domains, and providing a scalable overflow model.

---

## 1. Global Navigation Hierarchy

### Tier 1: System & Enterprise Header (`Header.tsx`)
- **Brand Identity**: 3DDX Logo / "New CP" linking to `/home`.
- **Search Command**: Global search bar / Modal (`Ctrl + K`).
- **Single Authoritative CTA**: `+ New Case` button (`/add-case`) with prominent high-contrast clinical teal styling.
- **System Controls**:
  - Global language switcher (EN, FR, DE, IT, ES).
  - Theme toggle (Light / Dark).
  - Dock position toggle (Top, Left, Right, Bottom).
  - Operator Profile avatar & access menu (`/profile`).

### Tier 2: Domain Workspaces Bar (`ConvertibleNav.tsx`)
*Duplicate `+ Add Case` button removed completely to eliminate visual competition with Header.*

The Tier 2 destinations are grouped into 4 logical, clean domains:

#### Domain 1: Orders & Production (`/flow`)
- **Master Orders Flow** (`/flow` / `/orders`) — Live incoming & active case queue.
- **Order Details** (`/order-details?id=504901`) — Active prescription & sub-order matrix.
- **Workflow Board** (`/workflow-board`) — Visual status transition lanes.
- **Cases Archive** (`/cases`) — Historical case lookup.
- **Change Requests** (`/change-requests`) — Clinician modification tickets.

#### Domain 2: Laboratory & Manufacturing (`/task-47`)
- **Task 47: 3D Models** (`/task-47`) — 3D printing & CAD arch fabrication.
- **Scan Center** (`/scan-center`) — CBCT & intraoral scan intake.
- **Documents & Prescriptions** (`/documents`) — Digital work orders.

#### Domain 3: Operations & Workforce (`/task-31`)
- **Task 31: Staff Targets** (`/task-31`) — Technician throughput & capacity.
- **Quarterly Targets** (`/quarter-targets`) — Team SLA & output analytics.
- **Reports Hub** (`/reports`) — Standardized operational summaries.

#### Domain 4: Directories & Administration (Grouped / "More")
- **Clinics Directory** (`/clinics`)
- **Doctors Directory** (`/doctors`)
- **Patients Directory** (`/patients`)
- **Billing & Statements** (`/billing`)
- **Configuration & CMS** (`/config-manager` / `/cms`)
- **System Settings** (`/settings`)

---

## 2. Overflow & Docking Safety Rules
1. **Vertical Sidebar Mode**: When docked Left or Right, Tier 2 converts to a collapsible vertical navigation drawer with icon tooltips and smooth transitions.
2. **Bottom Dock Mode**: When docked at bottom, Tier 2 sits above the bottom viewport edge with a dedicated `108px` clearance spacer to prevent footer occlusion.
3. **Dropdown Z-Index & Clipping**: All dropdown popovers use `zIndex: 1400` with absolute positioning offset away from the viewport edge to guarantee zero clipping.
