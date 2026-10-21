import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, MapPin, Phone, Mail, Building2, User, ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { Button } from '@/shared/components/Button';
import { SearchInput } from '@/shared/components/SearchInput';
import { LoadingState } from '@/shared/components/LoadingState';
import { EmptyState } from '@/shared/components/EmptyState';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';

export default function Clinics() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: clinicsData, loading: isLoading } = useFetch(api.getClinics);

  if (isLoading) return <LoadingState text="Loading clinics..." />;

  const clinics = (clinicsData || []).filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Partner Clinics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Registered dental practices and account management ({clinicsData?.length || 0} clinics)
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-full sm:w-96">
          <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="Search clinics by name, city, address..." />
        </div>
      </div>

      {clinics.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-8">
          <EmptyState
            icon={<Building2 className="w-8 h-8 opacity-60" />}
            title="No clinics found"
            description="Try adjusting your search query."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((clinic) => (
            <motion.div 
              key={clinic.id}
              whileHover={{ y: -3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
              onClick={() => navigate(`/clinics/${clinic.id}`)}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">{clinic.name}</h3>
                      <span className="text-xs text-gray-400 font-mono">{clinic.id}</span>
                    </div>
                  </div>
                  <StatusBadge status={clinic.status} />
                </div>

                <div className="space-y-2 mb-6 text-sm text-gray-600 dark:text-gray-300 mt-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">{clinic.address}, {clinic.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono text-xs">{clinic.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs truncate">{clinic.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-xs">Manager: <strong className="font-medium text-gray-800 dark:text-gray-200">{clinic.accountManager}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                <div className="flex gap-4">
                  <span><strong>{clinic.doctorsCount}</strong> Doctors</span>
                  <span><strong>{clinic.patientsCount}</strong> Patients</span>
                  <span><strong>{clinic.ordersCount}</strong> Orders</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
