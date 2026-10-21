# Clinical UI Components Guide: Teeth Chart & 3D Arch Engine

**Lead Software Engineer:** **Abdo Al Adawy**  
**Project Supervisor:** **Eng. Aya Adel**  
**Component Package:** `@3ddx/teeth-chart-components`  

---

## 1. Component Overview

This directory houses the medical-grade tooth charting components powering 3DDX clinical applications:

- **`TeethChart.tsx`**: The master component Facade. Unifies the 2D 4-quadrant cross odontogram with the 3D parabolic arch engine behind a single clean React interface.
- **`TeethChart3DArch.tsx`**: The Three.js WebGL 2.0 biomechanical CAD engine. Generates photorealistic procedural tooth crowns, warm amber roots, and surgical Grade-5 titanium implant fixtures.

---

## 2. Component Exports & Data Models

```typescript
import { 
  TeethChart, 
  ODONTO_DATABASE, 
  RESTORATION_TYPES,
  type ToothOdontoData, 
  type RestorationType, 
  type ToothSystem 
} from '@/components/ui/TeethChart';
```

### Data Structures

#### `ToothOdontoData`
Represents an anatomical human tooth entity:
```typescript
export interface ToothOdontoData {
  universal: number;        // ADA Universal number (1..32)
  fdi: number;              // ISO 3950 FDI number (11..48)
  code: string;             // Display code
  name: string;             // Clinical name (e.g., 'Upper Right Central Incisor')
  category: 'molar' | 'premolar' | 'canine' | 'incisor_lat' | 'incisor_cen';
  arch: 'upper' | 'lower';
  quadrant: 'UR' | 'UL' | 'LL' | 'LR';
  isAnterior: boolean;      // True for teeth in the aesthetic smile zone (6..11, 22..27)
}
```

#### `RestorationType`
The six clinical restorative procedures supported:
```typescript
export type RestorationType = 
  | 'crown'        // Full coverage crown (Cyan #00d8fe)
  | 'bridge'       // Bridge retainer/pontic (Indigo #6366f1)
  | 'veneer'       // Ceramic veneer (Purple #a855f7)
  | 'implant'      // Surgical implant fixture (Amber #f59e0b / Titanium Fixture)
  | 'inlay'        // Inlay / Onlay restoration (Emerald #10b981)
  | 'extraction';  // Missing tooth / extraction (Rose #f43f5e)
```

---

## 3. Developer Integration Guide

### Minimal Implementation

```tsx
import React, { useState } from 'react';
import { TeethChart, type RestorationType } from '@/components/ui/TeethChart';

export function SimpleDentalCase() {
  const [selected, setSelected] = useState<number[]>([]);
  const [restorations, setRestorations] = useState<Record<number, RestorationType>>({});

  return (
    <TeethChart
      selected={selected}
      toothRestorations={restorations}
      onSelectionChange={(newSelected, newRestorations) => {
        setSelected(newSelected);
        setRestorations(newRestorations);
      }}
    />
  );
}
```

### Advanced Implementation with Surgical Guide Specs

```tsx
import React, { useState } from 'react';
import { TeethChart, type RestorationType, type ToothSystem } from '@/components/ui/TeethChart';

export function SurgicalGuideWorkstation() {
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([14, 19, 25]);
  const [restorations, setRestorations] = useState<Record<number, RestorationType>>({
    14: 'crown',
    19: 'crown',
    25: 'implant', // Renders realistic Grade-5 titanium screw in 3D!
  });

  const handleSelection = (selected: number[], res: Record<number, RestorationType>) => {
    setSelectedTeeth(selected);
    setRestorations(res);
    console.log('Synchronized case data:', { selected, restorations: res });
  };

  return (
    <div className="p-8 bg-slate-900 rounded-3xl">
      <TeethChart
        selected={selectedTeeth}
        toothRestorations={restorations}
        onSelectionChange={handleSelection}
        showToolbar={true}
        className="shadow-2xl"
      />
    </div>
  );
}
```

---

## 4. Architectural Rules for Contributors

1. **Geometry Factory Purity**: Geometry functions (`createMolarCrownGeometry`, `createSingleRootGeometry`, etc.) in `TeethChart3DArch.tsx` must remain pure mathematical functions generating fresh `THREE.BufferGeometry` instances with normalized vertex normals.
2. **Texture Disposal**: Always call `.dispose()` on canvas textures and materials during dynamic updates or component unmount.
3. **No Hardcoded Strings**: All user-facing labels must reference `LanguageContext` keys to preserve full Arabic RTL and English LTR compatibility.
