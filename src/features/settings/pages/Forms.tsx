import React, { useState } from 'react';
import { 
  User, 
  FileText, 
  Stethoscope, 
  Receipt, 
  RefreshCw, 
  Scan, 
  CheckCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Upload, 
  X, 
  Check, 
  Save,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { ErrorState } from '@/shared/components/ErrorState';
import { UIStateSwitcher, type UIStateType } from '@/shared/components/UIStateSwitcher';
import { sound } from '@/shared/utils/sound';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';

type FormsSectionId = 'patient' | 'restoration' | 'doctor' | 'billing' | 'changeRequest' | 'scan' | 'validation';

export default function Forms() {
  const [activeSection, setActiveSection] = useState<FormsSectionId | null>('patient');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uiStateDemo, setUiStateDemo] = useState<UIStateType>('loading');

  // Patient Form State
  const [ptName, setPtName] = useState('Sarah Connor');
  const [ptDob, setPtDob] = useState('1988-06-15');
  const [ptGender, setPtGender] = useState<'M' | 'F'>('F');
  const [ptPhone, setPtPhone] = useState('+1 (555) 392-1084');
  const [ptEmail, setPtEmail] = useState('sarah.c@sky.net');
  const [ptClinic, setPtClinic] = useState('Bright Smile Dental');

  // Restoration Form State
  const [restorationType, setRestorationType] = useState('Crown');
  const [arch, setArch] = useState<'Upper' | 'Lower' | 'Both'>('Both');
  const [material, setMaterial] = useState('Zirconia (Multilayer)');
  const [shade, setShade] = useState('A2');
  const [units, setUnits] = useState(1);

  // Doctor Form State
  const [docName, setDocName] = useState('Dr. Marcus Webb');
  const [docLicense, setDocLicense] = useState('DDS-89241-CA');
  const [docSpecialty, setDocSpecialty] = useState('Prosthodontics');
  const [docNotify, setDocNotify] = useState(true);

  // Billing Config State
  const [billingTier, setBillingTier] = useState('Volume Discount (Tier 2)');
  const [currency, setCurrency] = useState('USD ($)');
  const [autoInvoice, setAutoInvoice] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  // Change Request State
  const [crOrder, setCrOrder] = useState('DL-024001');
  const [crSeverity, setCrSeverity] = useState('Medium');
  const [crNotes, setCrNotes] = useState('Please adjust interproximal contact on distal side of tooth #19.');

  // Scan Info State
  const [scanFiles, setScanFiles] = useState<string[]>([
    'UpperArch_Maxilla_scan_01.stl',
    'LowerArch_Mandible_scan_02.stl',
    'BiteRegistration_scan_03.ply'
  ]);
  const [scannerModel, setScannerModel] = useState('3Shape TRIOS 5');

  // Validation States Demo
  const [validInput, setValidInput] = useState('valid.user@dentalcloud.com');
  const [invalidInput, setInvalidInput] = useState('invalid-email-address');
  const [password, setPassword] = useState('Secret12345!');
  const [showPassword, setShowPassword] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleSection = (id: FormsSectionId) => {
    setActiveSection((current) => (current === id ? null : id));
  };

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    store.createPatient({
      name: ptName,
      dob: ptDob,
      gender: ptGender,
      phone: ptPhone,
      email: ptEmail,
      clinicName: ptClinic,
      status: 'Active',
    });
    showToast(`Patient "${ptName}" saved to reactive database!`);
  };

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    store.createDoctor({
      name: docName,
      specialty: docSpecialty,
      clinicName: ptClinic,
      phone: '+1 (555) 019-2834',
      status: 'Active',
    });
    showToast(`Doctor "${docName}" saved to directory!`);
  };

  const handleSaveChangeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    store.createNotification({
      type: 'change_request',
      title: `Revision Submitted (${crSeverity})`,
      message: `Change request on ${crOrder}: ${crNotes}`,
    });
    showToast(`Change request registered for ${crOrder}!`);
  };

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f) => f.name);
      setScanFiles((prev) => [...prev, ...newFiles]);
      showToast(`Uploaded ${newFiles.length} new 3D scan file(s)!`);
    }
  };

  const removeFile = (fileName: string) => {
    setScanFiles((prev) => prev.filter((f) => f !== fileName));
  };

  const sections = [
    { id: 'patient' as FormsSectionId, title: 'Patient Profile Form', subtitle: 'Demographics, clinical history & contact records', icon: User },
    { id: 'restoration' as FormsSectionId, title: 'Restoration Prescription Form', subtitle: 'Anatomical arches, materials, shades & unit counts', icon: FileText },
    { id: 'doctor' as FormsSectionId, title: 'Doctor & Practitioner Form', subtitle: 'License registration, clinic affiliation & preferences', icon: Stethoscope },
    { id: 'billing' as FormsSectionId, title: 'Billing & Commercial Terms', subtitle: 'Tiered pricing, auto-invoicing & remittance cycle', icon: Receipt },
    { id: 'changeRequest' as FormsSectionId, title: 'Lab Change Request Form', subtitle: 'Prescription modifications, remakes & design revisions', icon: RefreshCw },
    { id: 'scan' as FormsSectionId, title: '3D Scan & Digital Assets Upload', subtitle: 'STL/PLY digital impression verification and uploads', icon: Scan },
    { id: 'validation' as FormsSectionId, title: 'Interactive Form Validation States', subtitle: 'Live input state transitions, error hints & touched indicators', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-gray-700 animate-slide-up">
          <CheckCircle className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Interactive Forms Suite</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              Live Responsive
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete collection of reactive SaaS forms with validations, real-time feedback, and store persistence
          </p>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isOpen = activeSection === section.id;
          const Icon = section.icon;

          return (
            <div 
              key={section.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${
                    isOpen 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } transition-colors`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.subtitle}</p>
                  </div>
                </div>
                <div className="text-gray-400">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {isOpen && (
                <div className="p-6 pt-2 border-t border-gray-100 dark:border-gray-700">
                  {/* 1. Patient Form */}
                  {section.id === 'patient' && (
                    <form onSubmit={handleSavePatient} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Full Legal Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={ptName}
                            onChange={(e) => setPtName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            required
                            value={ptDob}
                            onChange={(e) => setPtDob(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Biological Gender
                          </label>
                          <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="radio"
                                name="gender"
                                checked={ptGender === 'F'}
                                onChange={() => setPtGender('F')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              Female
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="radio"
                                name="gender"
                                checked={ptGender === 'M'}
                                onChange={() => setPtGender('M')}
                                className="text-blue-600 focus:ring-blue-500"
                              />
                              Male
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Primary Clinic
                          </label>
                          <input
                            type="text"
                            value={ptClinic}
                            onChange={(e) => setPtClinic(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Phone Number
                          </label>
                          <input
                            type="text"
                            value={ptPhone}
                            onChange={(e) => setPtPhone(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={ptEmail}
                            onChange={(e) => setPtEmail(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-3">
                        <Button type="submit" className="gap-2">
                          <Save className="w-4 h-4" />
                          Save Patient Profile
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 2. Restoration Prescription Form */}
                  {section.id === 'restoration' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Restoration Type
                          </label>
                          <select
                            value={restorationType}
                            onChange={(e) => setRestorationType(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Crown">Crown (Single Tooth)</option>
                            <option value="Bridge">Bridge (Multi-Unit)</option>
                            <option value="Veneer">Aesthetic Veneer</option>
                            <option value="Implant Crown">Screw-Retained Implant</option>
                            <option value="Full Arch">Full Arch All-on-X</option>
                            <option value="Night Guard">Occlusal Splint / Night Guard</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Dental Arch Selection
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['Upper', 'Lower', 'Both'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setArch(opt)}
                                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                                  arch === opt
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Material Specification
                          </label>
                          <select
                            value={material}
                            onChange={(e) => setMaterial(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Zirconia (Multilayer)">Zirconia (Multilayer Gradient)</option>
                            <option value="PFM">PFM (Porcelain Fused to Metal)</option>
                            <option value="E-max">IPS e.max Press / CAD</option>
                            <option value="PMMA (Temp)">PMMA Diagnostic Temporary</option>
                            <option value="Titanium">Bio-compatible Titanium Grade 5</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            VITA Classical Shade
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {['A1', 'A2', 'A3', 'B1', 'B2', 'BL1'].map((sh) => (
                              <button
                                key={sh}
                                type="button"
                                onClick={() => setShade(sh)}
                                className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                                  shade === sh
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {sh}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Number of Units: {units}
                          </label>
                          <input
                            type="range"
                            min="1"
                            max="16"
                            value={units}
                            onChange={(e) => setUnits(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-3">
                        <Button 
                          onClick={() => showToast(`Restoration specs locked: ${units}x ${restorationType} in ${material} (${shade})`)}
                          className="gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Apply Restoration Parameters
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 3. Doctor Form */}
                  {section.id === 'doctor' && (
                    <form onSubmit={handleSaveDoctor} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Doctor Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            State Dental License #
                          </label>
                          <input
                            type="text"
                            value={docLicense}
                            onChange={(e) => setDocLicense(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Clinical Specialty
                          </label>
                          <select
                            value={docSpecialty}
                            onChange={(e) => setDocSpecialty(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="General Dentistry">General Dentistry</option>
                            <option value="Prosthodontics">Prosthodontics</option>
                            <option value="Orthodontics">Orthodontics</option>
                            <option value="Oral & Maxillofacial">Oral & Maxillofacial</option>
                            <option value="Periodontics">Periodontics</option>
                          </select>
                        </div>
                        <div className="flex items-center mt-6">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
                            <input
                              type="checkbox"
                              checked={docNotify}
                              onChange={(e) => setDocNotify(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            Send real-time SMS & email design alerts
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end pt-3">
                        <Button type="submit" className="gap-2">
                          <Save className="w-4 h-4" />
                          Register Doctor
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 4. Billing Config */}
                  {section.id === 'billing' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Pricing Agreement Tier
                          </label>
                          <select
                            value={billingTier}
                            onChange={(e) => setBillingTier(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Standard Retail">Standard Retail</option>
                            <option value="Volume Discount (Tier 1)">Volume Discount (Tier 1 - 10%)</option>
                            <option value="Volume Discount (Tier 2)">Volume Discount (Tier 2 - 20%)</option>
                            <option value="Enterprise Hospital Contract">Enterprise Hospital Contract</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Settlement Currency
                          </label>
                          <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="USD ($)">USD ($)</option>
                            <option value="EUR (€)">EUR (€)</option>
                            <option value="GBP (£)">GBP (£)</option>
                            <option value="CAD ($)">CAD ($)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Default Payment Terms
                          </label>
                          <select
                            value={paymentTerms}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="Due on Receipt">Due on Receipt</option>
                            <option value="Net 15">Net 15 Days</option>
                            <option value="Net 30">Net 30 Days</option>
                            <option value="Net 60">Net 60 Days</option>
                          </select>
                        </div>
                        <div className="flex items-center mt-6">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-900 dark:text-white">
                            <input
                              type="checkbox"
                              checked={autoInvoice}
                              onChange={(e) => setAutoInvoice(e.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            Automatically generate invoice when case enters 'Ready' stage
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end pt-3">
                        <Button onClick={() => showToast('Billing configuration saved successfully!')} className="gap-2">
                          <Save className="w-4 h-4" />
                          Update Billing Settings
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 5. Change Request */}
                  {section.id === 'changeRequest' && (
                    <form onSubmit={handleSaveChangeRequest} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Target Order Number
                          </label>
                          <input
                            type="text"
                            value={crOrder}
                            onChange={(e) => setCrOrder(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Urgency / Severity Level
                          </label>
                          <div className="grid grid-cols-4 gap-2">
                            {['Low', 'Medium', 'High', 'Critical'].map((sev) => (
                              <button
                                key={sev}
                                type="button"
                                onClick={() => setCrSeverity(sev)}
                                className={`py-2 text-xs font-semibold rounded-lg border transition-colors ${
                                  crSeverity === sev
                                    ? sev === 'Critical'
                                      ? 'bg-rose-600 text-white border-rose-600'
                                      : 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {sev}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                          Detailed Revision Instructions
                        </label>
                        <textarea
                          rows={3}
                          value={crNotes}
                          onChange={(e) => setCrNotes(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          placeholder="Describe the adjustments needed by the CAD designer or milling technician..."
                        />
                      </div>
                      <div className="flex justify-end pt-3">
                        <Button type="submit" variant="danger" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          Submit Revision Ticket
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* 6. Scan Info */}
                  {section.id === 'scan' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Capture Hardware / Intraoral Scanner
                          </label>
                          <select
                            value={scannerModel}
                            onChange={(e) => setScannerModel(e.target.value)}
                            className="px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                          >
                            <option value="3Shape TRIOS 5">3Shape TRIOS 5 Wireless</option>
                            <option value="Medit i700">Medit i700 Wireless</option>
                            <option value="iTero Element 5D">iTero Element 5D Plus</option>
                            <option value="Dentsply Primescan">Dentsply Sirona Primescan</option>
                          </select>
                        </div>
                      </div>

                      {/* File Uploader */}
                      <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50 dark:bg-gray-900/40">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                          Click or drag 3D scan files here
                        </span>
                        <span className="text-xs text-gray-400 mt-1">
                          Supported formats: .STL, .PLY, .OBJ, .DCM up to 100MB
                        </span>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileDrop}
                          className="hidden"
                        />
                      </label>

                      {/* File Chips */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">
                          Attached Assets ({scanFiles.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {scanFiles.map((file) => (
                            <div
                              key={file}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-xs font-mono text-blue-800 dark:text-blue-300"
                            >
                              <span>{file}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(file)}
                                className="text-blue-500 hover:text-rose-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 7. Validation States */}
                  {section.id === 'validation' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Valid state */}
                        <div>
                          <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Valid State (Success Indicator)
                          </label>
                          <input
                            type="text"
                            value={validInput}
                            onChange={(e) => setValidInput(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 text-gray-900 dark:text-white text-sm outline-none"
                          />
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            ✓ Format accepted and verified with directory
                          </p>
                        </div>

                        {/* Invalid state */}
                        <div>
                          <label className="block text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Invalid State (Error Indicator)
                          </label>
                          <input
                            type="text"
                            value={invalidInput}
                            onChange={(e) => setInvalidInput(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-lg border-2 border-rose-500 bg-rose-50/20 dark:bg-rose-950/20 text-gray-900 dark:text-white text-sm outline-none"
                          />
                          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                            ✕ Please enter a valid RFC-compliant email address
                          </p>
                        </div>

                        {/* Password with visibility toggle */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                            Password / Protected Key
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full pl-3.5 pr-10 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Strength: <span className="text-emerald-500 font-semibold">Strong</span> (12+ characters, mixed case & symbols)
                          </p>
                        </div>

                        {/* Disabled State */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
                            Read-Only / Disabled Field
                          </label>
                          <input
                            type="text"
                            disabled
                            value="LOCKED_TRANSACTION_HASH_99182"
                            className="w-full px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-gray-400 text-sm cursor-not-allowed font-mono"
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Cannot be edited in current pipeline status
                          </p>
                        </div>
                      </div>

                      {/* Application Lifecycle UI States Showcase */}
                      <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                              Application UI State Previews
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Simulate Loading, Empty, and Error component states with interactive controls
                            </p>
                          </div>
                          <UIStateSwitcher state={uiStateDemo} onChange={setUiStateDemo} label="Select UI State" />
                        </div>

                        {/* Live State Container */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden">
                          {uiStateDemo === 'loading' && (
                            <LoadingState
                              text="Simulating 3D CAD Mesh Loading..."
                              subtitle="Synthesizing digital bite registration and STL voxel hierarchy"
                            />
                          )}
                          {uiStateDemo === 'empty' && (
                            <EmptyState
                              title="No Dental Data in Selected Set"
                              description="This represents a pristine zero-state when no items match filters or search queries."
                              action={
                                <Button variant="primary" onClick={() => sound.playClick()}>
                                  Add First Record
                                </Button>
                              }
                            />
                          )}
                          {uiStateDemo === 'error' && (
                            <ErrorState
                              title="Simulated Network Error (500)"
                              message="Failed to parse binary DICOM chunk from remote PACS endpoint."
                              code="ERR_DICOM_CHUNK_CORRUPT_500"
                              onRetry={() => { sound.playPop(); setUiStateDemo('loading'); }}
                            />
                          )}
                          {uiStateDemo === 'normal' && (
                            <div className="py-12 text-center space-y-2">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold">
                                ✓
                              </div>
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                                Standard Live State Active
                              </h5>
                              <p className="text-xs text-slate-500">
                                Click the Loading, Empty, or Error buttons above to test the respective states.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
