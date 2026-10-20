# Software Requirements Specification (SRS)
## 3DDX Anatomical Odontogram & 3D Biomechanical Dental Arch System
**Document Identifier:** `SRS-3DDX-TC-2026-v4.2`  
**Standard Compliance:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018  
**Release Version:** `4.2.0-PRO-MAX`  
**Classification:** Medical Diagnostic Software Component / WebGL Clinical Engine  

---

### Document Control & Authorship

| Attribute | Specification |
| :--- | :--- |
| **Lead Software Engineer** | **Abdo Al Adawy** |
| **Project Supervisor** | **Eng. Aya Adel** |
| **Organization** | 3D Diagnostix Cloud ERP & Co-Diagnostix Clinical Suite |
| **Release Status** | Production Ready / Approved for Main Branch Merging |
| **Clinical Classification** | Reusable Odontogram & 3D Biomechanical CAD Viewer Component |
| **Target Runtime** | Modern Web Browsers (Chrome, Edge, Firefox, Safari) • WebGL 2.0 |

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) establishes the complete functional, clinical, performance, and interface requirements for the **3DDX Anatomical Odontogram & 3D Biomechanical Dental Arch Component**. The system provides an interactive, medical-grade tooth charting environment combining a classical 2D 4-quadrant cross odontogram with an interactive, photorealistic 3D WebGL parabolic dental arch.

### 1.2 Document Conventions
- **MUST / SHALL**: Mandatory requirement for compliance.
- **SHOULD**: High-priority feature recommended for production excellence.
- **MAY**: Optional customization hook.

### 1.3 Intended Audience
- **Oral & Maxillofacial Surgeons (OMFS)**: Pre-surgical treatment planning, implant site validation.
- **Prosthodontists & Restorative Dentists**: Tooth restoration assignment, crown/bridge mapping.
- **Dental Technicians & CAD/CAM Designers**: Alignment verification, virtual wax-up inspection.
- **Software Engineers & Code Reviewers**: Architecture verification, test protocol validation.

---

## 2. Overall System Description

### 2.1 Product Perspective
The component operates as a self-contained, enterprise-grade reusable React component (`<TeethChart />`) integrated into the 3DDX Cloud ERP platform. It supports bidirectional synchronization between clinical case records, 2D odontogram grids, and 3D WebGL arch simulations.

```
+-------------------------------------------------------------------------+
|                          3DDX Cloud ERP Engine                          |
+-------------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
+-----------------------+                       +-----------------------+
|  2D Cross Odontogram  | <--- Two-Way Sync --> | 3D Biomechanical Arch |
| (Universal / FDI Grid)|      State Stream     | (Three.js WebGL Scene)|
+-----------------------+                       +-----------------------+
            |                                               |
            +-----------------------+-----------------------+
                                    |
                    +-------------------------------+
                    | Clinical Restorations Palette |
                    | (Crown, Bridge, Implant, etc.)|
                    +-------------------------------+
```

