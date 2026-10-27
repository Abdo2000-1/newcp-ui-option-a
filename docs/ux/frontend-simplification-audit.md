# Frontend UX Simplification & Architecture Audit (UX-001)

## Executive Summary
This document records the comprehensive baseline UX audit of the New CP React Option A repository. The goal is to identify visual clutter, duplicated controls, confusing navigation, inconsistent spacing, excessive technical typography, redundant action buttons, and dead/broken elements across all application routes.

---

## 1. Visual Clutter & Layout Density

### A. Excessive Nested Cards and Borders
- **Affected Routes**:
  - `/flow` (`src/features/orders/pages/Flow.tsx`)
  - `/order-details` (`src/features/orders/pages/OrderDetailsPage.tsx`)
  - `/quarter-targets` (`src/features/reporting/pages/QuarterTargetsReport.tsx`)
  - `/task-47` (`src/features/models/pages/Task47ModelWorkReport.tsx`)
  - `/task-31` (`src/features/reporting/pages/Task31StaffTargets.tsx`)
- **Finding**: Multiple layers of nested `<div className="rounded-xl border border-slate-200 ...">` create "box-in-a-box" visual fatigue. Background cards nested within outer cards with contrasting borders distract the clinical user from key patient and service data.
- **Recommended Fix**: Flatten cards to a clean, single-surface structure with consistent border color (`divider` token in MUI) and subtle elevation rather than multi-layered borders.

### B. Over-decorative Gradient Glows and Shadows
- **Affected Routes**: Global Layout (`src/app/shell/Layout.tsx`), Header (`src/app/shell/Header.tsx`), Floating Support (`src/app/shell/FloatingSupport.tsx`).
- **Finding**: Heavy backdrop blur, intense drop-shadows (`shadow-2xl`, `shadow-cyan-500/10`), and floating gradient orbs increase cognitive load and visual noise in a clinical diagnostic interface.
- **Recommended Fix**: Replace excessive glowing effects with calm, clinical neutral backgrounds and standard MUI palette tokens.

---

## 2. Navigation & Information Architecture

### A. Duplicated "New Case" Action Button
- **Affected Components**:
  - Header Navbar (`src/app/shell/Header.tsx`, line 170)
  - Secondary Tier-2 Navbar (`src/app/shell/ConvertibleNav.tsx`, lines 310-330)
- **Finding**: The primary CTA "New Case" appears simultaneously in both the top header and the second convertible navbar, causing visual competition and user confusion.
- **Recommended Fix**: Completely remove the redundant "New Case" button from the second navbar (`ConvertibleNav.tsx`), keeping a single prominent creation entry point in the global header/quick actions.

### B. Second Navigation Bar Overflow & Horizontal Clutter
- **Affected Components**: `src/app/shell/ConvertibleNav.tsx`, `src/app/shell/Sidebar.tsx`.
- **Finding**: As new routes and feature modules were added, the second navigation bar expanded to over 15 standalone navigation buttons. On 1080p and laptop screens, this leads to horizontal wrapping, clipped dropdown menus, or awkward scrolling containers.
- **Recommended Fix**: Group secondary destinations into logical domains (e.g., *Orders & Workflows*, *Analytics & Targets*, *System & Settings*) with a dedicated, accessible "More" dropdown and searchable navigation modal.

### C. Absence of Route Hierarchy & Breadcrumbs
- **Affected Routes**: All feature routes (`/flow`, `/order-details`, `/quarter-targets`, `/task-47`, `/add-case`, etc.).
- **Finding**: Users deep within `/order-details` or report views have no accessible breadcrumb trail indicating their hierarchical location in the clinical ERP.
- **Recommended Fix**: Introduce a standardized, accessible MUI `<Breadcrumbs />` component directly below the header showing current route hierarchy with dynamic labels (e.g. `Home > Orders > ORD-2026-504901`).

---

## 3. Duplicated UI Patterns & Component Inconsistencies

