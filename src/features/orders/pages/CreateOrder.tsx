import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, ChevronRight, ChevronLeft, Calendar, User, Building2, Stethoscope, 
  Upload, FileText, X, AlertCircle, Sparkles, CheckCircle2, ShieldAlert
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Select } from '@/shared/components/Select';
import { DateInput } from '@/shared/components/DateInput';
import { TeethChart, RestorationType } from '@/shared/components/TeethChart';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { formatDate, formatCurrency } from '@/shared/utils/format';
import type { Patient, Doctor, Clinic } from '@/shared/types';

export const CREATE_ORDER_STEPS = [
  { id: 1, label: 'Patient & Clinic', short: 'Patient' },
  { id: 2, label: 'Services', short: 'Services' },
  { id: 3, label: 'Teeth Selection', short: 'Teeth' },
  { id: 4, label: 'Service Details', short: 'Details' },
  { id: 5, label: 'Forms', short: 'Forms' },
  { id: 6, label: 'Scans & Files', short: 'Files' },
  { id: 7, label: 'Review', short: 'Review' },
];

export const AVAILABLE_SERVICES = [
  {
    id: 'final-restoration',
    name: 'Final Restoration',
    description: 'Definitive crowns, bridges, aesthetic veneers, or full-arch restorations.',
    icon: '✨',
    price: 320,
    scanRequirements: ['Prep scan (STL)', 'Antagonist scan (STL)', 'Shade reference photo'],
  },
  {
    id: 'surgical-guide',
    name: 'Surgical Guide',
    description: 'Precision-guided implant surgery planning with pilot & fully guided sleeves.',
    icon: '🦷',
    price: 450,
    scanRequirements: ['CBCT / CT DICOM', 'STL digital impression', 'Bite registration'],
  },
  {
    id: 'gfmr',
    name: 'GFMR Full Arch',
    description: 'Guided functional full-mouth rehabilitation with anatomical verification.',
    icon: '⚙️',
    price: 1200,
    scanRequirements: ['Upper arch scan', 'Lower arch scan', 'Facial & smile photos'],
  },
  {
    id: 'treatment-plan',
    name: 'Treatment Plan',
    description: 'Comprehensive digital smile design with diagnostic mockups & staging.',
    icon: '📋',
    price: 180,
    scanRequirements: ['Full arch STL', 'Bite registration', 'High-res photos'],
  },
  {
    id: 'temp-restoration',
    name: 'Temporary Restoration',
    description: 'High-strength PMMA interim restorations to maintain aesthetics & occlusion.',
    icon: '🛡️',
    price: 120,
    scanRequirements: ['Working model scan', 'Antagonist scan'],
  },
  {
    id: 'fmb',
    name: 'FMB / FMP',
    description: 'Full-mouth bridge or precision partial framework fabricated to micron accuracy.',
    icon: '🔬',
    price: 850,
    scanRequirements: ['Upper arch STL', 'Lower arch STL', 'Centric relation bite'],
  },
  {
    id: 'night-guard',
    name: 'Night Guard / Splint',
    description: 'Hard/soft dual-laminate or 3D printed precision occlusal guard.',
    icon: '🗜️',
    price: 160,
    scanRequirements: ['Upper arch scan', 'Lower arch scan'],
  },
];

