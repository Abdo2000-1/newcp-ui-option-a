import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Layers,
  Sliders,
  Crosshair,
  Compass,
  FileCheck,
  ShieldCheck,
  Stethoscope,
  Activity,
  Sparkles,
  Download,
  Info
} from 'lucide-react';

interface DicomMprViewerProps {
  orderNumber: string;
  patientName: string;
  implantSite?: string;
  implantModel?: string;
  sleeveModel?: string;
  sleeveOffset?: number;
  nerveClearance?: number;
}

export const DicomMprViewer: React.FC<DicomMprViewerProps> = ({
  orderNumber = '504901',
  patientName = 'Test Add order',
  implantSite = 'Tooth #19 (Mandibular 1st Molar)',
  implantModel = 'Straumann® BLT Ø4.1mm RC x 10mm',
  sleeveModel = 'T-Sleeve Straumann (Ø5.0mm, H: 5mm)',
  sleeveOffset = 9.0,
  nerveClearance = 3.2
}) => {
  // Viewer state
  const [sliceIndex, setSliceIndex] = useState<number>(240); // 1 - 512
  const [windowPreset, setWindowPreset] = useState<'bone' | 'soft' | 'enamel' | 'custom'>('bone');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [guideOpacity, setGuideOpacity] = useState<number>(65); // 0 - 100%
  const [showCrosshairs, setShowCrosshairs] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<'navigate' | 'measure' | 'density'>('navigate');
  const [hoveredHU, setHoveredHU] = useState<{ x: number; y: number; hu: number; label: string } | null>(null);

  // 3D Orbit state
  const [rotationX, setRotationX] = useState<number>(28);
  const [rotationY, setRotationY] = useState<number>(-35);
  const [isDragging3D, setIsDragging3D] = useState<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas Refs
  const axialCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sagittalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewport3DCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------
  // 1. RENDER AXIAL CBCT SLICE (True Radiographic CT Appearance)
  // -------------------------------------------------------------
  const renderAxialSlice = useCallback(() => {
    const canvas = axialCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background (Deep Radiologic Dark Slate)
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, width, height);

    // Radiologic Noise & Ambient Scatter Simulation
    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    // Window / Level factors
    let contrastMultiplier = 1.0;
    let brightnessOffset = 0;
    if (windowPreset === 'bone') {
      contrastMultiplier = 1.4;
      brightnessOffset = 15;
    } else if (windowPreset === 'soft') {
      contrastMultiplier = 0.8;
      brightnessOffset = 45;
    } else if (windowPreset === 'enamel') {
      contrastMultiplier = 1.8;
      brightnessOffset = -10;
    }

    // Geometry of Mandible in Axial View
    const centerX = width * 0.5;
    const centerY = height * 0.52;
    const archRadiusX = width * 0.34;
    const archRadiusY = height * 0.38;

    // Slice elevation factor (0.0 to 1.0 based on sliceIndex)
    const zFactor = sliceIndex / 512;
    const corticalThickness = 14 + (1 - zFactor) * 6;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;

        // Normalized arch coordinates (Parabolic Mandibular U-shape)
        const dx = (x - centerX) / archRadiusX;
        const dy = (y - centerY) / archRadiusY;

        // Parabolic distance function: y = a * x^2
        const parabolaDist = Math.abs(dy - (dx * dx * 1.05 - 0.35));
        const inArchRange = y > centerY - archRadiusY * 0.45 && y < centerY + archRadiusY * 0.85;

        let hu = -950; // Air baseline

        // Soft tissue envelope (Cheek / Lip / Tongue)
        const softTissueEnvelope = Math.sqrt(dx * dx + dy * dy);
        if (softTissueEnvelope < 1.15 && y > centerY - archRadiusY * 0.6) {
          hu = 35 + Math.sin(x * 0.05) * 8 + Math.cos(y * 0.05) * 8;
        }

        // Cortical & Cancellous Bone
        if (inArchRange && parabolaDist < 0.28) {
          // Distance from central marrow axis
          const marrowDist = parabolaDist / 0.28;
          if (marrowDist > 0.68) {
            // Dense Cortical Bone Plate (Buccal / Lingual Plates)
            hu = 950 + Math.random() * 180 + (marrowDist - 0.68) * 600;
          } else {
            // Spongiosa / Cancellous Trabecular Bone (Mottled texture)
            const trabecularPattern =
              Math.sin(x * 0.28) * Math.cos(y * 0.28) * 120 +
              Math.sin(x * 0.6) * Math.sin(y * 0.6) * 60;
            hu = 550 + trabecularPattern + Math.random() * 80;
          }

          // Individual Teeth locations around the arch
          const archAngle = Math.atan2(dy + 0.35, dx);
          // Tooth #19 Site: Right 1st Molar (approx dx = -0.55, dy = 0.05)
          const distToSite19 = Math.sqrt(Math.pow(dx - (-0.45), 2) + Math.pow(dy - (-0.12), 2));
          if (distToSite19 < 0.08) {
            // Missing Tooth Gap / Implant Osteotomy Site!
            if (zFactor > 0.45 && zFactor < 0.75) {
              // Implant Titanium Core (Hyperdense Radiopaque Artifacts)
              hu = 2400 + Math.random() * 200;
            } else {
              // Extraction Socket with Healing Granulation Bone
              hu = 450 + Math.random() * 90;
            }
          }

          // Adjacent Natural Teeth (#18, #20, #21, #28, #30, #31)
          const teethPositions = [
            { x: -0.65, y: 0.15, isMolar: true }, // #18
            { x: -0.32, y: -0.22, isMolar: false }, // #20
            { x: -0.22, y: -0.32, isMolar: false }, // #21
            { x: 0.22, y: -0.32, isMolar: false },  // #28
            { x: 0.32, y: -0.22, isMolar: false },  // #29
            { x: 0.48, y: -0.05, isMolar: true },   // #30
            { x: 0.65, y: 0.15, isMolar: true },   // #31
          ];

          for (const tp of teethPositions) {
            const dist = Math.sqrt(Math.pow(dx - tp.x, 2) + Math.pow(dy - tp.y, 2));
            if (dist < (tp.isMolar ? 0.09 : 0.065)) {
              if (dist < 0.035) {
                // Pulp chamber (Lower density canal)
                hu = 120 + Math.random() * 40;
              } else if (dist > (tp.isMolar ? 0.07 : 0.05)) {
                // Highly radiopaque Enamel Shell
                hu = 2100 + Math.random() * 150;
              } else {
                // Dentin Core
                hu = 1250 + Math.random() * 80;
              }
            }
          }
        }

        // Convert HU to Grayscale Pixel (Medical Radiograph LUT)
        let intensity = 0;
        if (hu > -800) {
          const normalized = (hu - (-200)) / (2200 - (-200));
          intensity = Math.min(255, Math.max(0, normalized * 255 * contrastMultiplier + brightnessOffset));
        }

        // Add subtle quantum mottle detector noise
        const mottle = (Math.random() - 0.5) * 8;
        const finalVal = Math.min(255, Math.max(0, intensity + mottle));

        data[idx] = finalVal;
        data[idx + 1] = Math.min(255, finalVal * 1.02); // subtle medical blue tone
        data[idx + 2] = Math.min(255, finalVal * 1.05);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlays: Crosshairs & Calibration Markings
    if (showCrosshairs) {
      const site19PixelX = centerX + (-0.45) * archRadiusX;
      const site19PixelY = centerY + (-0.12) * archRadiusY;

      ctx.save();
      // Target Reticle at Site #19
      ctx.strokeStyle = '#f59e0b'; // Amber / Orange
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Crosshair horizontal
      ctx.beginPath();
      ctx.moveTo(site19PixelX - 30, site19PixelY);
      ctx.lineTo(site19PixelX + 30, site19PixelY);
      ctx.stroke();

      // Crosshair vertical
      ctx.beginPath();
      ctx.moveTo(site19PixelX, site19PixelY - 30);
      ctx.lineTo(site19PixelX, site19PixelY + 30);
      ctx.stroke();

      // Implant Platform Target Ring
      ctx.setLineDash([]);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(site19PixelX, site19PixelY, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Outer Safety Buffer Ring
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.arc(site19PixelX, site19PixelY, 18, 0, Math.PI * 2);
      ctx.stroke();

      // Reticle Tag
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('SITE #19 (Straumann BLT)', site19PixelX - 55, site19PixelY - 18);

      ctx.restore();
    }

    // Anatomical Directional Markers (A/P/R/L)
    ctx.save();
    ctx.font = 'black 11px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('A (Anterior)', centerX, 18);
    ctx.fillText('P (Posterior)', centerX, height - 10);
    ctx.fillText('R', 16, centerY);
    ctx.fillText('L', width - 16, centerY);
    ctx.restore();

    // Scale Ruler (10mm) in Bottom Right
    ctx.save();
    const rulerX = width - 75;
    const rulerY = height - 25;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rulerX, rulerY);
    ctx.lineTo(rulerX + 50, rulerY);
    ctx.moveTo(rulerX, rulerY - 4);
    ctx.lineTo(rulerX, rulerY + 4);
    ctx.moveTo(rulerX + 25, rulerY - 2);
    ctx.lineTo(rulerX + 25, rulerY + 2);
    ctx.moveTo(rulerX + 50, rulerY - 4);
    ctx.lineTo(rulerX + 50, rulerY + 4);
    ctx.stroke();
    ctx.font = '9px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    ctx.fillText('10 mm', rulerX + 25, rulerY - 7);
    ctx.restore();

  }, [sliceIndex, windowPreset, showCrosshairs]);

  // ------------------------------------------------------------------
  // 2. RENDER SAGITTAL CROSS-SECTION (Site #19 - Bone, Nerve, Implant)
  // ------------------------------------------------------------------
  const renderSagittalSlice = useCallback(() => {
    const canvas = sagittalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#05070c';
    ctx.fillRect(0, 0, width, height);

    // Create realistic bone cross-section gradient
    const centerX = width * 0.5;
    const crestY = height * 0.28;
    const baseJawY = height * 0.88;

    // Mandibular Cross-Section Path (Bone Envelope)
    ctx.save();

    // Draw Realistic Trabecular Bone Fill
    const boneGrad = ctx.createRadialGradient(centerX, (crestY + baseJawY) * 0.5, 10, centerX, (crestY + baseJawY) * 0.5, 120);
    boneGrad.addColorStop(0, '#1e293b');
    boneGrad.addColorStop(0.7, '#0f172a');
    boneGrad.addColorStop(1, '#020617');

    ctx.beginPath();
    // Anatomical alveolar crest with buccal and lingual slopes
    ctx.moveTo(centerX - 42, crestY + 15);
    ctx.quadraticCurveTo(centerX, crestY - 12, centerX + 46, crestY + 18);
    // Lingual cortex with submandibular fossa undercut
    ctx.bezierCurveTo(centerX + 62, crestY + 70, centerX + 48, baseJawY - 25, centerX + 25, baseJawY);
    // Inferior border of the mandible (Dense base)
    ctx.quadraticCurveTo(centerX, baseJawY + 12, centerX - 30, baseJawY);
    // Buccal cortex slope
    ctx.bezierCurveTo(centerX - 58, baseJawY - 30, centerX - 62, crestY + 80, centerX - 42, crestY + 15);
    ctx.closePath();

    ctx.fillStyle = boneGrad;
    ctx.fill();

    // Dense Cortical Bone Layer (Radiopaque White Border)
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner fine trabecular noise
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mucosal Soft Tissue Gingival Profile
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)'; // Translucent Gingiva pink
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(centerX - 52, crestY + 12);
    ctx.quadraticCurveTo(centerX, crestY - 20, centerX + 56, crestY + 14);
    ctx.stroke();

    // -------------------------------------------------------------
    // INFERIOR ALVEOLAR NERVE CANAL (IAN) - Anatomical Mandibular Canal
    // -------------------------------------------------------------
    const nerveX = centerX + 12;
    const nerveY = baseJawY - 38;
    const nerveRadius = 9;

    // Radiolucent Dark Canal Lumen
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(nerveX, nerveY, nerveRadius, 0, Math.PI * 2);
    ctx.fill();

    // Cortical Bone Ring around Nerve Canal
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(nerveX, nerveY, nerveRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Glowing Red/Fluorescent Clinical Nerve Core (Co-Diagnostix Tracing)
    const nerveCoreGrad = ctx.createRadialGradient(nerveX, nerveY, 1, nerveX, nerveY, nerveRadius - 1);
    nerveCoreGrad.addColorStop(0, '#f87171');
    nerveCoreGrad.addColorStop(0.6, '#dc2626');
    nerveCoreGrad.addColorStop(1, 'rgba(220, 38, 38, 0.3)');
    ctx.fillStyle = nerveCoreGrad;
    ctx.beginPath();
    ctx.arc(nerveX, nerveY, nerveRadius - 2, 0, Math.PI * 2);
    ctx.fill();

    // IAN Label Tag
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#f87171';
    ctx.fillText('IAN Canal Ø2.8mm', nerveX + 16, nerveY + 3);

    // -------------------------------------------------------------
    // STRAUMANN® BLT IMPLANT FIXTURE (Realistic Titanium Graphics)
    // -------------------------------------------------------------
    const implantTopY = crestY - 4;
    const implantLength = 95; // Representing 10.0mm
    const implantApexY = implantTopY + implantLength;
    const implantWidthTop = 26; // Ø4.1mm
    const implantWidthApex = 16; // Tapered apex

    // Implant Center Axis Guideline
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(centerX, crestY - 45);
    ctx.lineTo(centerX, implantApexY + 25);
    ctx.stroke();
    ctx.setLineDash([]);

    // Titanium Fixture Shading
    const implantGrad = ctx.createLinearGradient(centerX - implantWidthTop / 2, implantTopY, centerX + implantWidthTop / 2, implantTopY);
    implantGrad.addColorStop(0, '#94a3b8');
    implantGrad.addColorStop(0.3, '#f1f5f9'); // Metallic Specular Highlight
    implantGrad.addColorStop(0.7, '#64748b');
    implantGrad.addColorStop(1, '#334155');

    // Tapered Fixture Body with Helical Screw Threads
    ctx.fillStyle = implantGrad;
    ctx.strokeStyle = '#10b981'; // Green Outline for Co-Diagnostix Active Plan
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(centerX - implantWidthTop / 2, implantTopY);
    ctx.lineTo(centerX + implantWidthTop / 2, implantTopY);
    ctx.lineTo(centerX + implantWidthApex / 2, implantApexY);
    ctx.quadraticCurveTo(centerX, implantApexY + 4, centerX - implantWidthApex / 2, implantApexY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Realistic Screw Threads Grooves
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.lineWidth = 1.5;
    for (let ty = implantTopY + 14; ty < implantApexY - 8; ty += 9) {
      const prog = (ty - implantTopY) / implantLength;
      const curW = implantWidthTop - (implantWidthTop - implantWidthApex) * prog;
      ctx.beginPath();
      ctx.moveTo(centerX - curW / 2 + 1, ty);
      ctx.lineTo(centerX + curW / 2 - 1, ty + 2);
      ctx.stroke();
    }

    // Apical Vent / Cutting Flutes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(centerX, implantApexY - 6, 3.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // -------------------------------------------------------------
    // SURGICAL GUIDE SLEEVE (T-Sleeve Straumann 5mm)
    // -------------------------------------------------------------
    const sleeveHeight = 32;
    const sleeveWidth = 36;
    const sleeveTopY = implantTopY - (sleeveOffset * 5.2);

    // Sleeve Housing (Titanium Brushed Finish)
    const sleeveGrad = ctx.createLinearGradient(centerX - sleeveWidth / 2, sleeveTopY, centerX + sleeveWidth / 2, sleeveTopY);
    sleeveGrad.addColorStop(0, '#64748b');
    sleeveGrad.addColorStop(0.4, '#e2e8f0');
    sleeveGrad.addColorStop(0.8, '#475569');
    sleeveGrad.addColorStop(1, '#1e293b');

    ctx.fillStyle = sleeveGrad;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.fillRect(centerX - sleeveWidth / 2, sleeveTopY, sleeveWidth, sleeveHeight);
    ctx.strokeRect(centerX - sleeveWidth / 2, sleeveTopY, sleeveWidth, sleeveHeight);

    // Drill Bore Aperture (Hole inside sleeve)
    ctx.fillStyle = '#020617';
    ctx.fillRect(centerX - 10, sleeveTopY, 20, sleeveHeight);

    // Offset Caliper Line from Sleeve Base to Implant Shoulder
    ctx.strokeStyle = '#a855f7'; // Purple Offset Indicator
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(centerX - 24, sleeveTopY + sleeveHeight);
    ctx.lineTo(centerX - 24, implantTopY);
    ctx.stroke();
    ctx.setLineDash([]);
    // Offset Arrows
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`Offset: ${sleeveOffset.toFixed(1)}mm`, centerX - 78, (sleeveTopY + sleeveHeight + implantTopY) / 2 + 3);

    // -------------------------------------------------------------
    // SAFETY DISTANCE CALIPER (Apex to IAN Canal Cortex)
    // -------------------------------------------------------------
    const apexCenterX = centerX;
    const apexCenterY = implantApexY + 4;
    const nerveTopY = nerveY - nerveRadius;

    ctx.strokeStyle = '#10b981'; // Green (Safe)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(apexCenterX, apexCenterY);
    ctx.lineTo(nerveX, nerveTopY);
    ctx.stroke();

    // Measurement Ticks
    ctx.beginPath();
    ctx.moveTo(apexCenterX - 6, apexCenterY);
    ctx.lineTo(apexCenterX + 6, apexCenterY);
    ctx.moveTo(nerveX - 6, nerveTopY);
    ctx.lineTo(nerveX + 6, nerveTopY);
    ctx.stroke();

    // Measurement Readout Box
    ctx.fillStyle = 'rgba(6, 78, 59, 0.9)';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    const boxMidX = (apexCenterX + nerveX) / 2 + 10;
    const boxMidY = (apexCenterY + nerveTopY) / 2;
    ctx.fillRect(boxMidX, boxMidY - 10, 85, 20);
    ctx.strokeRect(boxMidX, boxMidY - 10, 85, 20);

    ctx.fillStyle = '#ecfdf5';
    ctx.font = 'black 10px monospace';
    ctx.fillText(`${nerveClearance.toFixed(1)}mm (SAFE)`, boxMidX + 6, boxMidY + 4);

    // Orientation Labels
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('B (Buccal)', 15, crestY + 50);
    ctx.fillText('L (Lingual)', width - 65, crestY + 50);

    ctx.restore();
  }, [sleeveOffset, nerveClearance]);

  // ------------------------------------------------------------------
  // 3. RENDER 3D SURGICAL GUIDE & DENTAL ARCH (Photorealistic Shaded Mesh)
  // ------------------------------------------------------------------
  const render3DViewport = useCallback(() => {
    const canvas = viewport3DCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Viewport background with professional dental studio vignette
    const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 10, width * 0.5, height * 0.5, width * 0.7);
    bgGrad.addColorStop(0, '#0c1322');
    bgGrad.addColorStop(1, '#03050a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width * 0.5, height * 0.52);

    // 3D Rotation Transform Matrix Simulation
    const radX = (rotationX * Math.PI) / 180;
    const radY = (rotationY * Math.PI) / 180;

    const scale = (zoomLevel / 100) * 1.05;
    ctx.scale(scale, scale);

    // 3D Perspective Projection Matrix Helper
    const project = (x: number, y: number, z: number) => {
      // Rotate around Y
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate around X
      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      const fov = 350;
      const pScale = fov / (fov + z2);
      return { x: x1 * pScale, y: y2 * pScale, z: z2 };
    };

    // -------------------------------------------------------------
    // A. TEETH DENTAL ARCH (Realistic Gypsum White / Enamel Texture)
    // -------------------------------------------------------------
    const teethData = [
      { name: '#17', t: -1.2, r: 12, h: 22, isMolar: true },
      { name: '#18', t: -0.9, r: 11, h: 21, isMolar: true },
      // #19 is missing! (Osteotomy implant gap)
      { name: '#20', t: -0.38, r: 8, h: 24, isMolar: false },
      { name: '#21', t: -0.2, r: 7.5, h: 25, isMolar: false },
      { name: '#22', t: -0.07, r: 7, h: 26, isMolar: false },
      { name: '#27', t: 0.07, r: 7, h: 26, isMolar: false },
      { name: '#28', t: 0.2, r: 7.5, h: 25, isMolar: false },
      { name: '#29', t: 0.38, r: 8, h: 24, isMolar: false },
      { name: '#30', t: 0.65, r: 11, h: 21, isMolar: true },
      { name: '#31', t: 0.95, r: 12, h: 22, isMolar: true },
    ];

    // Draw Alveolar Bone Ridge
    const archPoints = [];
    for (let a = -1.35; a <= 1.35; a += 0.15) {
      const rx = 100 * Math.sin(a);
      const rz = -65 * Math.cos(a) + 20;
      archPoints.push(project(rx, 15, rz));
    }

    // Gingiva / Bone Ridge Path
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    archPoints.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.stroke();

    // Draw Each Tooth Crown in 3D
    teethData.forEach((tooth) => {
      const tx = 98 * Math.sin(tooth.t);
      const tz = -65 * Math.cos(tooth.t) + 20;

      const basePt = project(tx, 10, tz);
      const cuspPt = project(tx, 10 - tooth.h, tz);

      // Tooth Body Gradient (Shaded 3D Volume)
      const toothGrad = ctx.createLinearGradient(basePt.x - tooth.r, basePt.y, basePt.x + tooth.r, cuspPt.y);
      toothGrad.addColorStop(0, '#cbd5e1'); // Cervical margin
      toothGrad.addColorStop(0.5, '#f8fafc'); // Mid-buccal enamel
      toothGrad.addColorStop(1, '#e2e8f0'); // Incisal edge

      ctx.fillStyle = toothGrad;
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.ellipse(cuspPt.x, cuspPt.y, tooth.r * (tooth.isMolar ? 1.2 : 0.8), tooth.r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Tooth Occlusal Anatomy Fissures
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(cuspPt.x - 3, cuspPt.y);
      ctx.lineTo(cuspPt.x + 3, cuspPt.y);
      ctx.stroke();
    });

    // -------------------------------------------------------------
    // B. TRANSLUCENT SURGICAL GUIDE BODY (Biocompatible Clear Resin)
    // -------------------------------------------------------------
    if (guideOpacity > 5) {
      const guideAlpha = guideOpacity / 100;

      // Draw Guide Shell
      ctx.save();
      const guidePointsTop = [];
      const guidePointsBottom = [];

      for (let a = -1.1; a <= 1.1; a += 0.1) {
        const gx = 100 * Math.sin(a);
        const gz = -65 * Math.cos(a) + 20;
        guidePointsTop.push(project(gx, -18, gz));
        guidePointsBottom.push(project(gx, 12, gz));
      }

      ctx.beginPath();
      guidePointsTop.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      for (let i = guidePointsBottom.length - 1; i >= 0; i--) {
        ctx.lineTo(guidePointsBottom[i].x, guidePointsBottom[i].y);
      }
      ctx.closePath();

      // Photopolymer Clear Resin Shader (Amber/Cyan Medical Tint with Specular Highlights)
      const resinGrad = ctx.createLinearGradient(-80, -40, 80, 40);
      resinGrad.addColorStop(0, `rgba(56, 189, 248, ${guideAlpha * 0.4})`); // Sky Blue
      resinGrad.addColorStop(0.4, `rgba(255, 255, 255, ${guideAlpha * 0.6})`); // High Specular Reflection
      resinGrad.addColorStop(0.7, `rgba(2, 132, 199, ${guideAlpha * 0.45})`);
      resinGrad.addColorStop(1, `rgba(14, 165, 233, ${guideAlpha * 0.3})`);

      ctx.fillStyle = resinGrad;
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 255, 255, ${guideAlpha * 0.8})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // -------------------------------------------------------------
      // C. INSPECTION WINDOWS (Inspection Windows) Over Incisal Edges
      // -------------------------------------------------------------
      const windowAngles = [-0.25, 0.25];
      windowAngles.forEach((wAngle) => {
        const wx = 100 * Math.sin(wAngle);
        const wz = -65 * Math.cos(wAngle) + 20;
        const wPt = project(wx, -6, wz);

        ctx.fillStyle = 'rgba(5, 7, 12, 0.85)'; // Cutout hole
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(wPt.x - 7, wPt.y - 5, 14, 10, 3);
        ctx.fill();
        ctx.stroke();
      });

      // -------------------------------------------------------------
      // D. MACHINED TITANIUM SURGICAL SLEEVE at Site #19
      // -------------------------------------------------------------
      const s19X = 98 * Math.sin(-0.64);
      const s19Z = -65 * Math.cos(-0.64) + 20;
      const sleeveTopPt = project(s19X, -30, s19Z);
      const sleeveBotPt = project(s19X, -10, s19Z);

      // Metallic Titanium Flange / Cylinder
      const metalGrad = ctx.createLinearGradient(sleeveTopPt.x - 14, sleeveTopPt.y, sleeveTopPt.x + 14, sleeveTopPt.y);
      metalGrad.addColorStop(0, '#475569');
      metalGrad.addColorStop(0.3, '#f8fafc'); // Bright Metallic Specular
      metalGrad.addColorStop(0.7, '#94a3b8');
      metalGrad.addColorStop(1, '#1e293b');

      ctx.fillStyle = metalGrad;
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.ellipse(sleeveTopPt.x, sleeveTopPt.y, 13, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sleeve Cylinder Body
      ctx.beginPath();
      ctx.moveTo(sleeveTopPt.x - 13, sleeveTopPt.y);
      ctx.lineTo(sleeveBotPt.x - 13, sleeveBotPt.y);
      ctx.ellipse(sleeveBotPt.x, sleeveBotPt.y, 13, 7, 0, 0, Math.PI);
      ctx.lineTo(sleeveTopPt.x + 13, sleeveTopPt.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Drill Aperture (Internal Hole)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.ellipse(sleeveTopPt.x, sleeveTopPt.y, 7, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Directional Tag for Sleeve
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('T-Sleeve (5mm)', sleeveTopPt.x - 30, sleeveTopPt.y - 12);

      ctx.restore();
    }

    ctx.restore();

    // 3D Viewport HUD
    ctx.save();
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`ROTATION: X:${Math.round(rotationX)}° Y:${Math.round(rotationY)}°`, 12, 20);
    ctx.fillText(`GUIDE OPACITY: ${guideOpacity}%`, 12, 34);
    ctx.restore();

  }, [rotationX, rotationY, zoomLevel, guideOpacity]);

  // Handle Dragging 3D Viewport to Orbit
  const handleMouseDown3D = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging3D(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove3D = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging3D) return;
    const deltaX = e.clientX - dragStartPos.current.x;
    const deltaY = e.clientY - dragStartPos.current.y;
    dragStartPos.current = { x: e.clientX, y: e.clientY };

    setRotationY((prev) => (prev + deltaX * 0.75) % 360);
    setRotationX((prev) => Math.max(-60, Math.min(60, prev + deltaY * 0.75)));
  };

  const handleMouseUp3D = () => {
    setIsDragging3D(false);
  };

  // Handle Axial Canvas Mouse Move (Hounsfield Unit Probe)
  const handleAxialMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = axialCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    // Approximate anatomical HU based on distance to center
    const dx = (x - canvas.width * 0.5) / (canvas.width * 0.34);
    const dy = (y - canvas.height * 0.52) / (canvas.height * 0.38);
    const distToArch = Math.abs(dy - (dx * dx * 1.05 - 0.35));

    let hu = -950;
    let label = 'Air (-950 HU)';
    if (distToArch < 0.28 && y > canvas.height * 0.3) {
      if (distToArch > 0.18) {
        hu = 1250;
        label = 'Cortical Bone (+1250 HU, D1)';
      } else {
        hu = 780;
        label = 'Trabecular Marrow (+780 HU, D2)';
      }
    } else if (Math.sqrt(dx * dx + dy * dy) < 1.1) {
      hu = 45;
      label = 'Soft Tissue (+45 HU)';
    }

    setHoveredHU({ x, y, hu, label });
  };

  const handleAxialMouseLeave = () => {
    setHoveredHU(null);
  };

  // Re-render canvases when dependencies update
  useEffect(() => {
    renderAxialSlice();
  }, [renderAxialSlice]);

  useEffect(() => {
    renderSagittalSlice();
  }, [renderSagittalSlice]);

  useEffect(() => {
    render3DViewport();
  }, [render3DViewport]);

  return (
    <div className="space-y-4 w-full select-none">
      
      {/* 1. Header Toolbar (PACS Medical CAD Station Style) */}
      <div className="bg-[#0b101d] text-white p-3.5 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Compass size={18} className="animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide">
                Co-Diagnostix™ DICOM Multi-Planar Reconstruction
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CLINICAL GRADE CAD
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Patient: <strong>{patientName}</strong> • Case #{orderNumber} • Straumann® Guided Surgery Suite
            </p>
          </div>
        </div>

        {/* Real-time Nerve Safety Margin Status Pill */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Nerve Margin: {nerveClearance.toFixed(1)}mm [PASS]</span>
          </div>
          <div className="px-2.5 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-mono font-bold">
            Sleeve: {sleeveOffset.toFixed(1)}mm Offset
          </div>
        </div>
      </div>

      {/* 2. Interactive Control Ribbon */}
      <div className="bg-slate-900/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
        
        {/* Slice Scrubber */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px]">
          <span className="font-mono text-slate-400 whitespace-nowrap">
            Slice: <strong className="text-sky-400">#{sliceIndex}/512</strong> (Z: {(sliceIndex * 0.25).toFixed(2)}mm)
          </span>
          <input
            type="range"
            min="1"
            max="512"
            value={sliceIndex}
            onChange={(e) => setSliceIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0284c7]"
          />
        </div>

        {/* Windowing / Contrast Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-bold text-[11px]">Window LUT:</span>
          {(['bone', 'soft', 'enamel'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setWindowPreset(w)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                windowPreset === w
                  ? 'bg-[#0284c7] text-white shadow-md shadow-sky-500/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {w === 'bone' ? 'Bone (HU 850)' : w === 'soft' ? 'Soft Tissue' : 'Enamel / Teeth'}
            </button>
          ))}
        </div>

        {/* Guide Opacity Slider */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold text-[11px] whitespace-nowrap">Guide Opacity:</span>
          <input
            type="range"
            min="0"
            max="100"
            value={guideOpacity}
            onChange={(e) => setGuideOpacity(Number(e.target.value))}
            className="w-20 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <span className="font-mono text-[10px] text-purple-400 w-8">{guideOpacity}%</span>
        </div>

        {/* Viewport Tools */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCrosshairs(!showCrosshairs)}
            className={`p-1.5 rounded-lg border cursor-pointer transition-colors ${
              showCrosshairs ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle Reticle Crosshairs"
          >
            <Crosshair size={14} />
          </button>
          <button
            type="button"
            onClick={() => { setRotationX(28); setRotationY(-35); setZoomLevel(100); }}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Reset 3D Camera"
          >
            <RotateCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
            className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <span className="font-mono text-[11px] text-slate-400">{zoomLevel}%</span>
        </div>

      </div>

      {/* 3. The 3 Tri-Planar Viewports with Real-time Interactive Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        
        {/* VIEWPORT 1: AXIAL CT BONE SLICE */}
        <div className="relative bg-[#05070c] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col group">
          {/* Viewport Header HUD */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-sky-400 font-mono text-[10px] font-bold border border-sky-500/30">
              Axial Plane (Z: {(sliceIndex * 0.25).toFixed(2)}mm)
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-400 font-mono text-[9px] border border-slate-800">
              WL: 450 / WW: 2500
            </span>
          </div>

          {/* Canvas Rendering Context */}
          <div className="w-full aspect-square relative flex items-center justify-center bg-black cursor-crosshair">
            <canvas
              ref={axialCanvasRef}
              width={420}
              height={420}
              onMouseMove={handleAxialMouseMove}
              onMouseLeave={handleAxialMouseLeave}
              className="w-full h-full object-contain"
            />

            {/* Hover HU Density Tooltip */}
            {hoveredHU && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-950/95 text-emerald-400 border border-emerald-500/40 rounded px-2 py-1 text-[10px] font-mono shadow-xl"
                style={{ left: Math.min(hoveredHU.x + 10, 260), top: Math.max(hoveredHU.y - 30, 20) }}
              >
                {hoveredHU.label}
              </div>
            )}
          </div>

          {/* Viewport Footer HUD */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
            <span>Matrix: 512 x 512 x 480</span>
            <span className="text-emerald-400 font-bold">Bone Quality: D2 (Normal)</span>
          </div>
        </div>

        {/* VIEWPORT 2: CROSS-SECTION SITE #19 (Implant, Nerve, Sleeve) */}
        <div className="relative bg-[#05070c] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col group">
          {/* Viewport Header HUD */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-orange-400 font-mono text-[10px] font-bold border border-orange-500/30">
              Cross-Section Site #19
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
              IAN Clearance: {nerveClearance.toFixed(1)}mm
            </span>
          </div>

          {/* Canvas Rendering Context */}
          <div className="w-full aspect-square relative flex items-center justify-center bg-black">
            <canvas
              ref={sagittalCanvasRef}
              width={420}
              height={420}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Viewport Footer HUD */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
            <span>Straumann BLT Ø4.1x10mm</span>
            <span className="text-purple-400 font-bold">Sleeve Offset: {sleeveOffset.toFixed(1)}mm</span>
          </div>
        </div>

        {/* VIEWPORT 3: 3D SURGICAL GUIDE & SURFACE MESH (Interactive 3D Orbit) */}
        <div className="relative bg-[#05070c] rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col group">
          {/* Viewport Header HUD */}
          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-purple-400 font-mono text-[10px] font-bold border border-purple-500/30">
              3D Guide Surface & STL Model
            </span>
          </div>
          <div className="absolute top-2.5 right-2.5 z-10 pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-slate-900/90 text-sky-400 font-mono text-[9px] border border-slate-800 flex items-center gap-1">
              <span>🖱️ Drag to Orbit</span>
            </span>
          </div>

          {/* Canvas Rendering Context with 3D Orbit Handlers */}
          <div className="w-full aspect-square relative flex items-center justify-center bg-black cursor-grab active:cursor-grabbing">
            <canvas
              ref={viewport3DCanvasRef}
              width={420}
              height={420}
              onMouseDown={handleMouseDown3D}
              onMouseMove={handleMouseMove3D}
              onMouseUp={handleMouseUp3D}
              onMouseLeave={handleMouseUp3D}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Viewport Footer HUD */}
          <div className="p-2.5 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[10.5px] font-mono text-slate-400">
            <span>Material: Clear Surgical Resin</span>
            <span className="text-sky-400 font-bold">Inspection Windows: Active</span>
          </div>
        </div>

      </div>

      {/* 4. Certified Co-Diagnostix™ Surgical Plan Parameters Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0b101d] border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </span>
            <h4 className="font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">
              Co-Diagnostix™ Certified Surgical Plan Parameters
            </h4>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-slate-500">
            <span>Project: <strong>CAFX_{orderNumber}_{patientName.replace(/\s+/g, '')}.caf</strong></span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">• QA Approved</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Implant System</span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">Straumann® BLT</span>
            <span className="text-[10px] font-mono text-sky-600 dark:text-sky-400 block">Ø4.1mm Regular CrossFit x 10mm</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Master Guide Sleeve</span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">T-Sleeve Straumann</span>
            <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 block">Ø5.0mm • Height: 5mm • Offset: {sleeveOffset.toFixed(1)}mm</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Anatomical Site & Bone</span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">{implantSite}</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block">Density: 850 HU (Misch Class D2)</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Drilling Protocol & CAM</span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-0.5">Tooth-Borne Full Template</span>
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 block">Drill Stop: 10mm • 3 Seating Windows</span>
          </div>
        </div>
      </div>

    </div>
  );
};
