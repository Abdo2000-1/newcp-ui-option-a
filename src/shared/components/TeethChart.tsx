import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, RotateCcw, Smile, Zap, Info, X, Activity, Filter, Layers, Sparkles,
  Crown, Disc, GitFork, Gem, XCircle, Target, Pin, Ruler, ChevronsUp,
  Component, Tag, MapPin, Search, AlertTriangle, Clock, History, Triangle,
  Split, Wand2, Eye
} from 'lucide-react';
import { useAppConfig } from '@/app/providers/contexts/ConfigContext';

export type ToothSystem = 'universal' | 'fdi';

export type DentalServiceId = 
  | 'sg'        // Surgical Guide
  | 'tp'        // Treatment Plan (Co-Diagnostix / Prosthetically Driven)
  | 'conv'      // DICOM Conversion
  | 'mod'       // Model Work
  | 'rep'       // Radiology Report
  | 'restTemp'  // Temp Restoration (Provisional PMMA)
  | 'restFinal' // Final Restoration (Zirconia / Ceramic / Hybrid)
  | 'vr'        // Virtual Reality & Digital Smile Design
  | 'ortho';    // Orthodontics & ISmile Aligners

export type RestorationType = 
  | 'crown' 
  | 'bridge' 
  | 'veneer' 
  | 'implant' 
  | 'inlay' 
  | 'extraction'
  | 'sleeve'
  | 'anchor'
  | 'bone_reduction'
  | 'sinus_lift'
  | 'nerve_trace'
  | 'segmentation'
  | 'die_prep'
  | 'analog'
  | 'impacted'
  | 'pathology'
  | 'temp_crown'
  | 'temp_bridge'
  | 'attachment'
  | 'ipr'
  | 'smile_design';

export type ArchFocus = 'maxilla' | 'mandible' | 'dual' | 'both' | 'upper' | 'lower';

export interface ToothOdontoData {
  universal: number;
  fdi: number;
  code: string;
  name: string;
  category: 'molar' | 'premolar' | 'canine' | 'incisor_lat' | 'incisor_cen';
  arch: 'upper' | 'lower';
  quadrant: 'UR' | 'UL' | 'LL' | 'LR';
  isAnterior: boolean;
}

export const ODONTO_DATABASE: ToothOdontoData[] = [
  // --- UPPER ARCH (Maxillary Arch) ---
  // Patient Right (UR: 1 to 8) - Viewer's Left
  { universal: 1,  fdi: 18, code: '18', name: 'Upper Right 3rd Molar (Wisdom)', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false },
  { universal: 2,  fdi: 17, code: '17', name: 'Upper Right 2nd Molar', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false },
  { universal: 3,  fdi: 16, code: '16', name: 'Upper Right 1st Molar', category: 'molar', arch: 'upper', quadrant: 'UR', isAnterior: false },
  { universal: 4,  fdi: 15, code: '15', name: 'Upper Right 2nd Premolar', category: 'premolar', arch: 'upper', quadrant: 'UR', isAnterior: false },
  { universal: 5,  fdi: 14, code: '14', name: 'Upper Right 1st Premolar', category: 'premolar', arch: 'upper', quadrant: 'UR', isAnterior: false },
  { universal: 6,  fdi: 13, code: '13', name: 'Upper Right Canine (Cuspid)', category: 'canine', arch: 'upper', quadrant: 'UR', isAnterior: true },
  { universal: 7,  fdi: 12, code: '12', name: 'Upper Right Lateral Incisor', category: 'incisor_lat', arch: 'upper', quadrant: 'UR', isAnterior: true },
  { universal: 8,  fdi: 11, code: '11', name: 'Upper Right Central Incisor', category: 'incisor_cen', arch: 'upper', quadrant: 'UR', isAnterior: true },

  // Patient Left (UL: 9 to 16) - Viewer's Right
  { universal: 9,  fdi: 21, code: '21', name: 'Upper Left Central Incisor', category: 'incisor_cen', arch: 'upper', quadrant: 'UL', isAnterior: true },
  { universal: 10, fdi: 22, code: '22', name: 'Upper Left Lateral Incisor', category: 'incisor_lat', arch: 'upper', quadrant: 'UL', isAnterior: true },
  { universal: 11, fdi: 23, code: '23', name: 'Upper Left Canine (Cuspid)', category: 'canine', arch: 'upper', quadrant: 'UL', isAnterior: true },
  { universal: 12, fdi: 24, code: '24', name: 'Upper Left 1st Premolar', category: 'premolar', arch: 'upper', quadrant: 'UL', isAnterior: false },
  { universal: 13, fdi: 25, code: '25', name: 'Upper Left 2nd Premolar', category: 'premolar', arch: 'upper', quadrant: 'UL', isAnterior: false },
  { universal: 14, fdi: 26, code: '26', name: 'Upper Left 1st Molar', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false },
  { universal: 15, fdi: 27, code: '27', name: 'Upper Left 2nd Molar', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false },
  { universal: 16, fdi: 28, code: '28', name: 'Upper Left 3rd Molar (Wisdom)', category: 'molar', arch: 'upper', quadrant: 'UL', isAnterior: false },

  // --- LOWER ARCH (Mandibular Arch) ---
  // Patient Right (LR: 32 to 25) - Viewer's Left
  { universal: 32, fdi: 48, code: '48', name: 'Lower Right 3rd Molar (Wisdom)', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false },
  { universal: 31, fdi: 47, code: '47', name: 'Lower Right 2nd Molar', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false },
  { universal: 30, fdi: 46, code: '46', name: 'Lower Right 1st Molar', category: 'molar', arch: 'lower', quadrant: 'LR', isAnterior: false },
  { universal: 29, fdi: 45, code: '45', name: 'Lower Right 2nd Premolar', category: 'premolar', arch: 'lower', quadrant: 'LR', isAnterior: false },
  { universal: 28, fdi: 44, code: '44', name: 'Lower Right 1st Premolar', category: 'premolar', arch: 'lower', quadrant: 'LR', isAnterior: false },
  { universal: 27, fdi: 43, code: '43', name: 'Lower Right Canine (Cuspid)', category: 'canine', arch: 'lower', quadrant: 'LR', isAnterior: true },
  { universal: 26, fdi: 42, code: '42', name: 'Lower Right Lateral Incisor', category: 'incisor_lat', arch: 'lower', quadrant: 'LR', isAnterior: true },
  { universal: 25, fdi: 41, code: '41', name: 'Lower Right Central Incisor', category: 'incisor_cen', arch: 'lower', quadrant: 'LR', isAnterior: true },

  // Patient Left (LL: 24 to 17) - Viewer's Right
  { universal: 24, fdi: 31, code: '31', name: 'Lower Left Central Incisor', category: 'incisor_cen', arch: 'lower', quadrant: 'LL', isAnterior: true },
  { universal: 23, fdi: 32, code: '32', name: 'Lower Left Lateral Incisor', category: 'incisor_lat', arch: 'lower', quadrant: 'LL', isAnterior: true },
  { universal: 22, fdi: 33, code: '33', name: 'Lower Left Canine (Cuspid)', category: 'canine', arch: 'lower', quadrant: 'LL', isAnterior: true },
  { universal: 21, fdi: 34, code: '34', name: 'Lower Left 1st Premolar', category: 'premolar', arch: 'lower', quadrant: 'LL', isAnterior: false },
  { universal: 20, fdi: 35, code: '35', name: 'Lower Left 2nd Premolar', category: 'premolar', arch: 'lower', quadrant: 'LL', isAnterior: false },
  { universal: 19, fdi: 36, code: '36', name: 'Lower Left 1st Molar', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false },
  { universal: 18, fdi: 37, code: '37', name: 'Lower Left 2nd Molar', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false },
  { universal: 17, fdi: 38, code: '38', name: 'Lower Left 3rd Molar (Wisdom)', category: 'molar', arch: 'lower', quadrant: 'LL', isAnterior: false },
];

export type ProcedureIconName =
  | 'crown'
  | 'bridge'
  | 'veneer'
  | 'implant'
  | 'inlay'
  | 'extraction'
  | 'sleeve'
  | 'anchor'
  | 'bone_reduction'
  | 'sinus_lift'
  | 'nerve_trace'
  | 'segmentation'
  | 'die_prep'
  | 'analog'
  | 'impacted'
  | 'pathology'
  | 'temp_crown'
  | 'temp_bridge'
  | 'attachment'
  | 'ipr'
  | 'smile_design';

