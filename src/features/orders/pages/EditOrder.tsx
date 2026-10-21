import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Lock, 
  Unlock 
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import type { OrderStatus, Priority } from '@/shared/types';

export default function EditOrder() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const orders = useStore((s) => s.getOrders());
  const patients = useStore((s) => s.getPatients());
  const doctors = useStore((s) => s.getDoctors());
  const clinics = useStore((s) => s.getClinics());

  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [clinicId, setClinicId] = useState('');
  const [restoration, setRestoration] = useState('Crown');
  const [arch, setArch] = useState<'Upper' | 'Lower' | 'Both' | 'Maxilla' | 'Mandible'>('Both');
  const [shade, setShade] = useState('A2');
  const [units, setUnits] = useState(1);
  const [status, setStatus] = useState<OrderStatus>('New');
  const [priority, setPriority] = useState<Priority>('Normal');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (order) {
      setPatientId(order.patientId || '');
      setDoctorId(order.doctorId || '');
      setClinicId(order.clinicId || '');
      setRestoration(order.restoration || 'Crown');
      setArch((order.arch as any) || 'Both');
      setShade(order.shade || 'A2');
      setUnits(order.units || 1);
      setStatus(order.status || 'New');
      setPriority(order.priority || 'Normal');
      setDueDate(order.dueDate ? order.dueDate.split('T')[0] : '');
      setNotes(order.notes || '');
      setIsLocked(Boolean(order.isLocked));
    }
  }, [order]);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <p className="text-gray-500 mt-2">The requested order #{orderId} could not be located.</p>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Return to Orders</Button>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPatient = patients.find((p) => p.id === patientId);
    const selectedDoctor = doctors.find((d) => d.id === doctorId);
    const selectedClinic = clinics.find((c) => c.id === clinicId);

    store.updateOrder(order.id, {
      patientId: selectedPatient?.id || order.patientId,
      patientName: selectedPatient?.name || order.patientName,
      doctorId: selectedDoctor?.id || order.doctorId,
      doctorName: selectedDoctor?.name || order.doctorName,
      clinicId: selectedClinic?.id || order.clinicId,
      clinicName: selectedClinic?.name || order.clinicName,
      restoration,
      arch,
      shade,
      units,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : order.dueDate,
      notes,
      isLocked,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      navigate(`/orders/${order.id}`);
    }, 1200);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete order ${order.orderNumber}?`)) {
      store.deleteOrder(order.id);
      navigate('/orders');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Edit Prescription: {order.orderNumber}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Update case clinical parameters, technician assignments, and timeline
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-end sm:self-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsLocked(!isLocked)}
            className="gap-2"
          >
            {isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-gray-400" />}
            {isLocked ? 'Locked' : 'Unlocked'}
          </Button>
          <Button variant="danger" size="sm" onClick={handleDelete} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-5 h-5" />
          <span>Prescription details successfully updated! Redirecting to case view...</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        {/* Section 1: Clinical Parties */}
        <div>
          <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-4">
            Patient & Clinic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Patient
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Doctor
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Clinic
              </label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Restoration Specifications */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-4">
            Restoration Parameters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Restoration
              </label>
              <select
                value={restoration}
                onChange={(e) => setRestoration(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="Crown">Crown</option>
                <option value="Bridge">Bridge</option>
                <option value="Veneer">Veneer</option>
                <option value="Implant Crown">Implant Crown</option>
                <option value="Full Arch">Full Arch</option>
                <option value="Night Guard">Night Guard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Arch
              </label>
              <select
                value={arch}
                onChange={(e) => setArch(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                <option value="Maxilla">Maxilla (Upper)</option>
                <option value="Mandible">Mandible (Lower)</option>
                <option value="Both">Both Arches</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Shade
              </label>
              <select
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              >
                {['A1', 'A2', 'A3', 'A3.5', 'B1', 'B2', 'C1', 'D2', 'BL1'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Units Count
              </label>
              <input
                type="number"
                min="1"
                max="32"
                value={units}
                onChange={(e) => setUnits(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Pipeline & Schedule */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <h2 className="text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-4">
            Pipeline & Delivery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Workflow Stage
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium"
              >
                <option value="New">New</option>
                <option value="Review">Review</option>
                <option value="Design">Design</option>
                <option value="Production">Production</option>
                <option value="Quality Check">Quality Check</option>
                <option value="Ready">Ready</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Rush)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Target Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Clinical Notes */}
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase mb-1">
            Clinical Notes & Fabrication Instructions
          </label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            placeholder="Special instructions for technician..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Button type="button" variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
            Cancel
          </Button>
          <Button type="submit" className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