### 2.2 User Classes and Characteristics
1. **Clinical Diagnostician**: Requires rapid 2D tooth selection with instant visual feedback on missing units, crown preparations, and smile design zones.
2. **Implant Specialist**: Requires true 3D spatial inspection of root morphology, tooth angulation, and titanium implant fixtures (#25 reference style).
3. **Global Practice User**: Requires seamless bilingual localization (English LTR and Arabic RTL) with responsive day/night adaptation.

---

## 3. Specific Clinical & Functional Requirements

### 3.1 Anatomical Odontogram (2D Cross View)
- **FR-01 (4-Quadrant Layout)**: The component SHALL render the classical 4-quadrant cross odontogram matching verified dental reference sketches:
  - Upper Right (UR - Maxillary Right, Universal #1 to #8).
  - Upper Left (UL - Maxillary Left, Universal #9 to #16).
  - Lower Right (LR - Mandibular Right, Universal #32 to #25).
  - Lower Left (LL - Mandibular Left, Universal #24 to #17).
- **FR-02 (Clinical Silhouettes)**: Every tooth in the 2D grid SHALL display an anatomically accurate silhouette featuring biological root tapering, multi-cusped crowns, and cementoenamel junction (CEJ) constrictions.
- **FR-03 (Numbering Alignment)**: Upper teeth numbers SHALL be rendered directly beneath the tooth crowns touching the horizontal midline; lower teeth numbers SHALL be rendered directly above the tooth crowns touching the horizontal midline.

### 3.2 3D Biomechanical Parabolic Arches
- **FR-04 (Photorealistic 32-Tooth Dentition)**: The 3D scene SHALL generate the complete 32 permanent human teeth arranged in biological parabolic arches (Hawley arch curve) with natural interproximal contact points.
- **FR-05 (Anatomical Tooth Morphs)**:
  - **Incisors (#7, #8, #9, #10, #23, #24, #25, #26)**: Broad spatulate crowns, chisel incisal edges, single slender tapering roots.
  - **Canines (#6, #11, #22, #27)**: Diamond-shaped crowns with prominent central labial ridges, cusp tips, and massive single roots.
  - **Premolars (#4, #5, #12, #13, #20, #21, #28, #29)**: Bicuspid crowns with distinct buccal and lingual cusps separated by developmental grooves.
  - **Molars (#1, #2, #3, #14, #15, #16, #17, #18, #19, #30, #31, #32)**: Bulbous multi-cusp occlusal tables; upper molars with 3 divergent roots (2 buccal + 1 palatal); lower molars with 2 divergent roots and an open anatomical furcation arch (wishbone structure).
- **FR-06 (Realistic Shading & Textures)**:
  - Crowns SHALL be rendered with natural Vita Enamel A2 ivory PBR textures (`#ede6d8` to `#f4eee4`), complete with vertical perikymata striations and translucent incisal halos.
  - Roots SHALL be rendered with biological warm amber-tan cementum textures (`#c78b5e` to `#b67a4e`) with longitudinal developmental depressions.
  - Stark, washed-out paper-white rendering is strictly prohibited.
- **FR-07 (Facial Number Badges)**:
  - Each tooth in the 3D arch SHALL bear a circular teal/green badge (`#00b894`) with a white border and bold white numbering placed directly on the facial/labial surface of the crown.
  - The badge SHALL remain legible from any viewing angle and SHALL support real-time switching between Universal (1–32) and FDI (11–48) notation.
- **FR-08 (Surgical Titanium Implant Fixture)**:
  - When a tooth is assigned the `implant` restoration, the biological root SHALL be dynamically replaced by a photorealistic Grade-5 surgical titanium fixture matching reference Image 2.
  - The fixture SHALL include a polished collar platform, tapered core body, 8 precision helical surgical V-threads, and an apical bullet tip.
  - The green number badge SHALL automatically relocate to the facial center of the titanium implant body.

### 3.3 Navigation & Interaction
- **FR-09 (Smooth 360° OrbitControls)**: The user SHALL be able to orbit, pan, pitch, yaw, and zoom smoothly across 360 degrees using mouse drag and wheel controls with inertial damping (`dampingFactor: 0.06`).
- **FR-10 (Camera Presets)**: The toolbar SHALL provide one-click camera angle presets:
  - `Front (Photo)`: Direct facial view matching clinical reference photography.
  - `3D Orbit`: Angled isometric perspective showing depth and arch curves.
  - `Top (Occlusal)`: Inspection of the lower mandibular occlusal table.
  - `Bottom (Palatal)`: Inspection of the upper maxillary palatal vault.
- **FR-11 (Accidental Drag Click Prevention)**: The system SHALL track mouse displacement during pointer interactions. Any mouse movement exceeding 6 pixels SHALL be classified as an orbit drag and SHALL NOT trigger tooth selection.
- **FR-12 (Transparent WebGL Canvas)**: The 3D canvas SHALL have 100% alpha transparency (`setClearColor(0x000000, 0)`), with zero background artifacts, discs, or gradient planes.

### 3.4 Clinical Restorations Palette
- **FR-13 (Restoration Modalities)**: The component SHALL support 6 standardized clinical restoration types:
  - **Crown** (Color: Cyan `#00d8fe`)
  - **Bridge Unit** (Color: Indigo `#6366f1`)
  - **Veneer** (Color: Purple `#a855f7`)
  - **Implant** (Color: Amber `#f59e0b` / Titanium Fixture)
  - **Inlay / Onlay** (Color: Emerald `#10b981`)
  - **Extraction / Missing** (Color: Rose `#f43f5e` / Semi-Transparent Ghost)
- **FR-14 (Quick Batch Presets)**: The system SHALL support rapid batch selections: `+ Upper (1-16)`, `+ Lower (17-32)`, `Smile Zone (Canine-to-Canine)`, `+ Posteriors`, and `Clear All`.

### 3.5 Global Localization & Responsive Theme
- **FR-15 (Bilingual Architecture)**: Full English (LTR) and Arabic (RTL) support with instant reactive switching.
- **FR-16 (Day/Night Mode)**: Dark mode (`#070b14` / `#0b101d`) and light mode (`#ffffff` / `#f8fafc`) with contrast-validated tokens.

---

## 4. Non-Functional Requirements (NFR)

### 4.1 Performance & Frame Budget
- **NFR-01 (Frame Rate)**: The 3D WebGL renderer SHALL sustain 60 frames per second (FPS) during camera manipulation on standard integrated GPUs (Intel Iris Xe / Apple M-series / AMD Radeon).
- **NFR-02 (Input Latency)**: Raycasting intersection detection and hover tooltip display SHALL execute within 16 milliseconds (< 1 frame duration).
- **NFR-03 (Bundle Footprint)**: The compiled component chunk SHALL NOT exceed 620 KB gzipped, leveraging tree-shaking for Three.js modules.

### 4.2 Reliability & Resource Management
- **NFR-04 (Memory Leaks & Disposal)**: The component SHALL register explicit disposal routines for WebGL renderers, textures, geometries, and materials upon unmount or mode switching to guarantee zero GPU memory leaks.
- **NFR-05 (Glitch & Crash Immunity)**: The component SHALL handle window resize events via `ResizeObserver` without aspect-ratio distortion or WebGL context loss.

### 4.3 Code Quality & Architecture
- **NFR-06 (Strict Type Safety)**: 100% TypeScript compilation in strict mode (`noImplicitAny`, `strictNullChecks`).
- **NFR-07 (SOLID Design Principles)**: Decoupled geometry factories, strategy-based numbering adapters, and observer-based event dispatching.

---

## 5. Verification Matrix & Sign-Off

| Requirement ID | Verification Method | Acceptance Criteria | Status |
| :--- | :--- | :--- | :--- |
| **FR-01 to FR-03** | Visual Inspection & Unit Test | Exact match to hand-drawn clinical 4-quadrant reference | **VERIFIED** |
| **FR-04 to FR-07** | Automated Build & WebGL Render | 1:1 match to photographic 32-tooth dentition image | **VERIFIED** |
| **FR-08** | Visual Inspection | Titanium screw fixture replaces root for Tooth #25 | **VERIFIED** |
| **FR-09 to FR-12** | Interactive E2E Verification | 360° orbit without drag click glitches; 100% transparent canvas | **VERIFIED** |
| **FR-13 to FR-14** | Functional Test | All 6 clinical restorations apply and update materials | **VERIFIED** |
| **FR-15 to FR-16** | Cross-Browser Smoke Test | Arabic RTL and Dark/Light themes switch seamlessly | **VERIFIED** |
| **NFR-01 to NFR-07** | Performance Profiling | Steady 60 FPS, clean unmount, 0 TypeScript compile errors | **VERIFIED** |

---

### Sign-Off Approvals

- **Authored by:** Abdo Al Adawy  
- **Supervised by:** Eng. Aya Adel  
- **Date:** October 2026  
- **Build Verification:** Vite 6.x • Three.js 0.180.x • React 19.x  
