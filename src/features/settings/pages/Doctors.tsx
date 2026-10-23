import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Stethoscope, LayoutGrid, List } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Pagination';
import { EmptyState } from '@/shared/components/EmptyState';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable } from '@/shared/hooks/useAdvancedTable';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const SPECIALTY_OPTIONS = [
  { value: 'all', label: 'All Specialties' },
  { value: 'Prosthodontics', label: 'Prosthodontics' },
  { value: 'Orthodontics', label: 'Orthodontics' },
  { value: 'Endodontics', label: 'Endodontics' },
  { value: 'Oral Surgery', label: 'Oral Surgery' },
  { value: 'Periodontics', label: 'Periodontics' },
  { value: 'General Dentistry', label: 'General Dentistry' },
];

const DOCTOR_COLUMNS = [
  { id: 'name', label: 'Doctor', defaultVisible: true },
  { id: 'specialty', label: 'Specialty', defaultVisible: true },
  { id: 'clinicName', label: 'Clinic', defaultVisible: true },
  { id: 'contact', label: 'Contact', defaultVisible: true },
  { id: 'ordersCount', label: 'Orders', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'actions', label: 'Actions', defaultVisible: true },
];

export default function Doctors() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const allDoctors = useStore(s => s.getDoctors());

  const table = useAdvancedTable({
    data: allDoctors || [],
    columns: DOCTOR_COLUMNS,
    searchFields: ['name', 'specialty', 'clinicName', 'email', 'phone', 'id'],
    filterConfigs: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS, defaultValue: 'all' },
      { key: 'specialty', label: 'Specialty', options: SPECIALTY_OPTIONS, defaultValue: 'all' },
    ],
    pageSize: 10,
  });

  const doctors = table.paginatedData;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialty: 'Prosthodontics', clinicName: 'Bright Smile Dental', email: '', phone: '' });

  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoctor.name.trim()) return;
    store.createDoctor({
      name: newDoctor.name,
      specialty: newDoctor.specialty,
      clinicName: newDoctor.clinicName,
      email: newDoctor.email,
      phone: newDoctor.phone,
      status: 'Active',
    });
    setShowAddModal(false);
    setNewDoctor({ name: '', specialty: 'Prosthodontics', clinicName: 'Bright Smile Dental', email: '', phone: '' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-7xl mx-auto w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Prescribing dentists and partner clinicians ({allDoctors?.length || 0} total)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Doctor
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableTools
          table={table}
          searchPlaceholder="Search doctors by name, clinic, email, phone..."
          rightActions={
            <div className="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-gray-50 dark:bg-gray-900 shrink-0">
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {doctors.length === 0 ? (
          <EmptyState
            icon={<Stethoscope className="w-8 h-8 opacity-60" />}
            title="No doctors found"
            description="Try adjusting your search or filters."
          />
        ) : viewMode === 'table' ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm text-left text-gray-500 dark:text-gray-400 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  {table.isColVisible('name') && (
                    <SortTh field="name" label="Doctor" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('specialty') && (
                    <SortTh field="specialty" label="Specialty" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden sm:table-cell" />
                  )}
                  {table.isColVisible('clinicName') && (
                    <SortTh field="clinicName" label="Clinic" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden md:table-cell" />
                  )}
                  {table.isColVisible('contact') && (
                    <th className="hidden lg:table-cell px-4 py-3">Contact</th>
                  )}
                  {table.isColVisible('ordersCount') && (
                    <SortTh field="ordersCount" label="Orders" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden xl:table-cell text-center" />
                  )}
                  {table.isColVisible('status') && (
                    <SortTh field="status" label="Status" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('actions') && (
                    <th className="px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {doctors.map((doctor: any) => (
                  <tr
                    key={doctor.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/doctors/${doctor.id}`)}
                  >
                    {table.isColVisible('name') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={doctor.name} size="sm" variant="primary" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{doctor.name}</div>
                            <div className="text-xs text-gray-400">{doctor.id}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {table.isColVisible('specialty') && (
                      <td className="hidden sm:table-cell px-4 py-3 font-medium text-gray-700 dark:text-gray-300">{doctor.specialty}</td>
                    )}
                    {table.isColVisible('clinicName') && (
                      <td className="hidden md:table-cell px-4 py-3 truncate max-w-[140px]">{doctor.clinicName}</td>
                    )}
                    {table.isColVisible('contact') && (
                      <td className="hidden lg:table-cell px-4 py-3">
                        <div className="text-gray-900 dark:text-white font-mono text-xs">{doctor.phone}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[140px]">{doctor.email}</div>
                      </td>
                    )}
                    {table.isColVisible('ordersCount') && (
                      <td className="hidden xl:table-cell px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{doctor.ordersCount}</td>
                    )}
                    {table.isColVisible('status') && (
                      <td className="px-4 py-3">
                        <StatusBadge status={doctor.status} />
                      </td>
                    )}
                    {table.isColVisible('actions') && (
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/doctors/${doctor.id}`); }}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doctor: any) => (
              <div 
                key={doctor.id} 
                onClick={() => navigate(`/doctors/${doctor.id}`)}
                className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={doctor.name} size="md" variant="primary" />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{doctor.name}</h4>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{doctor.specialty}</span>
                      </div>
                    </div>
                    <StatusBadge status={doctor.status} />
                  </div>

                  <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 mt-2">
                    <p className="flex justify-between"><span className="text-gray-400">Clinic:</span> <span>{doctor.clinicName}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Phone:</span> <span className="font-mono">{doctor.phone}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Email:</span> <span className="truncate max-w-[160px]">{doctor.email}</span></p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{doctor.ordersCount} Total Orders</span>
                  <span className="text-gray-400 font-mono">{doctor.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {doctors.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add Partner Doctor</h3>
            <form onSubmit={handleSaveDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor Name</label>
                <input
                  type="text"
                  required
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="e.g. Dr. Robert Vance"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specialty</label>
                <input
                  type="text"
                  value={newDoctor.specialty}
                  onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newDoctor.email}
                  onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="doctor@clinic.com"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Save Doctor</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
