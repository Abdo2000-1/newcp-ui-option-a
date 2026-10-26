<div align="center">

# 🏥 3DDX CP PRO MAX Clinical Web Portal

### **Enterprise-Grade Dental CAD/CAM, Clinical Case Management & 3D PACS Platform**

[![Live Demo](https://img.shields.io/badge/Demo-Live_Preview-success?style=for-the-badge&logo=githubpages&logoColor=white)](https://abdo2000-1.github.io/newcp-ui-option-a/)
[![Release](https://img.shields.io/badge/Release-v4.2.0-blue.svg?style=for-the-badge&logo=semver&logoColor=white)](https://github.com/Abdo2000-1/newcp-ui-option-a/releases)
[![CI Pipeline](https://img.shields.io/badge/GitHub_Actions-CI_Passing-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/Abdo2000-1/newcp-ui-option-a/actions)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MUI](https://img.shields.io/badge/MUI-v7.3.7-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.3.1-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Vitest](https://img.shields.io/badge/Vitest-44%20Tests%20Passing-729B1B?style=for-the-badge&logo=vitest&logoColor=white)](src/test/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_2.0-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Docker Container](https://img.shields.io/badge/GHCR-Docker_Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/Abdo2000-1/newcp-ui-option-a/pkgs/container/newcp-ui-option-a)

---

### **Engineering Leadership & Academic Oversight**

| Role | Name | Title & Responsibility | Contact / Profile |
| :--- | :--- | :--- | :--- |
| **Front End Engineer** | **Abdo Al Adawy** | Architecture, UI/UX Implementation & Standards Alignment | [@Abdo2000-1](https://github.com/Abdo2000-1) |
| **Technical Lead** | **Eng. Aya Adel** | Project Supervision, Architecture Review & Clinical Compliance | Clinical Systems Lead |

---

</div>

## 🌐 Live Demo & Deployment

The application is deployed continuously via GitHub Pages and containerized for multi-environment production execution:

* 🚀 **Interactive Web Application**: [https://abdo2000-1.github.io/newcp-ui-option-a/](https://abdo2000-1.github.io/newcp-ui-option-a/)
* 🐳 **GitHub Container Registry (GHCR)**:
  ```bash
  docker pull ghcr.io/abdo2000-1/newcp-ui-option-a:v4.2.0
  docker run -p 8080:80 ghcr.io/abdo2000-1/newcp-ui-option-a:v4.2.0
  ```

---

## 📖 Executive Summary & Platform Overview

**3DDX CP PRO MAX** is a high-performance, multi-tenant Dental SaaS web application designed for dental clinics, scanning centers, and dental laboratories. The platform centralizes patient intake, order management, multi-stage clinical workflows, lab change requests, PowerBI business analytics, staff performance targets, and digital dental case records.

Integrated directly within the platform is the **3DDX Clinical Teeth Chart Engine**, enabling dental professionals to record and manipulate 2D odontogram findings and inspect full 3D biomechanical dental arches with titanium implants in real-time WebGL.

---

## 🌟 Key Functional Modules

```
                                  ┌─────────────────────────────┐
                                  │      CP PRO MAX PLATFORM     │
                                  └──────────────┬──────────────┘
         ┌────────────────────────┬──────────────┼────────────────────────┬────────────────────────┐
         ▼                        ▼              ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Clinical Cases   │    │ Orders & Lab     │   │ 3D Odontogram    │   │ Business &       │   │ Clinics & Scan   │
│ & Patient Intake │    │ Workflows        │   │ Biomechanical    │   │ Analytics        │   │ Centers Hub      │
└────────┬─────────┘    └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                       │                      │                      │                      │
  • Patient Profiles      • Multi-stage Kanban   • 2D Clinical Cross    • PowerBI Embedded     • Multi-tenant Auth
  • Medical History       • Sub-orders Tracking  • 3D Arch WebGL        • Quarterly Targets    • Doctor Access ACL
  • Diagnostic Files      • Change Requests      • Implant CAD View     • Financial Billing    • Scan Center Portal
```

### 1. 🦷 Integrated 3DDX Clinical Teeth Chart Engine
* **Dual Layout Modes**: Instantly toggle between a clinical 2D cross-grid odontogram (ISO 3950 / FDI & Universal ADA) and an interactive 3D parabolic anatomical dental arch.
* **Photorealistic 3D Dental Arch**: WebGL 2.0 rendering with physically-based enamel/cementum shaders, anatomically accurate roots (single, bifid, trifid), and Grade-5 surgical titanium implants.
* **Clinical Procedures**: Real-time assignment of 10+ standard dental treatments including Restorations, Crowns, Implants, Endodontics, Veneers, Bridges, and Extractions.

### 2. 📋 Clinical Case & Order Management
* **End-to-End Case Tracking**: Lifecycle states from `Draft`, `Received`, `In Design`, `In Production`, `Quality Assurance`, to `Delivered`.
* **Sub-Order Decomposition**: Fine-grained tracking of multi-unit prosthetics, surgical guides, and aligners within parent clinical cases.
* **Interactive Workflow Board**: Drag-and-drop Kanban workflow boards for dental lab technicians and clinic coordinators.

### 3. 📊 Analytics, Targets & Financial Billing
* **PowerBI Client Integration**: Native PowerBI embedded dashboards for deep operational metrics, lab turnaround times, and case throughput.
* **Staff Performance Targets**: Real-time tracking of dental technician quotas, model work reports (Task 47), and department quarter targets (Task 31).
* **Invoicing & Billing**: Transparent line-item ledger detailing prosthetic fabrication costs, scan center commissions, and clinic balances.

### 4. 🏥 Practice Management & Partner Ecosystem
* **Clinics & Doctors Directory**: Granular access control, contact books, specialty classifications, and practice branch management.
* **Scan Center Hub**: Dedicated management interface for CBCT, intraoral scanner uploads, and DICOM/STL file workflows.
* **Bilingual Arabic & English**: Full native RTL / LTR layout switching with immediate dark/light clinical theme adaptivity.

---

## 🏗️ Technical Architecture & Stack

```
Frontend Architecture (Feature-Sliced Design / Clean Architecture):
├── React 19 (Component UI Architecture & Fiber Concurrency)
├── Material-UI (MUI v7 Enterprise Component Library & Design Tokens)
├── TypeScript 6.0 (Strict Typing, Clinical Domain Interfaces)
├── Vite 8.3 (High-Speed ESM Bundler & HMR Engine)
├── Three.js (WebGL 2.0 Physically Based Rendering Engine)
├── Vitest 5.0 (Deterministic Automated Test Framework with 44/44 passed tests)
├── PowerBI Client (Enterprise Embedded Analytics Integration)
├── Lucide React (Standardized Healthcare & UI Iconography)
└── Framer Motion (Smooth Workflow & Modal Transitions)
```

### Clean Architecture & Module Separation

* **`src/app/`**: Application bootstrap, core providers (MUI theme, React Query, Error Boundary, Language), routing definitions, and shell layout.
* **`src/features/`**: Domain-driven feature modules (`auth`, `orders`, `models`, `reporting`, `settings`), isolating business logic and dedicated views.
* **`src/shared/`**: Reusable shared UI design system components (`Button`, `EmptyState`, `ErrorState`, `Pagination`, `SearchInput`, `UIStateSwitcher`, `Avatar`, `StatusBadge`), API clients, custom hooks, and clinical utility functions.
* **`src/theme/`**: Central MUI theme engine supporting light/dark clinical modes, palette tokens, component overrides, and typography.

---

## 🚀 Quick Start & Local Development

### Prerequisites
* **Node.js**: `v20.x` or higher (tested on Node 22)
* **npm**: `v10.x` or higher

### Installation

```bash
# Clone the repository
git clone https://github.com/Abdo2000-1/newcp-ui-option-a.git
cd newcp-ui-option-a

# Install dependencies deterministically
npm ci

# Start the Vite local development server
npm run dev
```

### Running Quality Gates & Tests

```bash
# Execute Vitest automated unit and component tests
npm run test

# TypeScript strict type check
npx tsc -b

# Fast static code linting
npm run lint

# Production bundle build
npm run build
```

---

## 📁 Repository Structure

```
newcp-ui-option-a/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Automated CI validation pipeline (lint, type-check, test, build, docker)
│       ├── deploy-pages.yml          # GitHub Pages continuous deployment
│       └── package.yml               # GHCR container package publisher
├── docs/
│   ├── 00_READ_FIRST.md              # Reading guide and project navigation
│   ├── 00_SOURCE_INVENTORY.md        # Source precedence and authority record
│   ├── 01_PROJECT/                   # Architecture, standards, and Tailwind exception report
│   ├── 02_REQUIREMENTS/              # Requirements inventory and traceability matrix
│   ├── 03_WORKFLOW/                  # Task lifecycle, DoD, and Abdo ownership boundary
│   ├── 04_INTEGRATION/               # OpenAPI and backend integration status
│   └── 05_QUALITY/                   # Testing strategy, verification gates, and evidence
├── public/
│   ├── 404.html                      # GitHub Pages SPA deep-linking fallback
│   └── ...
├── src/
│   ├── app/                          # App bootstrap, providers, routing, shell
│   ├── features/                     # Domain modules (auth, orders, models, reporting, settings)
│   ├── shared/                       # Reusable UI components, hooks, api, utils
│   ├── theme/                        # Central MUI theme configuration
│   ├── test/                         # Test setup and test fixtures
│   └── main.tsx                      # Vite React 19 entrypoint
├── Dockerfile                        # Multi-stage production container image
├── package.json                      # Dependency manifests & scripts
├── tsconfig.json                     # Strict TypeScript configuration
└── vite.config.ts                    # Vite configuration with base-path and Vitest
```

---

## 🔒 Security, Compliance & Code Quality Gates

* **Zero Type Regressions**: Full TypeScript strict compilation with zero errors.
* **MUI Enterprise Design System**: Standardized clinical UI components adhering to accessibility and WCAG standards.
* **Deterministic CI**: Every push and PR is automatically validated with `npm ci`, strict linting, type-checking, test execution, production compilation, and Docker container build.

---

## 👥 Credits & Contacts

* **Technical Supervisor**: **Eng. Aya Adel** — Clinical Systems Lead
* **Front End Engineer**: **Abdo Al Adawy** — [@Abdo2000-1](https://github.com/Abdo2000-1)
* **Project**: **3DDX CP PRO MAX** (Clinical Dental SaaS Platform)
* **License**: Private & Proprietary — All Rights Reserved.

---

## 🧭 Governance & Repository Organization

- [`AGENTS.md`](AGENTS.md) — Antigravity workspace instructions and approval gates.
- [`CLAUDE.md`](CLAUDE.md) — Claude Code compatibility instructions retained for the original workflow.
- [`docs/00_READ_FIRST.md`](docs/00_READ_FIRST.md) — Numbered navigation and reading order.
- [`docs/00_SOURCE_INVENTORY.md`](docs/00_SOURCE_INVENTORY.md) — Source precedence and availability record.
- [`docs/06_OPERATIONS/observability/README.md`](docs/06_OPERATIONS/observability/README.md) — PostHog/Sentry preparation, privacy boundaries, and verification gates.
- [`docs/01_PROJECT/tailwind-exception-report.md`](docs/01_PROJECT/tailwind-exception-report.md) — Justified technical exceptions for Three.js & DICOM Canvas.
- [`docs/03_WORKFLOW/ownership/abdo.md`](docs/03_WORKFLOW/ownership/abdo.md) — Abdo's Full Stack allocation and React Option A boundary.