export function ProcedureIcon({ type, className = "w-3.5 h-3.5" }: { type: RestorationType | string; className?: string }) {
  switch (type) {
    case 'crown':
      return <Crown className={className} />;
    case 'bridge':
      return <GitFork className={className} />;
    case 'veneer':
      return <Sparkles className={className} />;
    case 'implant':
      return <Disc className={className} />;
    case 'inlay':
      return <Gem className={className} />;
    case 'extraction':
      return <XCircle className={className} />;
    case 'sleeve':
      return <Target className={className} />;
    case 'anchor':
      return <Pin className={className} />;
    case 'bone_reduction':
      return <Ruler className={className} />;
    case 'sinus_lift':
      return <ChevronsUp className={className} />;
    case 'nerve_trace':
      return <Activity className={className} />;
    case 'segmentation':
      return <Layers className={className} />;
    case 'die_prep':
      return <Tag className={className} />;
    case 'analog':
      return <MapPin className={className} />;
    case 'impacted':
      return <Search className={className} />;
    case 'pathology':
      return <AlertTriangle className={className} />;
    case 'temp_crown':
      return <Clock className={className} />;
    case 'temp_bridge':
      return <History className={className} />;
    case 'attachment':
      return <Triangle className={className} />;
    case 'ipr':
      return <Split className={className} />;
    case 'smile_design':
      return <Wand2 className={className} />;
    default:
      return <Component className={className} />;
  }
}

export const TOOTH_DATABASE = ODONTO_DATABASE;