### A. Inconsistent Data Table Implementations
- **Affected Routes**:
  - Historical notes vs. Sub-orders matrix in `OrderDetailsPage.tsx`
  - Orders queue in `Flow.tsx`
  - Model work batch queue in `Task47ModelWorkReport.tsx`
- **Finding**: Tables across different features use different pagination styles, inconsistent column header padding (some `p-2`, some `p-4`), and divergent search input designs.
- **Recommended Fix**: Standardize on the approved unified `DataTable` component pattern with uniform spacing, accessible `aria-sort`, and consistent pagination controls.

### B. Redundant and Confusing Labels
- **Affected Routes**:
  - `/flow`: Multiple competing status badges (`HOLD`, `URGENT`, `IN_PRODUCTION`, `ACTIVE`) without a clear legend.
  - `/quarter-targets`: Overlapping performance percentage badges next to target values.
- **Recommended Fix**: Streamline status badges to high-contrast, semantic status indicators (`StatusBadge.tsx`) with clear, unambiguous labels.

---

## 4. Power BI Embed & Deprecated Modules

### A. Power BI Visual Footprint & Overhead
- **Affected Routes**:
  - `/dashboard` (`src/features/reporting/pages/Dashboard.tsx`)
  - `/quarter-targets` (`src/features/reporting/pages/QuarterTargetsReport.tsx`)
  - Dependency in `package.json` (`powerbi-client`, `powerbi-client-react`)
- **Finding**: Power BI embeds are slow to load in mock mode, introduce heavy third-party client bundles (~120KB+), and are no longer approved by stakeholders.
- **Recommended Fix**: Fully remove Power BI client components, embeds, dependencies, and mock iframe handlers. Replace dashboard view with native lightweight charts (`recharts`) and streamlined production queue cards.

---

## 5. Administration & CMS Controls

### A. Absence of Local Frontend Customization Controls
- **Affected Routes**: Currently `/config-manager` provides mock JSON editor without high-level UX controls.
- **Finding**: Senior operators and demo evaluators have no clear, user-friendly CMS panel to toggle local demo feature flags, adjust theme presets, or configure localized notifications without manual code edits.
- **Recommended Fix**: Create a dedicated local CMS control area (`/cms`) tailored for local administrator/senior demo roles, clearly flagged as frontend-only simulation.

---

## 6. Actionable Implementation Plan

| Step | Task ID | Description | Target Branch |
| :--- | :--- | :--- | :--- |
| 1 | `UX-001` | Baseline & UX Audit (This Document) | `docs/ux-001-frontend-simplification-audit` |
| 2 | `UX-002` | Minimal Home Landing Page (`/home`) | `feat/ux-002-home-landing-page` |
| 3 | `UX-003` | Accessible Global MUI Breadcrumbs | `feat/ux-003-global-breadcrumbs` |
| 4 | `NAV-001` | Navigation Information Architecture & Duplicate Removal | `refactor/nav-001-information-architecture` |
| 5 | `NAV-002` | Bottom Navigation Scalability & Overflow Grouping | `refactor/nav-002-bottom-navigation-scalability` |
| 6 | `UX-004` | Minimal UI Cleanup (Borders, Cards, Spacing) | `feat/ux-004-minimal-ui-cleanup` |
| 7 | `CMS-001` | Local Admin/Senior CMS Controls | `feat/cms-001-local-admin-controls` |
| 8 | `OBS-001` | Connect CMS Feature Flags to PostHog Boundary | `feat/obs-001-posthog-feature-flags` |
| 9 | `UX-005` | Local Frontend Notification Center | `feat/ux-005-local-notification-center` |
| 10 | `CHORE-001` | Remove Power BI from Frontend Scope | `chore/remove-powerbi-frontend` |
| 11 | `BUS-UX` | 7 Approved Business Workflows Simplification | `feat/bus-ux-*` |
| 12 | `QA-001` | Global Regression & Accessibility Review | `test/qa-001-global-ux-regression` |
