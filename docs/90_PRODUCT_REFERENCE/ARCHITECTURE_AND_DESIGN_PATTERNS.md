# Software Engineering Architecture & Design Patterns
## 3DDX Anatomical Odontogram & 3D Biomechanical Dental Arch System

**Lead Engineer:** **Abdo Al Adawy**  
**Project Supervisor:** **Eng. Aya Adel**  
**Classification:** Enterprise Clinical Web Application Engineering  

---

## 1. Architectural Philosophy: Medical-Grade WebGL

Building clinical dental software requires a higher standard of software engineering than standard web applications. A misidentified tooth or laggy interaction in surgical planning can directly compromise patient care.

Our architecture adheres to three core tenets:
1. **Clinical Determinism**: Tooth indexing, quadrant positions, and restoration assignments follow strict dental standards (ISO 3950 and ADA Universal).
2. **Deterministic State Synchronization**: The 2D Odontogram grid and 3D WebGL arches share a single reactive state stream without race conditions.
3. **GPU Resource Stewardship**: Clean allocation and deallocation of WebGL buffers, textures, and render loops preventing memory leaks.

---

## 2. SOLID Principles in Practice

### 2.1 Single Responsibility Principle (SRP)
- `TeethChart.tsx`: Solely responsible for component facade orchestration, toolbar state, and consumer API exposure.
- `TeethChart3DArch.tsx`: Solely responsible for the Three.js WebGL scene, lighting rig, camera OrbitControls, and raycaster.
- `ClinicalToothSilhouette.tsx`: Solely responsible for rendering deterministic SVG silhouettes in 2D.
- `LanguageContext.tsx`: Solely responsible for internationalization and RTL directionality.

### 2.2 Open/Closed Principle (OCP)
The system is open for extension but closed for modification. New restoration modalities (e.g., `veneer_prep`, `splint`, `post_core`) can be added by declaring them in the `RESTORATION_TYPES` dictionary without modifying the core scene graph or raycasting engines.

### 2.3 Liskov Substitution Principle (LSP)
Both `universal` and `fdi` numbering strategies adhere to the common `ToothSystem` contract. Swapping the numbering strategy mutates badges and displays without altering tooth indexing logic.

### 2.4 Interface Segregation Principle (ISP)
Props interfaces are divided into granular, focused contracts (`TeethChartProps`, `TeethChart3DArchProps`, `ToothOdontoData`), ensuring components never depend on unused properties.

### 2.5 Dependency Inversion Principle (DIP)
High-level views (`TeethChartPage`) depend on abstract component interfaces rather than low-level WebGL renderer implementations.

---

## 3. Design Patterns Applied

### 3.1 Abstract Factory & Builder Pattern
```typescript
// Procedural Geometry Factory
function buildCrownGeometry(tooth: ToothOdontoData, isUpper: boolean): THREE.BufferGeometry {
  switch (tooth.category) {
    case 'molar': return createMolarCrownGeometry(isUpper);
    case 'premolar': return createPremolarCrownGeometry(isUpper);
    case 'canine': return createCanineCrownGeometry(isUpper);
    case 'incisor_cen': return createIncisorCrownGeometry(isUpper, true);
    case 'incisor_lat': return createIncisorCrownGeometry(isUpper, false);
  }
}
```
**Rationale**: Eliminates hardcoded meshes and allows procedural parametric generation of biological crowns with varying dimensions, heights, and cusp configurations.

### 3.2 Strategy Pattern (Numbering Adapter)
```typescript
// Strategy-based tooth numbering formatter
const displayNum = system === 'universal' ? tooth.universal : tooth.fdi;
```
**Rationale**: Supports global clinical workflows (US practices use ADA Universal 1–32; European, Middle Eastern, and Asian practices use ISO 3950 FDI 11–48) via a pluggable algorithm.

### 3.3 Facade Pattern
`<TeethChart />` serves as a unified Facade:
- Consumers do not need to configure Three.js scenes, cameras, lighting rigs, or raycasters.
- Consumers simply provide `selected`, `toothRestorations`, and `onSelectionChange`.

### 3.4 Composite Pattern in 3D Scene Graph
Each tooth in the 3D scene is represented as an atomic `ToothGroup` containing:
- Crown Mesh (`THREE.Mesh`)
- Root Group (`THREE.Group`)
- Facial Badge Mesh (`THREE.Mesh`)
- Occlusal Badge Mesh (`THREE.Mesh`)

Moving, rotating, hiding, or transforming the `ToothGroup` automatically updates all its biological children consistently.

---

## 4. Performance & Clean Code Standards

1. **Deterministic Function Purity**: Pure mathematical functions for parabolic arch coordinates, bezier curves, and superellipse radius calculations.
2. **Zero Any Typing**: Strict TypeScript definitions across all props, data stores, and Three.js entities.
3. **Self-Documenting Code**: Meaningful identifiers (`posInQuadrant`, `cementoEnamelJunction`, `furcationArch`, `isPatientRight`).
4. **Memory Leak Prevention**: Systematic cleanup hooks disposing WebGL renderers, textures, and event listeners on component unmount.

---

### Project Credits
- **Lead Engineer:** **Abdo Al Adawy**  
- **Supervised by:** **Eng. Aya Adel**  
- **Clinical Platform:** **3DDX Cloud ERP**  
