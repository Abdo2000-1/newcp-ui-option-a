import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MoreVertical, Users, LayoutGrid, List } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Avatar } from '@/shared/components/Avatar';
import { Button } from '@/shared/components/Button';
import { Pagination } from '@/shared/components/Pagination';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDate } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';
import { TableTools, SortTh } from '@/shared/components/TableTools';
import { useAdvancedTable } from '@/shared/hooks/useAdvancedTable';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
];

const GENDER_OPTIONS = [
  { value: 'all', label: 'All Genders' },
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
];

const PATIENT_COLUMNS = [
  { id: 'name', label: 'Patient', defaultVisible: true },
  { id: 'contact', label: 'Contact', defaultVisible: true },
  { id: 'clinicName', label: 'Clinic / Doctor', defaultVisible: true },
  { id: 'ordersCount', label: 'Orders', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'lastVisit', label: 'Last Visit', defaultVisible: true },
  { id: 'actions', label: 'Actions', defaultVisible: true },
];

export default function Patients() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const allPatients = useStore(s => s.getPatients());

  const table = useAdvancedTable({
    data: allPatients || [],
    columns: PATIENT_COLUMNS,
    searchFields: ['name', 'email', 'clinicName', 'doctorName', 'phone', 'id'],
    filterConfigs: [
      { key: 'status', label: 'Status', options: STATUS_OPTIONS, defaultValue: 'all' },
      { key: 'gender', label: 'Gender', options: GENDER_OPTIONS, defaultValue: 'all' },
    ],
    pageSize: 10,
  });

  const patients = table.paginatedData;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', email: '', phone: '', clinicName: 'Bright Smile Dental' });

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name.trim()) return;
    store.createPatient({
      name: newPatient.name,
      email: newPatient.email,
      phone: newPatient.phone,
      clinicName: newPatient.clinicName,
      status: 'Active',
    });
    setShowAddModal(false);
    setNewPatient({ name: '', email: '', phone: '', clinicName: 'Bright Smile Dental' });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registered patients and dental case history ({allPatients?.length || 0} total)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Patient
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <TableTools
          table={table}
          searchPlaceholder="Search patients by name, clinic, doctor, email..."
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

        {patients.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 opacity-60" />}
            title="No patients found"
            description="Try adjusting your search or filters."
          />
        ) : viewMode === 'table' ? (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[650px] text-sm text-left text-gray-500 dark:text-gray-400 divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  {table.isColVisible('name') && (
                    <SortTh field="name" label="Patient" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('contact') && (
                    <th className="hidden sm:table-cell px-4 py-3">Contact</th>
                  )}
                  {table.isColVisible('clinicName') && (
                    <SortTh field="clinicName" label="Clinic / Doctor" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden md:table-cell" />
                  )}
                  {table.isColVisible('ordersCount') && (
                    <SortTh field="ordersCount" label="Orders" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden lg:table-cell text-center" />
                  )}
                  {table.isColVisible('status') && (
                    <SortTh field="status" label="Status" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} />
                  )}
                  {table.isColVisible('lastVisit') && (
                    <SortTh field="lastVisit" label="Last Visit" sortField={table.sortField} sortOrder={table.sortOrder} onSort={table.handleSort} className="hidden xl:table-cell" />
                  )}
                  {table.isColVisible('actions') && (
                    <th className="px-4 py-3 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {patients.map((patient: any) => (
                  <tr
                    key={patient.id}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    {table.isColVisible('name') && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={patient.name} size="sm" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white truncate max-w-[140px]">{patient.name}</div>
                            <div className="text-xs text-gray-500">{patient.gender === 'M' ? 'Male' : 'Female'}, {formatDate(patient.dob)}</div>
                          </div>
                        </div>
                      </td>
                    )}
                    {table.isColVisible('contact') && (
                      <td className="hidden sm:table-cell px-4 py-3">
                        <div className="text-gray-900 dark:text-white font-mono text-xs">{patient.phone}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[130px]">{patient.email}</div>
                      </td>
                    )}
                    {table.isColVisible('clinicName') && (
                      <td className="hidden md:table-cell px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[130px]">{patient.clinicName}</div>
                        <div className="text-gray-500 text-xs truncate max-w-[130px]">{patient.doctorName}</div>
                      </td>
                    )}
                    {table.isColVisible('ordersCount') && (
                      <td className="hidden lg:table-cell px-4 py-3 text-center font-semibold text-gray-900 dark:text-white">{patient.ordersCount}</td>
                    )}
                    {table.isColVisible('status') && (
                      <td className="px-4 py-3">
                        <StatusBadge status={patient.status} />
                      </td>
                    )}
                    {table.isColVisible('lastVisit') && (
                      <td className="hidden xl:table-cell px-4 py-3 text-xs font-mono">{patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}</td>
                    )}
                    {table.isColVisible('actions') && (
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }}>
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
            {patients.map((patient: any) => (
              <div 
                key={patient.id} 
                onClick={() => navigate(`/patients/${patient.id}`)}
                className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={patient.name} size="md" />
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-sm">{patient.name}</h4>
                        <span className="text-xs text-gray-400">{patient.gender === 'M' ? 'Male' : 'Female'} • {formatDate(patient.dob)}</span>
                      </div>
                    </div>
                    <StatusBadge status={patient.status} />
                  </div>

                  <div className="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 mt-2">
                    <p className="flex justify-between"><span className="text-gray-400">Phone:</span> <span className="font-mono">{patient.phone}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Email:</span> <span className="truncate max-w-[160px]">{patient.email}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Clinic:</span> <span>{patient.clinicName}</span></p>
                    <p className="flex justify-between"><span className="text-gray-400">Doctor:</span> <span>{patient.doctorName}</span></p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{patient.ordersCount} Orders</span>
                  <span className="text-gray-400">Visited {patient.lastVisit ? formatDate(patient.lastVisit) : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {patients.length > 0 && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <Pagination page={table.page} totalPages={table.totalPages} onPageChange={table.setPage} />
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Add New Patient</h3>
            <form onSubmit={handleSavePatient} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newPatient.name}
                  onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="e.g. john@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                  placeholder="e.g. +1 555-0199"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Save Patient</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