export const RESTORATION_TYPES: {
  id: RestorationType;
  label: string;
  labelAr?: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  description?: string;
  serviceCategories?: DentalServiceId[];
}[] = [
  // --- Restorative: Crowns, Bridges, Inlays (Azure / Cyan Family) ---
  { id: 'crown', label: 'Crown', labelAr: 'تاج كامل', color: '#06b6d4', textColor: 'text-cyan-600 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-950/40', borderColor: 'border-cyan-500', serviceCategories: ['tp', 'restFinal', 'vr'] },
  { id: 'bridge', label: 'Bridge Unit', labelAr: 'جسر أسنان', color: '#0284c7', textColor: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-950/40', borderColor: 'border-sky-500', serviceCategories: ['tp', 'restFinal'] },
  { id: 'inlay', label: 'Inlay / Onlay', labelAr: 'حشوة مصبوبة', color: '#0891b2', textColor: 'text-cyan-700 dark:text-cyan-300', bgColor: 'bg-cyan-100/50 dark:bg-cyan-900/40', borderColor: 'border-cyan-600', serviceCategories: ['restFinal'] },

  // --- Cosmetic & Aesthetic (Purple / Lavender Family) ---
  { id: 'veneer', label: 'Veneer', labelAr: 'عدسة فينير', color: '#a855f7', textColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/40', borderColor: 'border-purple-500', serviceCategories: ['tp', 'restFinal', 'vr'] },
  { id: 'smile_design', label: 'Smile Design', labelAr: 'تصميم الابتسامة DSD', color: '#c084fc', textColor: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100/50 dark:bg-purple-900/40', borderColor: 'border-purple-400', serviceCategories: ['vr'] },

  // --- Provisionals (Indigo / Royal Family) ---
  { id: 'temp_crown', label: 'Temp Crown', labelAr: 'تاج مؤقت PMMA', color: '#6366f1', textColor: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-950/40', borderColor: 'border-indigo-500', serviceCategories: ['restTemp'] },
  { id: 'temp_bridge', label: 'Temp Bridge', labelAr: 'جسر مؤقت', color: '#4f46e5', textColor: 'text-indigo-700 dark:text-indigo-300', bgColor: 'bg-indigo-100/50 dark:bg-indigo-900/40', borderColor: 'border-indigo-600', serviceCategories: ['restTemp'] },

  // --- Surgical & Guided Implantology (Gold, Amber, Orange, Coral) ---
  { id: 'implant', label: 'Implant', labelAr: 'زرعة تيتانيوم', color: '#f59e0b', textColor: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-950/40', borderColor: 'border-amber-500', serviceCategories: ['sg', 'tp', 'conv'] },
  { id: 'sleeve', label: 'Guide Sleeve', labelAr: 'كم توجيه جراحي', color: '#ea580c', textColor: 'text-orange-600 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-950/40', borderColor: 'border-orange-500', serviceCategories: ['sg'] },
  { id: 'anchor', label: 'Anchor Pin', labelAr: 'مسمار تثبيت الدليل', color: '#c2410c', textColor: 'text-orange-800 dark:text-orange-300', bgColor: 'bg-orange-100/50 dark:bg-orange-900/40', borderColor: 'border-orange-700', serviceCategories: ['sg'] },
  { id: 'bone_reduction', label: 'Bone Reduction', labelAr: 'تخفيض عظمي', color: '#e11d48', textColor: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-950/40', borderColor: 'border-rose-500', serviceCategories: ['sg'] },
  { id: 'sinus_lift', label: 'Sinus Lift', labelAr: 'رفع الجيب الفكي', color: '#14b8a6', textColor: 'text-teal-600 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-950/40', borderColor: 'border-teal-500', serviceCategories: ['tp', 'rep'] },
  { id: 'nerve_trace', label: 'IAN Safety Zone', labelAr: 'مسار العصب الفكي', color: '#fb923c', textColor: 'text-orange-500 dark:text-orange-300', bgColor: 'bg-orange-50/80 dark:bg-orange-950/30', borderColor: 'border-orange-400', serviceCategories: ['tp', 'conv'] },

  // --- Pathology, Missing & Diagnostic (Ruby, Red, Pink) ---
  { id: 'extraction', label: 'Missing / Pontic', labelAr: 'سن مفقود / قلع', color: '#be123c', textColor: 'text-rose-700 dark:text-rose-300', bgColor: 'bg-rose-100/60 dark:bg-rose-950/50', borderColor: 'border-rose-600', serviceCategories: ['sg', 'tp', 'conv', 'mod', 'rep', 'restTemp', 'restFinal', 'ortho'] },
  { id: 'pathology', label: 'Pathology / Radiolucency', labelAr: 'آفة ذروية / فحص', color: '#dc2626', textColor: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/40', borderColor: 'border-red-600', serviceCategories: ['rep'] },
  { id: 'impacted', label: 'Impacted Tooth', labelAr: 'سن مطمور', color: '#db2777', textColor: 'text-pink-600 dark:text-pink-400', bgColor: 'bg-pink-50 dark:bg-pink-950/40', borderColor: 'border-pink-500', serviceCategories: ['rep'] },

  // --- Model Work & CAD 3D (Emerald, Lime, Violet) ---
  { id: 'die_prep', label: 'Removable Die', labelAr: 'سن مجهز متحرك', color: '#10b981', textColor: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-950/40', borderColor: 'border-emerald-500', serviceCategories: ['mod'] },
  { id: 'analog', label: 'Implant Analog', labelAr: 'أنالوج في النموذج', color: '#84cc16', textColor: 'text-lime-600 dark:text-lime-400', bgColor: 'bg-lime-50 dark:bg-lime-950/40', borderColor: 'border-lime-500', serviceCategories: ['mod'] },
  { id: 'segmentation', label: 'Segmentation ROI', labelAr: 'منطقة استخلاص 3D', color: '#7c3aed', textColor: 'text-violet-600 dark:text-violet-400', bgColor: 'bg-violet-50 dark:bg-violet-950/40', borderColor: 'border-violet-500', serviceCategories: ['conv'] },

  // --- Orthodontics & Clear Aligners (Jade Mint, Fuchsia) ---
  { id: 'attachment', label: 'Aligner Attachment', labelAr: 'أتاشمنت تقويم', color: '#059669', textColor: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100/50 dark:bg-emerald-900/40', borderColor: 'border-emerald-600', serviceCategories: ['ortho'] },
  { id: 'ipr', label: 'IPR Contact', labelAr: 'برد مابين الأسنان', color: '#d946ef', textColor: 'text-fuchsia-600 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/40', borderColor: 'border-fuchsia-500', serviceCategories: ['ortho'] },
];

export const SERVICE_PROCEDURES_MAP: Record<string, RestorationType[]> = {
  sg: ['implant', 'sleeve', 'anchor', 'bone_reduction', 'extraction'],
  tp: ['implant', 'crown', 'bridge', 'veneer', 'sinus_lift', 'nerve_trace', 'extraction'],
  conv: ['segmentation', 'implant', 'nerve_trace', 'extraction'],
  mod: ['die_prep', 'analog', 'extraction'],
  rep: ['impacted', 'pathology', 'sinus_lift', 'extraction'],
  restTemp: ['temp_crown', 'temp_bridge', 'extraction'],
  restFinal: ['crown', 'bridge', 'veneer', 'inlay', 'extraction'],
  vr: ['smile_design', 'veneer', 'crown', 'extraction'],
  ortho: ['attachment', 'ipr', 'extraction']
};

export const SERVICE_METADATA: Record<string, { name: string; nameAr: string; code: string }> = {
  sg: { name: 'Surgical Guide (SG)', nameAr: 'دليل جراحي', code: 'SG' },
  tp: { name: 'Treatment Plan (TP)', nameAr: 'خطة علاجية', code: 'TP' },
  conv: { name: 'DICOM Conversion', nameAr: 'تحويل DICOM', code: 'CONV' },
  mod: { name: 'Model Work (MOD)', nameAr: 'نماذج طباعة', code: 'MOD' },
  rep: { name: 'Radiology Report', nameAr: 'تقرير أشعة', code: 'RAD' },
  restTemp: { name: 'Temp Restoration', nameAr: 'تركيبات مؤقتة', code: 'TEMP' },
  restFinal: { name: 'Final Restoration', nameAr: 'تركيبات نهائية', code: 'REST' },
  vr: { name: 'Virtual Reality VR', nameAr: 'واقع افتراضي وتصميم', code: 'VR' },
  ortho: { name: 'Orthodontics & ISmile', nameAr: 'تقويم أسنان وقوالب', code: 'ISMILE' }
};

export function getProceduresForServices(
  serviceIds?: string[],
  customServiceMap?: Record<string, string[]>
): typeof RESTORATION_TYPES {
  if (!serviceIds || serviceIds.length === 0 || serviceIds.includes('all')) {
    return RESTORATION_TYPES;
  }

  const allowedIds = new Set<string>();
  const activeMap = customServiceMap || SERVICE_PROCEDURES_MAP;
  serviceIds.forEach(srv => {
    const list = activeMap[srv];
    if (list) {
      list.forEach(item => allowedIds.add(item));
    }
  });

  if (allowedIds.size === 0) {
    return RESTORATION_TYPES;
  }

  return RESTORATION_TYPES.filter(r => allowedIds.has(r.id));
}

/**
 * Maps any tooth 1..32 to its master anatomical base shape (1..8 for upper, 25..32 for lower)
 */
function getBaseToothNumber(num: number): number {
  if (num >= 1 && num <= 8) return num;
  if (num >= 9 && num <= 16) return 17 - num; // 9->8, 10->7, ... 16->1
  if (num >= 25 && num <= 32) return num;
  if (num >= 17 && num <= 24) return 49 - num; // 24->25, 23->26, ... 17->32
  return 8;
}

/**
 * Hand-drawn Clinical Dental Anatomy Silhouette
 * EXACT 1:1 match to the user reference sketch:
 * - Upper teeth (1-16): roots reach UP, crowns point DOWN towards occlusal line.
 *   - Molars have 3 distinct roots (2 outer buccal + 1 center vertical palatal root) and 2 rounded occlusal lobes.
 *   - Premolars have roots curving distally and oval crowns.
 *   - Canines are tallest with towering roots and sharp cusps.
 *   - Incisors have broad shovel crowns.
 * - Lower teeth (32-17): crowns at TOP with occlusal fissures, roots reach DOWN.
 *   - Molars have 2 distinct wishbone roots with a wide U-furcation arch.
 *   - Canines have the deepest root and pointed cusp.
 *   - Premolars have single tapered roots.
 *   - Incisors have slender straight roots.
 */
function ClinicalToothSilhouette({
  toothNumber,
  isSelected,
  restoration,
}: {
  toothNumber: number;
  isSelected: boolean;
  restoration?: RestorationType;
}) {
  const resInfo = RESTORATION_TYPES.find(r => r.id === restoration);
  const strokeColor = isSelected ? (resInfo?.color || '#00d8fe') : 'currentColor';
  const crownFill = isSelected ? (resInfo ? `${resInfo.color}55` : 'rgba(0,216,254,0.35)') : 'none';
  const isImplant = Boolean(isSelected && (restoration === 'implant' || restoration === 'analog'));
  const isExtraction = Boolean(isSelected && restoration === 'extraction');
  const isSleeve = Boolean(isSelected && restoration === 'sleeve');
  const isAttachment = Boolean(isSelected && restoration === 'attachment');
  const isAnchor = Boolean(isSelected && restoration === 'anchor');
  const isSinus = Boolean(isSelected && restoration === 'sinus_lift');
  const isNerve = Boolean(isSelected && restoration === 'nerve_trace');
  const isBoneReduction = Boolean(isSelected && restoration === 'bone_reduction');

  const isUpper = toothNumber >= 1 && toothNumber <= 16;
  const isLeftQuadrant = (toothNumber >= 9 && toothNumber <= 16) || (toothNumber >= 17 && toothNumber <= 24);
  const baseNumber = getBaseToothNumber(toothNumber);

  const renderAnatomy = () => {
    switch (baseNumber) {
      // ==============================================================
      // UPPER TEETH (Crown points DOWN towards midline, Roots reach UP)
      // ==============================================================
      case 8: // Central Incisor: Straight conical root, broad shovel crown
        return (
          <g>
            {!isImplant && (
              <path
                d="M 15 52 C 16 38, 20 24, 24 14 C 25 12, 26 12, 27 14 C 31 24, 34 38, 35 52"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
            <path d="M 15 52 C 20 49, 30 49, 35 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 15 52 C 13 62, 13 74, 15 82 C 17 84, 33 84, 35 82 C 37 74, 37 62, 35 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
          </g>
        );

      case 7: // Lateral Incisor: Slender root curving distally
        return (
          <g>
            {!isImplant && (
              <path
                d="M 17 52 C 17 40, 18 28, 21 16 C 22 14, 25 14, 27 17 C 29 28, 32 40, 33 52"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
            <path d="M 17 52 C 21 49, 29 49, 33 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 17 52 C 15 62, 15 74, 17 82 C 19 84, 31 84, 33 82 C 35 74, 35 62, 33 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
          </g>
        );

      case 6: // Canine: Tallest tooth, towering root reaching y=4, sharp cusp at bottom
        return (
          <g>
            {!isImplant && (
              <path
                d="M 16 50 C 18 34, 21 16, 24 4 C 25 3, 26 3, 27 4 C 30 16, 33 34, 34 50"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
            <path d="M 16 50 C 21 47, 29 47, 34 50" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 16 50 C 14 62, 15 72, 25 84 C 35 72, 36 62, 34 50 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <line x1="25" y1="52" x2="25" y2="80" stroke={strokeColor} strokeWidth="0.8" opacity="0.4" />
          </g>
        );

      case 5: // 1st Premolar: Root curves distally
      case 4: // 2nd Premolar
        return (
          <g>
            {!isImplant && (
              <path
                d="M 16 52 C 15 40, 17 26, 22 16 C 24 14, 27 14, 29 17 C 31 26, 33 40, 34 52"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
            <path d="M 16 52 C 21 49, 29 49, 34 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 15 52 C 12 62, 13 74, 18 82 C 21 84, 29 84, 32 82 C 37 74, 38 62, 35 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
          </g>
        );

      case 3: // 1st Molar: 3 roots (2 outer buccal + 1 vertical palatal in center cleft)
        return (
          <g>
            {!isImplant && (
              <g stroke={strokeColor} strokeWidth={isSelected ? '2' : '1.5'} fill="none">
                {/* Center Palatal Root rising between outer roots */}
                <path d="M 21 42 C 22 26, 24 12, 25.5 10 C 27 12, 29 26, 30 42" />
                {/* Outer Left Buccal Root */}
                <path d="M 8 52 C 7 38, 9 24, 12 16 C 14 16, 16 22, 17 34 C 18 42, 20 46, 22 48" />
                {/* Outer Right Buccal Root */}
                <path d="M 29 48 C 31 46, 33 42, 34 34 C 35 22, 37 16, 39 16 C 42 24, 44 38, 43 52" />
              </g>
            )}
            <path d="M 8 52 C 18 49, 33 49, 43 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {/* Wide crown with two distinct rounded lobes at bottom */}
            <path
              d="M 8 52 C 6 63, 8 75, 14 82 C 17 84, 22 82, 25.5 78 C 29 82, 34 84, 37 82 C 43 75, 45 63, 43 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <line x1="25.5" y1="68" x2="25.5" y2="78" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
          </g>
        );

      case 2: // 2nd Molar: 3 roots
        return (
          <g>
            {!isImplant && (
              <g stroke={strokeColor} strokeWidth={isSelected ? '2' : '1.5'} fill="none">
                <path d="M 21 42 C 22 28, 24 14, 25.5 12 C 27 14, 29 28, 30 42" />
                <path d="M 9 52 C 8 39, 10 25, 13 18 C 15 18, 17 24, 18 35 C 19 42, 20 46, 22 48" />
                <path d="M 29 48 C 31 46, 32 42, 33 35 C 34 24, 36 18, 38 18 C 41 25, 43 39, 42 52" />
              </g>
            )}
            <path d="M 9 52 C 19 49, 32 49, 42 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 9 52 C 7 63, 9 75, 15 82 C 18 84, 22 82, 25.5 78 C 29 82, 33 84, 36 82 C 42 75, 44 63, 42 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <line x1="25.5" y1="68" x2="25.5" y2="78" stroke={strokeColor} strokeWidth="1" strokeLinecap="round" />
          </g>
        );

      case 1: // 3rd Molar: Converging roots
        return (
          <g>
            {!isImplant && (
              <path
                d="M 11 52 C 10 40, 12 26, 16 18 C 18 18, 20 26, 22 36 C 24 42, 27 42, 29 36 C 31 26, 33 18, 35 18 C 39 26, 41 40, 40 52"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
            <path d="M 11 52 C 20 49, 31 49, 40 52" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            <path
              d="M 11 52 C 9 63, 11 74, 16 81 C 19 83, 23 81, 25.5 78 C 28 81, 32 83, 35 81 C 40 74, 42 63, 40 52 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
          </g>
        );

      // ==============================================================
      // LOWER TEETH (Crown at top facing midline, Roots reach DOWN)
      // ==============================================================
      case 25: // Central Incisor: Narrow flat crown, slender straight root
        return (
          <g>
            <path
              d="M 18 44 C 17 34, 17 24, 19 16 C 20 14, 30 14, 31 16 C 33 24, 33 34, 32 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path d="M 18 44 C 22 47, 28 47, 32 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 18 44 C 18 58, 21 73, 24 85 C 25 86, 26 86, 27 85 C 29 73, 32 58, 32 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 26: // Lateral Incisor
        return (
          <g>
            <path
              d="M 17 44 C 16 34, 16 23, 18 15 C 19 13, 31 13, 32 15 C 34 23, 34 34, 33 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path d="M 17 44 C 22 47, 28 47, 33 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 17 44 C 17 58, 20 74, 24 87 C 25 88, 26 88, 27 87 C 30 74, 33 58, 33 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 27: // Canine: Longest lower tooth, sharp cusp at top, deepest root down to y=95
        return (
          <g>
            <path
              d="M 16 44 C 14 33, 16 22, 25 8 C 34 22, 36 33, 34 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <line x1="25" y1="10" x2="25" y2="40" stroke={strokeColor} strokeWidth="0.8" opacity="0.4" />
            <path d="M 16 44 C 21 47, 29 47, 34 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 16 44 C 17 60, 21 80, 24 95 C 25 96, 26 96, 27 95 C 29 80, 33 60, 34 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 28: // 1st Premolar
      case 29: // 2nd Premolar
        return (
          <g>
            <path
              d="M 15 44 C 12 34, 14 22, 19 16 C 22 14, 28 14, 31 16 C 36 22, 38 34, 35 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path d="M 15 44 C 20 47, 29 47, 35 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 15 44 C 16 57, 19 72, 24 82 C 25 83, 26 83, 27 82 C 31 72, 34 57, 35 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 30: // 1st Molar: Wide crown with occlusal fissures, 2 BIFURCATED WISHBONE ROOTS with U-furcation
        return (
          <g>
            <path
              d="M 8 44 C 6 34, 7 22, 13 16 C 17 12, 21 14, 25 17 C 28 14, 32 12, 36 16 C 42 22, 43 34, 41 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path
              d="M 25 17 L 25 26 C 21 26, 16 29, 14 32 M 25 26 C 29 26, 34 29, 36 32"
              stroke={strokeColor}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 8 44 C 18 47, 31 47, 41 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {/* TWO WISHBONE ROOTS WITH U-FURCATION ARCH */}
            {!isImplant && (
              <path
                d="M 8 44 C 8 58, 10 72, 13 84 C 15 85, 17 84, 18 80 C 19 72, 21 62, 22 54 C 23 50, 27 50, 28 54 C 29 62, 31 72, 32 80 C 33 84, 35 85, 37 84 C 40 72, 41 58, 41 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 31: // 2nd Molar: 2 roots with arch
        return (
          <g>
            <path
              d="M 9 44 C 7 34, 8 22, 14 16 C 18 13, 21 15, 25 17 C 28 15, 31 13, 35 16 C 41 22, 42 34, 40 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path
              d="M 25 17 L 25 26 C 21 26, 17 29, 15 32 M 25 26 C 29 26, 33 29, 35 32"
              stroke={strokeColor}
              strokeWidth="1"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 9 44 C 19 47, 30 47, 40 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 9 44 C 9 58, 11 71, 14 83 C 16 84, 17 83, 18 79 C 19 71, 21 61, 22 54 C 23 51, 27 51, 28 54 C 29 61, 31 71, 32 79 C 33 83, 34 84, 36 83 C 38 71, 40 58, 40 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      case 32: // 3rd Molar: Wisdom
        return (
          <g>
            <path
              d="M 11 44 C 9 34, 10 23, 16 17 C 19 15, 22 16, 25 18 C 27 16, 30 15, 33 17 C 39 23, 40 34, 38 44 Z"
              stroke={strokeColor}
              strokeWidth={isSelected ? '2.2' : '1.6'}
              fill={crownFill}
            />
            <path d="M 11 44 C 20 47, 29 47, 38 44" stroke={strokeColor} strokeWidth="1.2" opacity="0.8" fill="none" />
            {!isImplant && (
              <path
                d="M 11 44 C 10 56, 11 69, 14 78 C 16 79, 18 78, 19 74 C 20 66, 21 58, 22 54 C 23 52, 27 52, 28 54 C 29 58, 30 66, 31 74 C 32 78, 34 79, 36 78 C 38 69, 39 56, 38 44"
                stroke={strokeColor}
                strokeWidth={isSelected ? '2' : '1.5'}
                fill="none"
              />
            )}
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg viewBox="0 0 50 100" className="w-full h-full overflow-visible text-slate-900 dark:text-slate-100" fill="none">
      <g opacity={isExtraction ? 0.35 : 1}>
        {/* If tooth is in left quadrant, mirror horizontally across center x=25 */}
        {isLeftQuadrant ? (
          <g transform="translate(50, 0) scale(-1, 1)">
            {renderAnatomy()}
          </g>
        ) : (
          renderAnatomy()
        )}

        {/* TITANIUM IMPLANT SCREW FIXTURE */}
        {isImplant && (
          isUpper ? (
            /* Upper Implant (Points UP into alveolar bone) */
            <g stroke="#f59e0b" strokeWidth="1.8" fill="none">
              <path d="M 22 10 L 28 10 L 29 50 L 21 50 Z" fill="#f59e0b" fillOpacity="0.15" />
              <line x1="25" y1="8" x2="25" y2="50" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="18" y1="16" x2="32" y2="19" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="23" x2="32" y2="26" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="30" x2="32" y2="33" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="37" x2="32" y2="40" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="44" x2="32" y2="47" strokeWidth="2" strokeLinecap="round" />
              <polygon points="25,5 20,11 30,11" fill="#f59e0b" />
              <rect x="20" y="48" width="10" height="4" rx="1" fill="#f59e0b" />
            </g>
          ) : (
            /* Lower Implant (Points DOWN into mandibular bone) */
            <g stroke="#f59e0b" strokeWidth="1.8" fill="none">
              <path d="M 21 46 L 29 46 L 28 88 L 22 88 Z" fill="#f59e0b" fillOpacity="0.15" />
              <line x1="25" y1="46" x2="25" y2="90" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="18" y1="52" x2="32" y2="49" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="59" x2="32" y2="56" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="66" x2="32" y2="63" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="73" x2="32" y2="70" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="80" x2="32" y2="77" strokeWidth="2" strokeLinecap="round" />
              <polygon points="25,95 20,89 30,89" fill="#f59e0b" />
              <rect x="20" y="44" width="10" height="4" rx="1" fill="#f59e0b" />
            </g>
          )
        )}
      </g>

      {/* EXTRACTION / MISSING CROSS (Exact surgical X mark) */}
      {isExtraction && (
        <g stroke="#f43f5e" strokeWidth="3" strokeLinecap="round">
          <line x1="8" y1="12" x2="42" y2="88" />
          <line x1="42" y1="12" x2="8" y2="88" />
        </g>
      )}

      {/* Surgical Guide Sleeve Ring */}
      {isSleeve && (
        <g stroke="#0284c7" fill="none" strokeWidth="2">
          <circle cx="25" cy={isUpper ? 64 : 26} r="10" strokeDasharray="3 2" />
          <circle cx="25" cy={isUpper ? 64 : 26} r="6" />
        </g>
      )}

      {/* Guide Anchor Pin Marker */}
      {isAnchor && (
        <g fill="#d97706" stroke="#92400e" strokeWidth="1">
          <circle cx="25" cy={isUpper ? 20 : 70} r="4.5" />
          <line x1="25" y1={isUpper ? 24 : 66} x2="25" y2={isUpper ? 42 : 48} stroke="#d97706" strokeWidth="2" />
        </g>
      )}

      {/* Clear Aligner Attachment Bump */}
      {isAttachment && (
        <rect
          x="21"
          y={isUpper ? 60 : 22}
          width="8"
          height="7"
          rx="1.5"
          fill="#10b981"
          stroke="#059669"
          strokeWidth="1.2"
        />
      )}

      {/* Sinus Elevation Indicator */}
      {isSinus && (
        <path
          d={isUpper ? "M 10 18 Q 25 8 40 18" : "M 10 72 Q 25 82 40 72"}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      )}

      {/* Mandibular Nerve Trace Zone */}
      {isNerve && (
        <path
          d={isUpper ? "M 12 14 L 20 22 L 28 14 L 38 22" : "M 12 76 L 20 68 L 28 76 L 38 68"}
          fill="none"
          stroke="#f97316"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}

      {/* Bone Reduction Plateau */}
      {isBoneReduction && (
        <line
          x1="8"
          y1={isUpper ? 46 : 44}
          x2="42"
          y2={isUpper ? 46 : 44}
          stroke="#e11d48"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  );
}

export interface TeethChartProps {
  selected?: number[];
  selectedTeeth?: number[];
  onToggle?: (tooth: number) => void;
  onToggleTooth?: (tooth: number) => void;
  toothRestorations?: Record<number, RestorationType | string>;
  onAssignRestoration?: (tooth: number, type: RestorationType) => void;
  onClearAll?: () => void;
  onSelectionChange?: (selected: number[], restorations: Record<number, RestorationType>) => void;
  readonly?: boolean;
  activeService?: string;
  activeServices?: DentalServiceId[] | string[];
  serviceId?: DentalServiceId | string;
  archFocus?: ArchFocus;
  showToolbar?: boolean;
  className?: string;
}

export const UPPER_ARCH_POSITIONS: Record<number, { left: number; top: number; rot: number }> = {
  1:  { left: 48,  top: 18, rot: 24 },
  2:  { left: 88,  top: 26, rot: 20 },
  3:  { left: 132, top: 36, rot: 16 },
  4:  { left: 180, top: 46, rot: 13 },
  5:  { left: 230, top: 56, rot: 9 },
  6:  { left: 282, top: 64, rot: 6 },
  7:  { left: 332, top: 70, rot: 3 },
  8:  { left: 372, top: 72, rot: 0 },
  9:  { left: 410, top: 72, rot: 0 },
  10: { left: 450, top: 70, rot: -3 },
  11: { left: 500, top: 64, rot: -6 },
  12: { left: 552, top: 56, rot: -9 },
  13: { left: 602, top: 46, rot: -13 },
  14: { left: 650, top: 36, rot: -16 },
  15: { left: 694, top: 26, rot: -20 },
  16: { left: 734, top: 18, rot: -24 },
};

export const LOWER_ARCH_POSITIONS: Record<number, { left: number; top: number; rot: number }> = {
  32: { left: 48,  top: 210, rot: -24 },
  31: { left: 88,  top: 202, rot: -20 },
  30: { left: 132, top: 192, rot: -16 },
  29: { left: 180, top: 182, rot: -13 },
  28: { left: 230, top: 172, rot: -9 },
  27: { left: 282, top: 164, rot: -6 },
  26: { left: 332, top: 158, rot: -3 },
  25: { left: 372, top: 156, rot: 0 },
  24: { left: 410, top: 156, rot: 0 },
  23: { left: 450, top: 158, rot: 3 },
  22: { left: 500, top: 164, rot: 6 },
  21: { left: 552, top: 172, rot: 9 },
  20: { left: 602, top: 182, rot: 13 },
  19: { left: 650, top: 192, rot: 16 },
  18: { left: 694, top: 202, rot: 20 },
  17: { left: 734, top: 210, rot: 24 },
};

export function TeethChart({
  selected,
  selectedTeeth,
  onToggle,
  onToggleTooth,
  toothRestorations = {},
  onAssignRestoration,
  onClearAll,
  onSelectionChange,
  readonly = false,
  activeService,
  activeServices,
  serviceId,
  archFocus = 'dual',
  showToolbar = true,
  className = ''
}: TeethChartProps) {
  const configCtx = useAppConfig();
  const appConfig = configCtx?.config;

  const [viewLayoutMode, setViewLayoutMode] = useState<'grid' | 'anatomical'>('grid');
  const propSelected = selected ?? selectedTeeth;
  const [internalSelected, setInternalSelected] = useState<number[]>(propSelected || []);
  const [localRestorations, setLocalRestorations] = useState<Record<number, RestorationType>>({
    14: 'implant',
    15: 'crown',
    16: 'crown',
    ...(toothRestorations as Record<number, RestorationType>)
  });

  // Normalize incoming service IDs
  const normalizedServices: string[] = useMemo(() => {
    const list: string[] = [];
    if (serviceId) list.push(String(serviceId));
    if (activeService) list.push(String(activeService));
    if (activeServices && Array.isArray(activeServices)) {
      activeServices.forEach(s => {
        if (s && !list.includes(String(s))) list.push(String(s));
      });
    }
    return list;
  }, [serviceId, activeService, activeServices]);

  const [filterByService, setFilterByService] = useState<boolean>(true);
  const effectiveActiveServices = (filterByService && normalizedServices.length > 0)
    ? normalizedServices
    : [];

  const availableProcedures = useMemo(() => {
    return getProceduresForServices(effectiveActiveServices, appConfig?.serviceProcedures);
  }, [effectiveActiveServices, appConfig?.serviceProcedures]);

  // Sync internal selected when external prop changes
  useEffect(() => {
    if (propSelected !== undefined) {
      setInternalSelected(propSelected);
    }
  }, [propSelected]);

  // Synchronize external restorations when provided
  useEffect(() => {
    if (toothRestorations && Object.keys(toothRestorations).length > 0) {
      setLocalRestorations(prev => ({
        ...prev,
        ...(toothRestorations as Record<number, RestorationType>)
      }));
    }
  }, [toothRestorations]);

  const activeSelected = propSelected !== undefined ? propSelected : internalSelected;
  const handleToggle = onToggle ?? onToggleTooth;

  const [system, setSystem] = useState<ToothSystem>('universal');
  const [selectedTool, setSelectedTool] = useState<RestorationType>('crown');
  const [hoveredTooth, setHoveredTooth] = useState<ToothOdontoData | null>(null);
  const [visibleArch, setVisibleArch] = useState<'both' | 'upper' | 'lower'>('both');

  // Grouped procedures for clean enterprise procedure-level summary tags
  const groupedProcedures = useMemo(() => {
    const map: Record<string, number[]> = {};
    activeSelected.forEach((num) => {
      const res = localRestorations[num] || toothRestorations[num] || 'crown';
      if (!map[res]) {
        map[res] = [];
      }
      map[res].push(num);
    });
    // Sort tooth numbers in each group
    Object.keys(map).forEach(key => {
      map[key].sort((a, b) => a - b);
    });
    return map;
  }, [activeSelected, localRestorations, toothRestorations]);

  // Ensure selected tool is valid for the current filtered list
  useEffect(() => {
    if (availableProcedures.length > 0 && !availableProcedures.some(p => p.id === selectedTool)) {
      setSelectedTool(availableProcedures[0].id);
    }
  }, [availableProcedures, selectedTool]);

  // Grouped into the standard 4 quadrants
  const upperRight = ODONTO_DATABASE.filter(t => t.quadrant === 'UR');
  const lowerRight = ODONTO_DATABASE.filter(t => t.quadrant === 'LR');
  const upperLeft  = ODONTO_DATABASE.filter(t => t.quadrant === 'UL');
  const lowerLeft  = ODONTO_DATABASE.filter(t => t.quadrant === 'LL');

  const handleToothClick = (tooth: ToothOdontoData) => {
    if (readonly) return;
    const num = tooth.universal;
    const isAlreadySelected = activeSelected.includes(num);

    if (!isAlreadySelected) {
      // 1. Tooth not selected -> Select it and assign active tool
      const nextSelected = [...activeSelected, num];
      const nextRestorations = { ...localRestorations, [num]: selectedTool };
      setInternalSelected(nextSelected);
      setLocalRestorations(nextRestorations);
      if (onSelectionChange) {
        onSelectionChange(nextSelected, nextRestorations);
      } else {
        handleToggle?.(num);
      }
      onAssignRestoration?.(num, selectedTool);
    } else {
      // 2. Tooth already selected -> Check if clicking with same tool or different tool
      const currentRes = localRestorations[num] || toothRestorations[num] || 'crown';
      if (currentRes === selectedTool) {
        // Same tool clicked again -> Unselect it cleanly!
        const nextSelected = activeSelected.filter(t => t !== num);
        const nextRestorations = { ...localRestorations };
        delete nextRestorations[num];
        setInternalSelected(nextSelected);
        setLocalRestorations(nextRestorations);
        if (onSelectionChange) {
          onSelectionChange(nextSelected, nextRestorations);
        } else {
          handleToggle?.(num);
        }
      } else {
        // Different tool clicked -> Update its category to the new tool without unselecting!
        const nextRestorations = { ...localRestorations, [num]: selectedTool };
        setLocalRestorations(nextRestorations);
        onAssignRestoration?.(num, selectedTool);
        if (onSelectionChange) {
          onSelectionChange(activeSelected, nextRestorations);
        }
      }
    }
  };

  const handleSelectBatch = (type: 'all' | 'both' | 'upper' | 'lower' | 'smile' | 'posteriors' | 'clear') => {
    if (readonly) return;
    if (type === 'clear') {
      const prev = [...activeSelected];
      setInternalSelected([]);
      setLocalRestorations({});
      onClearAll?.();
      onSelectionChange?.([], {});
      if (!onClearAll && !onSelectionChange && handleToggle) {
        prev.forEach(n => handleToggle(n));
      }
      return;
    }

    let targets: ToothOdontoData[] = [];
    if (type === 'all' || type === 'both') targets = ODONTO_DATABASE;
    if (type === 'upper') targets = ODONTO_DATABASE.filter(t => t.arch === 'upper');
    if (type === 'lower') targets = ODONTO_DATABASE.filter(t => t.arch === 'lower');
    if (type === 'smile') targets = ODONTO_DATABASE.filter(t => t.isAnterior);
    if (type === 'posteriors') targets = ODONTO_DATABASE.filter(t => !t.isAnterior);

    const targetNums = targets.map(t => t.universal);
    const allSelected = targetNums.every(n => activeSelected.includes(n));

    let nextSelected: number[];
    let nextRestorations = { ...localRestorations };

    if (allSelected) {
      // Toggle OFF: remove all targetNums
      nextSelected = activeSelected.filter(n => !targetNums.includes(n));
      targetNums.forEach(n => {
        delete nextRestorations[n];
      });
      if (!onSelectionChange && handleToggle) {
        targetNums.forEach(n => {
          if (activeSelected.includes(n)) handleToggle(n);
        });
      }
    } else {
      // Toggle ON: add all targetNums
      nextSelected = Array.from(new Set([...activeSelected, ...targetNums]));
      targetNums.forEach(n => {
        if (!nextRestorations[n]) {
          nextRestorations[n] = selectedTool;
        }
      });
      if (!onSelectionChange && handleToggle) {
        targetNums.forEach(n => {
          if (!activeSelected.includes(n)) handleToggle(n);
        });
      }
    }

    setInternalSelected(nextSelected);
    setLocalRestorations(nextRestorations);
    onSelectionChange?.(nextSelected, nextRestorations);
  };

  /**
   * Anatomical Arch Tooth Renderer:
   * - ZERO rectangular bounding boxes or border rings (conforms strictly to tooth silhouette)
   * - Highlights the tooth silhouette itself with vibrant clinical fill and contour drop-shadow
   * - Ultra-clean minimal number label without visual clutter
   */
  const renderAnatomicalToothCell = (tooth: ToothOdontoData, arch: 'upper' | 'lower') => {
    const isSelected = activeSelected.includes(tooth.universal);
    const assignedRes = isSelected 
      ? ((localRestorations[tooth.universal] || toothRestorations[tooth.universal] || selectedTool) as RestorationType) 
      : undefined;
    const resConfig = assignedRes ? RESTORATION_TYPES.find(r => r.id === assignedRes) : null;
    const displayNum = system === 'universal' ? tooth.universal : tooth.fdi;
    const activeColor = resConfig?.color || '#00d8fe';

    return (
      <div
        key={tooth.universal}
        data-testid={`tooth-${tooth.universal}`}
        onClick={() => handleToothClick(tooth)}
        onMouseEnter={() => setHoveredTooth(tooth)}
        onMouseLeave={() => setHoveredTooth(null)}
        className="group relative flex flex-col items-center justify-center cursor-pointer select-none transition-transform duration-150 hover:scale-115 active:scale-95"
        style={{
          background: 'transparent',
          border: 'none',
          boxShadow: 'none',
          outline: 'none',
        }}
      >
        {/* Upper tooth: clean subtle number above root apex */}
        {arch === 'upper' && (
          <span 
            className="text-[10px] font-mono font-bold leading-none mb-1 transition-colors select-none"
            style={{
              color: isSelected ? activeColor : undefined,
              opacity: isSelected ? 1 : 0.6
            }}
          >
            {displayNum}
          </span>
        )}

        {/* Clinical Tooth Silhouette - highlights tooth boundaries directly */}
        <div 
          className="w-8 sm:w-9 h-14 sm:h-15 flex items-center justify-center transition-all duration-200"
          style={{
            filter: isSelected ? `drop-shadow(0 0 6px ${activeColor})` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))'
          }}
        >
          <ClinicalToothSilhouette
            toothNumber={tooth.universal}
            isSelected={isSelected}
            restoration={assignedRes}
          />
        </div>

        {/* Lower tooth: clean subtle number below root apex */}
        {arch === 'lower' && (
          <span 
            className="text-[10px] font-mono font-bold leading-none mt-1 transition-colors select-none"
            style={{
              color: isSelected ? activeColor : undefined,
              opacity: isSelected ? 1 : 0.6
            }}
          >
            {displayNum}
          </span>
        )}
      </div>
    );
  };

  const renderToothCard = (tooth: ToothOdontoData, arch: 'upper' | 'lower') => {
    const isSelected = activeSelected.includes(tooth.universal);
    const assignedRes = isSelected 
      ? ((localRestorations[tooth.universal] || toothRestorations[tooth.universal] || selectedTool) as RestorationType) 
      : undefined;
    const resConfig = assignedRes ? RESTORATION_TYPES.find(r => r.id === assignedRes) : null;
    const activeColor = resConfig?.color || '#00d8fe';
    const displayNum = system === 'universal' ? tooth.universal : tooth.fdi;

    return (
      <div
        key={tooth.universal}
        data-testid={`tooth-${tooth.universal}`}
        onClick={() => handleToothClick(tooth)}
        onMouseEnter={() => setHoveredTooth(tooth)}
        onMouseLeave={() => setHoveredTooth(null)}
        className="group relative flex flex-col items-center justify-between cursor-pointer select-none transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {/* Upper teeth: Silhouette first, then number directly below it touching occlusal cross */}
        {arch === 'upper' && (
          <>
            <div 
              className="w-full h-22 sm:h-26 flex items-center justify-center transition-all duration-200"
              style={{
                filter: isSelected ? `drop-shadow(0 0 7px ${activeColor})` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))'
              }}
            >
              <ClinicalToothSilhouette
                toothNumber={tooth.universal}
                isSelected={isSelected}
                restoration={assignedRes}
              />
            </div>
            <span
              className={`text-[11px] sm:text-xs font-mono font-bold px-1.5 py-0.5 mt-1 rounded-md transition-all ${
                isSelected
                  ? 'text-white font-black shadow-xs'
                  : 'text-slate-800 dark:text-slate-200 group-hover:text-cyan-500'
              }`}
              style={{
                backgroundColor: isSelected ? activeColor : undefined
              }}
            >
              {displayNum}
            </span>
          </>
        )}

        {/* Lower teeth: Number first touching occlusal cross, then Silhouette below it */}
        {arch === 'lower' && (
          <>
            <span
              className={`text-[11px] sm:text-xs font-mono font-bold px-1.5 py-0.5 mb-1 rounded-md transition-all ${
                isSelected
                  ? 'text-white font-black shadow-xs'
                  : 'text-slate-800 dark:text-slate-200 group-hover:text-cyan-500'
              }`}
              style={{
                backgroundColor: isSelected ? activeColor : undefined
              }}
            >
              {displayNum}
            </span>
            <div 
              className="w-full h-22 sm:h-26 flex items-center justify-center transition-all duration-200"
              style={{
                filter: isSelected ? `drop-shadow(0 0 7px ${activeColor})` : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))'
              }}
            >
              <ClinicalToothSilhouette
                toothNumber={tooth.universal}
                isSelected={isSelected}
                restoration={assignedRes}
              />
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white dark:bg-[#070b14] rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-lg shadow-cyan-950/5 select-none ${className}`}>
      {/* HEADER TOOLBAR */}
      {showToolbar && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight">
                Anatomical Dental Odontogram (Universal 1–32)
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                {activeSelected.length} Selected
              </span>

              {/* Active Prescribed Services Indicators */}
              {normalizedServices.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap ml-1">
                  {normalizedServices.map(srvId => {
                    const srv = SERVICE_METADATA[srvId as DentalServiceId];
                    return (
                      <span
                        key={srvId}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        <Tag className="w-3 h-3 text-indigo-500" />
                        <span>{srv?.name || srvId.toUpperCase()}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Universal Numbering System • Classical 4-Quadrant Anatomical Odontogram Grid.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
            {/* View Layout Mode Switcher (Grid vs Anatomical Mouth Arch) */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewLayoutMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewLayoutMode === 'grid'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Classical 4-Quadrant Dental Odontogram Grid (Default)"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Quadrant Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayoutMode('anatomical')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  viewLayoutMode === 'anatomical'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Realistic Anatomical Mouth Arch (Parabolic Curvature)"
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Anatomical Arch</span>
              </button>
            </div>

            {/* Numbering System Switcher */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSystem('universal')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  system === 'universal'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Universal (1-32)
              </button>
              <button
                type="button"
                onClick={() => setSystem('fdi')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  system === 'fdi'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                FDI (11-48)
              </button>
            </div>

            {/* Clear All */}
            {!readonly && activeSelected.length > 0 && (
              <button
                type="button"
                onClick={() => handleSelectBatch('clear')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/30"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* RESTORATION PALETTE & ARCH VISIBILITY / PRESETS TOGGLE */}
      {!readonly && showToolbar && (
        <div className="py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
          {/* Active Procedure Brush with Medical Lucide SVG Icons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Active Tool:
            </span>
            {availableProcedures.map((res) => {
              const isCurrent = selectedTool === res.id;
              return (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setSelectedTool(res.id)}
                  style={{
                    borderColor: isCurrent ? res.color : undefined
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isCurrent
                      ? `${res.bgColor} ${res.textColor} shadow-xs ring-1 ring-current`
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={res.description}
                >
                  <ProcedureIcon type={res.id} className="w-3.5 h-3.5" />
                  <span>{res.label}</span>
                </button>
              );
            })}

            {/* Toggle show all procedures if filtered */}
            {normalizedServices.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterByService(!filterByService)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline ml-1 cursor-pointer flex items-center gap-1"
              >
                <Filter className="w-3 h-3" />
                <span>{filterByService ? '+ Show All Procedures' : 'Filter to Active Services'}</span>
              </button>
            )}
          </div>

          {/* UNIFIED ARCH VISIBILITY & PRESET ACTIONS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Arch View: Both, Upper, Lower */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5 flex items-center gap-1">
                <Eye className="w-3 h-3 text-slate-400" /> Arch:
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setVisibleArch('both')}
                  className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    visibleArch === 'both'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Display both upper and lower arches"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Both Arches</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleArch('upper')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    visibleArch === 'upper'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Display upper maxilla row only"
                >
                  Upper
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleArch('lower')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    visibleArch === 'lower'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title="Display lower mandible row only"
                >
                  Lower
                </button>
              </div>
            </div>

            {/* Quick Selection Presets */}
            <div className="flex items-center gap-1 ml-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-0.5">
                Presets:
              </span>
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectBatch('smile')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-purple-700 dark:text-purple-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Select Anterior Smile Zone (6-11 & 22-27)"
                >
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span>Smile Zone</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectBatch('posteriors')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Select Posterior Teeth (Molars & Premolars)"
                >
                  <Component className="w-3 h-3 text-slate-400" />
                  <span>Posteriors</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectBatch('both')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Select All Teeth"
                >
                  <Check className="w-3 h-3 text-sky-500" />
                  <span>Select All</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 1: EXACT 4-QUADRANT DENTAL ARCH GRID (Default) */}
      {viewLayoutMode === 'grid' && (
        <div className="py-6 overflow-x-auto">
          <div className="min-w-[700px] max-w-4xl mx-auto space-y-3">
            
            {/* 1. TOP QUADRANT LABELS (Only if Upper or Both visible) */}
            {(visibleArch === 'both' || visibleArch === 'upper') && (
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 px-2 pb-1">
                <div className="flex items-center justify-between pr-2">
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-mono text-[11px] border border-cyan-500/20">
                    UR • Maxillary Right
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">#1 ➔ #8</span>
                </div>
                <div className="flex items-center justify-between pl-2">
                  <span className="text-[10px] font-mono text-slate-400">#9 ➔ #16</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[11px] border border-blue-500/20">
                    UL • Maxillary Left
                  </span>
                </div>
              </div>
            )}

            {/* 2. THE 4-QUADRANT CROSS CANVAS */}
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 shadow-inner">
              
              {/* Continuous Vertical Midline crossing entire height right through the center */}
              <div className="absolute left-1/2 top-4 bottom-4 w-[1.5px] -translate-x-1/2 bg-slate-900 dark:bg-slate-200 z-10 pointer-events-none" />

              {/* UPPER ROW: TEETH THEN NUMBERS DIRECTLY BELOW */}
              {(visibleArch === 'both' || visibleArch === 'upper') && (
                <div className="grid grid-cols-2 gap-4 pb-1">
                  <div className="grid grid-cols-8 gap-0.5">
                    {upperRight.map(t => renderToothCard(t, 'upper'))}
                  </div>
                  <div className="grid grid-cols-8 gap-0.5">
                    {upperLeft.map(t => renderToothCard(t, 'upper'))}
                  </div>
                </div>
              )}

              {/* OCCLUSAL CROSS LINE WITH 'Right' AND 'Left' */}
              <div className="relative flex items-center justify-between my-1.5 z-20">
                <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white pl-1 shrink-0 select-none">
                  Right
                </span>
                <div className="flex-1 h-[1.5px] bg-slate-900 dark:bg-slate-200 mx-3 relative flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 ring-4 ring-white dark:ring-slate-900" />
                </div>
                <span className="text-sm font-bold tracking-wide text-slate-900 dark:text-white pr-1 shrink-0 select-none">
                  Left
                </span>
              </div>

              {/* LOWER ROW: NUMBERS DIRECTLY ABOVE THEN TEETH BELOW */}
              {(visibleArch === 'both' || visibleArch === 'lower') && (
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="grid grid-cols-8 gap-0.5">
                    {lowerRight.map(t => renderToothCard(t, 'lower'))}
                  </div>
                  <div className="grid grid-cols-8 gap-0.5">
                    {lowerLeft.map(t => renderToothCard(t, 'lower'))}
                  </div>
                </div>
              )}

            </div>

            {/* 3. BOTTOM QUADRANT LABELS (Only if Lower or Both visible) */}
            {(visibleArch === 'both' || visibleArch === 'lower') && (
              <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-600 dark:text-slate-300 px-2 pt-1">
                <div className="flex items-center justify-between pr-2">
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] border border-indigo-500/20">
                    LR • Mandibular Right
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">#32 ➔ #25</span>
                </div>
                <div className="flex items-center justify-between pl-2">
                  <span className="text-[10px] font-mono text-slate-400">#24 ➔ #17</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[11px] border border-purple-500/20">
                    LL • Mandibular Left
                  </span>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODE 2: REALISTIC ANATOMICAL DENTAL ARCH (Ultra-Compact Natural Mouth Curvature) */}
      {viewLayoutMode === 'anatomical' && (
        <div className="py-2 overflow-x-auto custom-scrollbar">
          <div className="min-w-[820px] max-w-4xl mx-auto">
            {/* Single Unified Dental Mouth Canvas */}
            <div className="relative border border-slate-200/90 dark:border-slate-800/90 rounded-3xl p-4 bg-slate-50/50 dark:bg-slate-900/40 shadow-inner">
              
              {/* Parabolic Canvas Sized Appropriately to Visible Arches */}
              <div 
                className={`relative w-[810px] mx-auto select-none transition-all ${
                  visibleArch === 'both' ? 'h-[295px]' : 'h-[155px]'
                }`}
              >
                {/* Anatomical Guide Curves & Occlusal Plane */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                  {/* Upper Parabolic Arch Guide */}
                  {(visibleArch === 'both' || visibleArch === 'upper') && (
                    <path
                      d="M 50 18 Q 405 92 760 18"
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}

                  {/* Occlusal Contact Midline (When both arches visible) */}
                  {visibleArch === 'both' && (
                    <>
                      <line
                        x1="30"
                        y1="140"
                        x2="780"
                        y2="140"
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1="405"
                        y1="10"
                        x2="405"
                        y2="280"
                        stroke="#64748b"
                        strokeWidth="1"
                        strokeDasharray="3 3"
                        opacity="0.5"
                      />
                      <circle cx="405" cy="140" r="3" fill="#06b6d4" />
                    </>
                  )}

                  {/* Lower Parabolic Arch Guide */}
                  {visibleArch === 'both' && (
                    <path
                      d="M 50 262 Q 405 188 760 262"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                  {visibleArch === 'lower' && (
                    <path
                      d="M 50 117 Q 405 43 760 117"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>

                {/* Patient Orientation Indicators */}
                <div className="absolute top-1 left-2 flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400">
                  <span>UR (Right)</span>
                </div>
                <div className="absolute top-1 right-2 flex items-center gap-1 text-[10px] font-mono font-bold text-slate-400">
                  <span>UL (Left)</span>
                </div>

                {/* Upper Teeth in Natural Parabolic Arc */}
                {(visibleArch === 'both' || visibleArch === 'upper') && (
                  [...upperRight, ...upperLeft].map((tooth) => {
                    const pos = UPPER_ARCH_POSITIONS[tooth.universal];
                    if (!pos) return null;
                    return (
                      <div
                        key={tooth.universal}
                        style={{
                          position: 'absolute',
                          left: `${pos.left}px`,
                          top: `${pos.top}px`,
                          transform: `rotate(${pos.rot}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {renderAnatomicalToothCell(tooth, 'upper')}
                      </div>
                    );
                  })
                )}

                {/* Lower Teeth in Natural Parabolic Arc */}
                {(visibleArch === 'both' || visibleArch === 'lower') && (
                  [...lowerRight, ...lowerLeft].map((tooth) => {
                    const pos = LOWER_ARCH_POSITIONS[tooth.universal];
                    if (!pos) return null;
                    const yOffset = visibleArch === 'lower' ? -145 : 0;
                    return (
                      <div
                        key={tooth.universal}
                        style={{
                          position: 'absolute',
                          left: `${pos.left}px`,
                          top: `${pos.top + yOffset}px`,
                          transform: `rotate(${pos.rot}deg)`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {renderAnatomicalToothCell(tooth, 'lower')}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE HOVER TOOTH INSPECTOR BAR */}
      <div className="h-9 flex items-center justify-between px-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800">
        {hoveredTooth ? (
          <div className="flex items-center gap-2 truncate">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {hoveredTooth.name}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold">
              Universal #{hoveredTooth.universal} (FDI {hoveredTooth.fdi})
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Quadrant {hoveredTooth.quadrant} • {hoveredTooth.isAnterior ? 'Anterior Unit' : 'Posterior Unit'}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-500" />
            Hover over any tooth to view anatomical root structure, quadrant position, and restoration status
          </span>
        )}

        {hoveredTooth && activeSelected.includes(hoveredTooth.universal) && (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5 shrink-0">
            <Check className="w-4 h-4 stroke-[3]" /> Assigned: {localRestorations[hoveredTooth.universal] || toothRestorations[hoveredTooth.universal] || selectedTool}
          </span>
        )}
      </div>

      {/* SELECTED RESTORATION UNITS SUMMARY TAGS GROUPED BY PROCEDURE (Image 1) */}
      {activeSelected.length > 0 && (
        <div data-testid="selected-procedures-summary" className="mt-4 pt-3.5 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs w-full max-w-full overflow-hidden">
          <div className="flex flex-col gap-2 w-full min-w-0 flex-1">
            <span className="font-extrabold text-slate-700 dark:text-slate-300">
              Selected Procedures Summary ({activeSelected.length} Units):
            </span>
            <div className="flex flex-wrap gap-2 w-full min-w-0 max-w-full" data-testid="selected-procedures-list">
              {Object.entries(groupedProcedures).map(([resType, toothNums]) => {
                const resConfig = RESTORATION_TYPES.find(r => r.id === resType);
                const label = resConfig?.label || resType;
                const bgColor = resConfig?.bgColor || 'bg-slate-100 dark:bg-slate-800';
                const textColor = resConfig?.textColor || 'text-slate-800 dark:text-slate-200';
                const borderColor = resConfig?.borderColor || 'border-slate-300 dark:border-slate-700';

                return (
                  <div
                    key={resType}
                    data-testid={`procedure-group-${resType}`}
                    className={`flex flex-wrap items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-xl border ${borderColor} ${bgColor} ${textColor} font-bold shadow-xs max-w-full`}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ProcedureIcon type={resType} className="w-3.5 h-3.5" />
                      <span className="font-extrabold text-[12px]">{label}:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1 font-mono text-[11px] max-w-full min-w-0" data-testid={`teeth-list-${resType}`}>
                      {toothNums.map((num) => {
                        const t = ODONTO_DATABASE.find(item => item.universal === num);
                        const display = system === 'universal' ? `#${num}` : `FDI ${t?.fdi || num}`;
                        return (
                          <span
                            key={num}
                            data-testid={`tooth-chip-${num}`}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/60 dark:bg-black/40 border border-current/20 shrink-0"
                          >
                            <span data-testid={`tooth-num-${num}`}>{display}</span>
                            {!readonly && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextSelected = activeSelected.filter(n => n !== num);
                                  const nextRestorations = { ...localRestorations };
                                  delete nextRestorations[num];
                                  setInternalSelected(nextSelected);
                                  setLocalRestorations(nextRestorations);
                                  if (onSelectionChange) {
                                    onSelectionChange(nextSelected, nextRestorations);
                                  } else {
                                    handleToggle?.(num);
                                  }
                                }}
                                className="hover:text-rose-500 ml-0.5 p-0.5 cursor-pointer rounded"
                                title={`Remove tooth ${display}`}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-slate-500 font-medium font-mono text-xs shrink-0 self-end md:self-center">
            Total units for fabrication: <strong className="text-cyan-600 dark:text-cyan-400 font-black text-sm">{activeSelected.length}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeethChart;