const SHADES = ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'C1', 'D2', 'BL1', 'BL2'];
const ARCH_OPTIONS = [
  { value: 'Upper', label: 'Upper Maxilla' },
  { value: 'Lower', label: 'Lower Mandible' },
  { value: 'Both', label: 'Both Arches' },
];
const OCCLUSAL_CONCEPTS = [
  { value: 'Mutually Protected', label: 'Mutually Protected' },
  { value: 'Canine Guidance', label: 'Canine Guidance' },
  { value: 'Group Function', label: 'Group Function' },
  { value: 'Full Balanced', label: 'Full Balanced Occlusion' },
];
const IMPLANT_SYSTEMS = [
  { value: 'Straumann', label: 'Straumann Bone Level' },
  { value: 'Nobel Biocare', label: 'Nobel Biocare Active' },
  { value: 'Zimmer Biomet', label: 'Zimmer Biomet T3' },
  { value: 'Neodent', label: 'Neodent Grand Morse' },
  { value: 'BioHorizons', label: 'BioHorizons Tapered' },
  { value: 'Other', label: 'Other Universal System' },
];
const FILE_FORMATS = [
  { value: 'Digital STL', label: 'Digital STL (Intraoral Scan)' },
  { value: 'PLY Color', label: 'PLY True-Color Scan' },
  { value: 'DICOM', label: 'CBCT DICOM Volume' },
  { value: 'Physical Impression', label: 'Physical PVS Impression' },
];
const OCCLUSAL_CONTACTS = [
  { value: 'Light contact (12μm)', label: 'Light contact (12μm)' },
  { value: 'Full contact (24μm)', label: 'Full contact (24μm)' },
  { value: 'Out of occlusion (0.5mm relief)', label: 'Out of occlusion (0.5mm relief)' },
];
const MARGIN_TYPES = [
  { value: 'Chamfer', label: 'Chamfer (0.8mm - 1.0mm)' },
  { value: 'Shoulder', label: 'Deep Shoulder (1.2mm)' },
  { value: 'Feather Edge', label: 'Feather Edge' },
  { value: 'Subgingival', label: 'Subgingival (0.5mm)' },
];
const MATERIALS = [
  { value: 'Zirconia Multilayer High Translucency', label: 'Zirconia Multilayer High Translucency (600-1100 MPa)' },
  { value: 'Lithium Disilicate (IPS e.max)', label: 'Lithium Disilicate (IPS e.max CAD)' },
  { value: 'Titanium Custom Abutment + Zirconia', label: 'Titanium Custom Abutment + Zirconia' },
  { value: 'PMMA High-Density Long-term', label: 'PMMA High-Density Long-term' },
  { value: 'PEEK Biocompatible Polymer', label: 'PEEK Biocompatible Polymer' },
];

export default function CreateOrder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const patients: Patient[] = useStore(s => s.getPatients());
  const doctors: Doctor[] = useStore(s => s.getDoctors());
  const clinics: Clinic[] = useStore(s => s.getClinics());

  // Form State
  const [form, setForm] = useState({
    patientId: '',
    clinicId: '',
    doctorId: '',
    priority: 'Normal' as 'Normal' | 'High' | 'Urgent',
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    selectedServices: ['final-restoration'] as string[],
    selectedTeeth: [8, 9] as number[],
    toothRestorations: { 8: 'crown', 9: 'crown' } as Record<number, RestorationType>,
    activeServiceForTeeth: null as string | null,
    serviceDetails: {
      shade: 'A2',
      arch: 'Upper',
      occlusalConcept: 'Mutually Protected',
      implantSystem: 'Straumann',
      fileFormat: 'Digital STL',
      serviceNotes: '',
    },
    clinicalForm: {
      clinicalNotes: '',
      occlusalContact: 'Light contact (12μm)',
      marginType: 'Chamfer',
      material: 'Zirconia Multilayer High Translucency',
      specialInstructions: '',
    },
    uploadedFiles: [
      { name: 'Upper_Arch_Prep_Scan.stl', size: '14.2 MB', serviceId: 'final-restoration' },
      { name: 'Lower_Arch_Antagonist.stl', size: '12.8 MB', serviceId: 'final-restoration' },
    ] as { name: string; size: string; serviceId: string }[],
  });

  const fallbackPatients: Patient[] = [
    { id: 'pt-1', name: 'Jane Doe', dob: '1985-04-12', gender: 'F', phone: '+1 (555) 234-5678', email: 'jane.d@example.com', clinicId: 'cl-1', clinicName: 'Bright Smile Dental', doctorId: 'dr-1', doctorName: 'Dr. Allison Park', status: 'Active', ordersCount: 3, lastVisit: '2026-08-15' },
    { id: 'pt-2', name: 'John Smith', dob: '1979-11-20', gender: 'M', phone: '+1 (555) 345-6789', email: 'john.s@example.com', clinicId: 'cl-2', clinicName: 'Apex Dental Care', doctorId: 'dr-2', doctorName: 'Dr. Marcus Webb', status: 'Active', ordersCount: 1, lastVisit: '2026-09-02' },
    { id: 'pt-3', name: 'Sarah Connor', dob: '1990-07-15', gender: 'F', phone: '+1 (555) 456-7890', email: 'sarah.c@sky.net', clinicId: 'cl-1', clinicName: 'Bright Smile Dental', doctorId: 'dr-1', doctorName: 'Dr. Allison Park', status: 'Active', ordersCount: 4, lastVisit: '2026-09-10' },
    { id: 'pt-4', name: 'Michael Chang', dob: '1982-01-30', gender: 'M', phone: '+1 (555) 567-8901', email: 'm.chang@example.com', clinicId: 'cl-3', clinicName: 'Coastal Smiles', doctorId: 'dr-3', doctorName: 'Dr. Kevin Murphy', status: 'Active', ordersCount: 2, lastVisit: '2026-07-22' },
    { id: 'pt-5', name: 'Emily Watson', dob: '1995-09-08', gender: 'F', phone: '+1 (555) 678-9012', email: 'e.watson@example.com', clinicId: 'cl-2', clinicName: 'Apex Dental Care', doctorId: 'dr-2', doctorName: 'Dr. Marcus Webb', status: 'Active', ordersCount: 1, lastVisit: '2026-08-30' },
    { id: 'pt-6', name: 'Robert Miller', dob: '1968-12-03', gender: 'M', phone: '+1 (555) 789-0123', email: 'r.miller@example.com', clinicId: 'cl-1', clinicName: 'Bright Smile Dental', doctorId: 'dr-1', doctorName: 'Dr. Allison Park', status: 'Active', ordersCount: 5, lastVisit: '2026-09-18' },
    { id: 'pt-7', name: 'Rania Khalil', dob: '1991-03-22', gender: 'F', phone: '+1 (555) 890-1234', email: 'r.khalil@example.com', clinicId: 'cl-3', clinicName: 'Coastal Smiles', doctorId: 'dr-3', doctorName: 'Dr. Kevin Murphy', status: 'Active', ordersCount: 2, lastVisit: '2026-09-24' },
  ];
  const activePatients = (patients && patients.length > 0) ? patients : fallbackPatients;

  const activeClinics = (clinics && clinics.length > 0) ? clinics : [
    { id: 'cl-1', name: 'Bright Smile Dental', city: 'San Francisco, CA', phone: '+1 (555) 012-3456', address: '100 Market St' },
    { id: 'cl-2', name: 'Apex Dental Care', city: 'Oakland, CA', phone: '+1 (555) 012-3457', address: '250 Grand Ave' },
    { id: 'cl-3', name: 'Coastal Smiles', city: 'San Jose, CA', phone: '+1 (555) 012-3458', address: '88 First St' },
  ];

  const activeDoctors = (doctors && doctors.length > 0) ? doctors : [
    { id: 'dr-1', name: 'Dr. Allison Park', specialty: 'Prosthodontist', clinicId: 'cl-1', clinicName: 'Bright Smile Dental', phone: '+1 (555) 123-4567', status: 'Active' },
    { id: 'dr-2', name: 'Dr. Marcus Webb', specialty: 'Oral Surgeon', clinicId: 'cl-2', clinicName: 'Apex Dental Care', phone: '+1 (555) 234-5678', status: 'Active' },
    { id: 'dr-3', name: 'Dr. Kevin Murphy', specialty: 'General Dentist', clinicId: 'cl-3', clinicName: 'Coastal Smiles', phone: '+1 (555) 345-6789', status: 'Active' },
    { id: 'dr-4', name: 'Dr. Sophia Lin', specialty: 'Orthodontist', clinicId: 'cl-1', clinicName: 'Bright Smile Dental', phone: '+1 (555) 456-7890', status: 'Active' },
  ];

  const selectedPatient = activePatients.find(p => p.id === form.patientId);
  const selectedDoctor = activeDoctors.find(d => d.id === form.doctorId);
  const selectedClinic = activeClinics.find(c => c.id === form.clinicId);

  // Filter doctors by clinic if clinic selected
  const availableDoctors = form.clinicId
    ? activeDoctors.filter(d => d.clinicId === form.clinicId || d.clinicName === selectedClinic?.name)
    : activeDoctors;

  // Options with rich React metadata
  const patientOptions = activePatients.map(p => ({
    value: p.id,
    label: p.name,
    subtitle: `${p.clinicName} • Phone: ${p.phone}`,
    badge: p.phone ? 'Verified' : undefined,
  }));

  const clinicOptions = activeClinics.map(c => ({
    value: c.id,
    label: c.name,
    subtitle: `${c.city} • Phone: ${c.phone}`,
    badge: 'Active Lab Link',
    badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  }));

  const doctorOptions = availableDoctors.map(d => ({
    value: d.id,
    label: d.name,
    subtitle: `${d.specialty || 'General Practitioner'} • ${d.phone}`,
    badge: d.specialty?.split(' ')[0] || 'Clinician',
  }));
  const priorityOptions = [
    { 
      value: 'Normal', 
      label: 'Normal (Standard Turnaround)', 
      subtitle: '5-7 business days standard CAD/CAM turnaround',
      badge: 'Standard',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    },
    { 
      value: 'High', 
      label: 'High Priority (Express)', 
      subtitle: '48-hour expedited queue allocation',
      badge: '⚡ Express',
      badgeColor: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
    },
    { 
      value: 'Urgent', 
      label: 'Urgent (Rush Order 24-48h)', 
      subtitle: 'Immediate priority milling & senior technician sign-off',
      badge: '🚨 Critical Rush',
      badgeColor: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
    },
  ];

  const handleToggleService = (serviceId: string) => {
    setForm(prev => {
      const exists = prev.selectedServices.includes(serviceId);
      const updated = exists 
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId];
      // ensure at least 1 service is selected
      return { ...prev, selectedServices: updated.length > 0 ? updated : [serviceId] };
    });
  };

  const handleToggleTooth = (toothNumber: number) => {
    setForm(prev => {
      const exists = prev.selectedTeeth.includes(toothNumber);
      const updatedTeeth = exists
        ? prev.selectedTeeth.filter(t => t !== toothNumber)
        : [...prev.selectedTeeth, toothNumber];
      
      const updatedRestorations = { ...prev.toothRestorations };
      if (exists) {
        delete updatedRestorations[toothNumber];
      }
      return {
        ...prev,
        selectedTeeth: updatedTeeth,
        toothRestorations: updatedRestorations,
      };
    });
  };

  const handleClearAllTeeth = () => {
    setForm(prev => ({
      ...prev,
      selectedTeeth: [],
      toothRestorations: {},
    }));
  };

  const handleAssignRestoration = (toothNumber: number, type: RestorationType) => {
    setForm(prev => ({
      ...prev,
      toothRestorations: {
        ...prev.toothRestorations,
        [toothNumber]: type,
      },
    }));
  };

  const handleSimulateFileUpload = (serviceId: string, requirementName: string) => {
    const extensions = ['.stl', '.ply', '.dcm', '.jpg', '.pdf'];
    const ext = extensions[Math.floor(Math.random() * extensions.length)];
    const mockFile = {
      name: `${requirementName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now().toString().slice(-4)}${ext}`,
      size: `${(Math.random() * 15 + 2).toFixed(1)} MB`,
      serviceId,
    };
    setForm(prev => ({
      ...prev,
      uploadedFiles: [...prev.uploadedFiles, mockFile],
    }));
  };

  const handleRemoveFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index),
    }));
  };

  const canGoNext = () => {
    if (step === 1) return Boolean(form.patientId && form.clinicId && form.doctorId);
    if (step === 2) return form.selectedServices.length > 0;
    if (step === 3) return form.selectedTeeth.length > 0;
    return true;
  };

  const handleSubmitOrder = async () => {
    setIsSubmitting(true);
    try {
      const patient = selectedPatient || { name: 'Jane Doe', id: 'pt-1' };
      const doctor = selectedDoctor || { name: 'Dr. Allison Park', id: 'dr-1' };
      const clinic = selectedClinic || { name: 'Bright Smile Dental', id: 'cl-1' };

      const totalUnits = Math.max(form.selectedTeeth.length, 1);
      const primaryService = AVAILABLE_SERVICES.find(s => s.id === form.selectedServices[0]);
      const estimatedAmount = form.selectedServices.reduce((sum, sId) => {
        const s = AVAILABLE_SERVICES.find(item => item.id === sId);
        return sum + (s ? s.price * totalUnits : 320);
      }, 0);

      const newOrder = store.createOrder({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        clinicId: clinic.id,
        clinicName: clinic.name,
        restoration: primaryService?.name || 'Crown & Bridge',
        units: totalUnits,
        amount: estimatedAmount,
        priority: form.priority,
        dueDate: new Date(form.dueDate).toISOString(),
        shade: form.serviceDetails.shade,
        arch: form.serviceDetails.arch as any,
        format: form.serviceDetails.fileFormat,
        notes: `${form.clinicalForm.clinicalNotes}\n${form.clinicalForm.specialInstructions}`.trim(),
      });

      // Also create a case automatically if not exists
      store.createCase({
        title: `${patient.name} - ${primaryService?.name} (${totalUnits} Units)`,
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        clinicId: clinic.id,
        clinicName: clinic.name,
        priority: form.priority,
      });

      setTimeout(() => {
        navigate(`/orders/${newOrder.id}`);
      }, 500);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create New Dental Order
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Complete each step to build a detailed, prescription-grade dental lab order
        </p>
      </div>

      {/* 7-Step Horizontal Stepper Header */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-hidden">
        <div className="flex items-center justify-between relative">
          {CREATE_ORDER_STEPS.map((s, index) => {
            const isCompleted = s.id < step;
            const isCurrent = s.id === step;
            return (
              <React.Fragment key={s.id}>
                <div 
                  className="flex flex-col items-center cursor-pointer group z-10"
                  onClick={() => s.id <= step || canGoNext() ? setStep(s.id) : null}
                >
                  <button
                    type="button"
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : isCurrent
                          ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md shadow-blue-500/20'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                  </button>
                  <span className={`text-[11px] font-semibold mt-1.5 transition-colors hidden sm:block ${
                    isCurrent 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : isCompleted 
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {s.short}
                  </span>
                </div>

                {index < CREATE_ORDER_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors duration-200 ${
                    s.id < step ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step Content Area */}
      <AnimatePresence mode="wait">
        {/* STEP 1: PATIENT & CLINIC */}
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative z-30">
              <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Patient Selection
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Select Patient <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    icon={<User size={16} />}
                    placeholder="Search & Select Patient Record..."
                    options={patientOptions}
                    value={form.patientId}
                    onChange={(val: any) => setForm(f => ({ ...f, patientId: typeof val === 'string' ? val : val?.target?.value || '' }))}
                  />
                </div>

                {selectedPatient && (
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                      {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base">{selectedPatient.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        DOB: {formatDate(selectedPatient.dob)} • Phone: {selectedPatient.phone} • {selectedPatient.clinicName}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 relative z-20">
              <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" /> Clinic & Referring Doctor
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Clinic Practice <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    icon={<Building2 size={16} />}
                    placeholder="Search & Select Dental Clinic..."
                    options={clinicOptions}
                    value={form.clinicId}
                    onChange={(val: any) => setForm(f => ({ ...f, clinicId: typeof val === 'string' ? val : val?.target?.value || '' }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Referring Clinician <span className="text-rose-500">*</span>
                  </label>
                  <Select
                    icon={<Stethoscope size={16} />}
                    placeholder="Search & Select Referring Doctor..."
                    options={doctorOptions}
                    value={form.doctorId}
                    onChange={(val: any) => setForm(f => ({ ...f, doctorId: typeof val === 'string' ? val : val?.target?.value || '' }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Order Priority
                  </label>
                  <Select
                    icon={<AlertCircle size={16} />}
                    options={priorityOptions}
                    value={form.priority}
                    onChange={(val: any) => setForm(f => ({ ...f, priority: (typeof val === 'string' ? val : val?.target?.value) as any }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Required Delivery Due Date <span className="text-rose-500">*</span>
                  </label>
                  <DateInput
                    value={form.dueDate}
                    onChange={val => setForm(f => ({ ...f, dueDate: val }))}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: DENTAL SERVICES SELECTION */}
        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-5"
          >
            <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
              <p className="text-xs text-blue-900 dark:text-blue-300">
                Select one or more dental services for this prescription. Each service forms an independent sub-order with its own workflow stages, scans, and milling parameters.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AVAILABLE_SERVICES.map(svc => {
                const isSelected = form.selectedServices.includes(svc.id);
                return (
                  <div
                    key={svc.id}
                    onClick={() => handleToggleService(svc.id)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 shadow-md shadow-blue-500/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-3xl">{svc.icon}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-base mb-1">{svc.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">{svc.description}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                        Required Scans:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {svc.scanRequirements.map(req => (
                          <span key={req} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {form.selectedServices.length} Service{form.selectedServices.length > 1 ? 's' : ''} Selected
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">
                {form.selectedServices.length} sub-order deliverable{form.selectedServices.length > 1 ? 's' : ''} will be generated
              </span>
            </div>
          </motion.div>
        )}

        {/* STEP 3: NEXT-LEVEL ANATOMICAL TEETH CHART */}
        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-base text-gray-900 dark:text-white mb-1">
                Interactive Teeth Morphology & Restoration Mapping
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Accurate anatomical representation of central incisors, cuspids, bicuspids, and molars. Select teeth and assign their specific restoration type.
              </p>
            </div>

            <TeethChart
              selected={form.selectedTeeth}
              onToggle={handleToggleTooth}
              toothRestorations={form.toothRestorations}
              onAssignRestoration={handleAssignRestoration}
              onClearAll={handleClearAllTeeth}
            />
          </motion.div>
        )}

        {/* STEP 4: SERVICE DETAILS & PARAMETERS */}
        {step === 4 && (
          <motion.div
            key="step-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Technical Specifications & Aesthetics
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    VITA Classical Shade
                  </label>
                  <Select
                    options={SHADES.map(s => ({ value: s, label: `Shade ${s}` }))}
                    value={form.serviceDetails.shade}
                    onChange={(val: any) => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, shade: val } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Target Arch
                  </label>
                  <Select
                    options={ARCH_OPTIONS}
                    value={form.serviceDetails.arch}
                    onChange={(val: any) => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, arch: val } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Occlusal Scheme
                  </label>
                  <Select
                    options={OCCLUSAL_CONCEPTS}
                    value={form.serviceDetails.occlusalConcept}
                    onChange={(val: any) => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, occlusalConcept: val } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Implant Connection System
                  </label>
                  <Select
                    options={IMPLANT_SYSTEMS}
                    value={form.serviceDetails.implantSystem}
                    onChange={(val: any) => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, implantSystem: val } }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Digital Scan Impression Format
                  </label>
                  <Select
                    options={FILE_FORMATS}
                    value={form.serviceDetails.fileFormat}
                    onChange={(val: any) => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, fileFormat: val } }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Detailed Lab Instructions / Technician Notes
                  </label>
                  <textarea
                    rows={3}
                    value={form.serviceDetails.serviceNotes}
                    onChange={e => setForm(f => ({ ...f, serviceDetails: { ...f.serviceDetails, serviceNotes: e.target.value } }))}
                    placeholder="Specific design instructions, emergence profile nuances, contact point tightness..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 focus:border-cyan-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all resize-y shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 5: CLINICAL FORM */}
        {step === 5 && (
          <motion.div
            key="step-5"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="bg-gray-50 dark:bg-slate-900 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Clinical Guidelines & Material Selection
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Occlusal Clearance & Contact
                  </label>
                  <Select
                    options={OCCLUSAL_CONTACTS}
                    value={form.clinicalForm.occlusalContact}
                    onChange={(val: any) => setForm(f => ({ ...f, clinicalForm: { ...f.clinicalForm, occlusalContact: val } }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Margin Profile Design
                  </label>
                  <Select
                    options={MARGIN_TYPES}
                    value={form.clinicalForm.marginType}
                    onChange={(val: any) => setForm(f => ({ ...f, clinicalForm: { ...f.clinicalForm, marginType: val } }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Prosthetic Material
                  </label>
                  <Select
                    options={MATERIALS}
                    value={form.clinicalForm.material}
                    onChange={(val: any) => setForm(f => ({ ...f, clinicalForm: { ...f.clinicalForm, material: val } }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Clinical Notes & Anatomical Context
                  </label>
                  <textarea
                    rows={4}
                    value={form.clinicalForm.clinicalNotes}
                    onChange={e => setForm(f => ({ ...f, clinicalForm: { ...f.clinicalForm, clinicalNotes: e.target.value } }))}
                    placeholder="Patient history, existing periodontal health, gingival biotype, shade photos references..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 focus:border-cyan-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all resize-y shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 6: SCANS & FILES */}
        {step === 6 && (
          <motion.div
            key="step-6"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* Checklist per selected service */}
            {form.selectedServices.map(sId => {
              const svc = AVAILABLE_SERVICES.find(s => s.id === sId);
              if (!svc) return null;
              return (
                <div key={sId} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <span>{svc.icon}</span> {svc.name} Required Files
                    </h4>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      {svc.scanRequirements.length} scans required
                    </span>
                  </div>

                  <div className="space-y-2">
                    {svc.scanRequirements.map(req => {
                      const uploaded = form.uploadedFiles.some(f => f.name.toLowerCase().includes(req.split(' ')[0].toLowerCase()));
                      return (
                        <div key={req} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                              uploaded ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                            }`}>
                              {uploaded ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '•'}
                            </div>
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{req}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSimulateFileUpload(sId, req)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
                          >
                            + Attach File
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Attached files summary */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">
                Attached Digital Assets ({form.uploadedFiles.length})
              </h4>
              <div className="space-y-2">
                {form.uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="font-mono text-xs font-semibold text-gray-900 dark:text-white">{file.name}</span>
                      <span className="text-[10px] text-gray-400">({file.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 7: ORDER SUMMARY & CONFIRMATION */}
        {step === 7 && (
          <motion.div
            key="step-7"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Prescription Summary</h3>
                  <p className="text-xs text-gray-400">Please review clinical specifications before transmitting to the lab</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                  Ready for Production
                </span>
              </div>

              {/* Patient & Clinic Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Patient</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{selectedPatient?.name || 'Jane Doe'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Clinic</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{selectedClinic?.name || 'Bright Smile Dental'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Doctor</span>
                  <p className="font-bold text-sm text-gray-900 dark:text-white mt-0.5">{selectedDoctor?.name || 'Dr. Allison Park'}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl">
                  <span className="text-[10px] text-gray-400 uppercase font-semibold">Delivery Target</span>
                  <p className="font-bold text-sm text-blue-600 dark:text-blue-400 mt-0.5">{formatDate(form.dueDate)}</p>
                </div>
              </div>

              {/* Teeth Units & Procedures */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 block mb-2">
                  Prescribed Dental Units ({form.selectedTeeth.length} teeth):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {form.selectedTeeth.sort((a,b)=>a-b).map(t => (
                    <span key={t} className="px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 text-xs font-mono font-bold text-gray-900 dark:text-white shadow-xs border border-gray-200 dark:border-gray-700">
                      Tooth #{t} <span className="text-blue-600 dark:text-blue-400">({form.toothRestorations[t] || 'crown'})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Clinical Specifications */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <p><span className="text-gray-400">Material:</span> <strong className="text-gray-800 dark:text-gray-200">{form.clinicalForm.material}</strong></p>
                  <p><span className="text-gray-400">Shade:</span> <strong className="text-gray-800 dark:text-gray-200">{form.serviceDetails.shade}</strong></p>
                  <p><span className="text-gray-400">Arch:</span> <strong className="text-gray-800 dark:text-gray-200">{form.serviceDetails.arch}</strong></p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-xl space-y-1">
                  <p><span className="text-gray-400">Margin:</span> <strong className="text-gray-800 dark:text-gray-200">{form.clinicalForm.marginType}</strong></p>
                  <p><span className="text-gray-400">Occlusion:</span> <strong className="text-gray-800 dark:text-gray-200">{form.clinicalForm.occlusalContact}</strong></p>
                  <p><span className="text-gray-400">Format:</span> <strong className="text-gray-800 dark:text-gray-200">{form.serviceDetails.fileFormat}</strong></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep(p => Math.max(p - 1, 1))}
          disabled={step === 1}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </Button>

        {step < 7 ? (
          <Button
            type="button"
            onClick={() => setStep(p => Math.min(p + 1, 7))}
            disabled={!canGoNext()}
            className="gap-2"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmitOrder}
            disabled={isSubmitting}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 shadow-md shadow-emerald-600/20"
          >
            {isSubmitting ? 'Transmitting to Lab...' : 'Submit Order to Lab'}
            <CheckCircle2 className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
