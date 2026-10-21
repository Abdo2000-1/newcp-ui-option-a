import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, FileText, Activity, MessageSquare, Layout, 
  Download, Plus, Clock, Paperclip
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { PriorityBadge } from '@/shared/components/PriorityBadge';
import { LoadingState } from '@/shared/components/LoadingState';
import { Avatar } from '@/shared/components/Avatar';
import { timeAgo, formatDate, getInitials } from '@/shared/utils/format';
import { api } from '@/shared/services/api';
import { useFetch } from '@/shared/hooks/useFetch';

export default function CaseDetails() {
  const { caseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [newNote, setNewNote] = useState('');
  const [notesList, setNotesList] = useState<{ id: string; author: string; content: string; createdAt: string }[]>([]);

  const { data: caseData, loading } = useFetch(() => api.getCase(caseId as string));
  const { data: allOrders } = useFetch(api.getOrders);
  const { data: allDocs } = useFetch(api.getDocuments);

  if (loading) return <LoadingState />;
  if (!caseData) return <div className="p-6 text-center text-gray-500">Case not found</div>;

  const caseOrders = (allOrders || []).filter(o => o.patientId === caseData.patientId || o.patientName === caseData.patientName);
  const caseFiles = (allDocs || []).filter(d => d.patientName === caseData.patientName);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Layout },
    { id: 'files', label: `Files (${caseFiles.length || caseData.filesCount || 0})`, icon: Paperclip },
    { id: 'notes', label: 'Notes', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotesList(prev => [
      {
        id: String(Date.now()),
        author: 'Jessica Ruiz',
        content: newNote.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setNewNote('');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={() => navigate('/cases')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.title}</h1>
            <StatusBadge status={caseData.status} />
            <PriorityBadge priority={caseData.priority} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Case #{caseData.caseNumber} • Created {formatDate(caseData.createdAt)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 inline-flex items-center gap-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Case Summary</h3>
                <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{caseData.notes || 'Full diagnostic and restorative treatment plan for patient.'}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Related Orders ({caseOrders.length})</h3>
                {caseOrders.length > 0 ? (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {caseOrders.map((order) => (
                      <li key={order.id} className="py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 px-2 rounded" onClick={() => navigate(`/orders/${order.id}`)}>
                        <div>
                          <p className="font-medium text-blue-600 dark:text-blue-400">{order.orderNumber}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{order.restoration} • {order.arch}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusBadge status={order.status} />
                          <PriorityBadge priority={order.priority} />
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No related orders linked to this patient.</p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Entities</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/patients/${caseData.patientId}`)}>
                    <Avatar name={caseData.patientName} size="md" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">{caseData.patientName}</p>
                      <p className="text-xs text-gray-500">Patient</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/doctors/${caseData.doctorId}`)}>
                    <Avatar name={caseData.doctorName} size="md" variant="success" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">{caseData.doctorName}</p>
                      <p className="text-xs text-gray-500">Doctor</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/clinics/${caseData.clinicId}`)}>
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600">{caseData.clinicName}</p>
                      <p className="text-xs text-gray-500">Clinic</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Case Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Status</dt>
                    <dd><StatusBadge status={caseData.status} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Priority</dt>
                    <dd><PriorityBadge priority={caseData.priority} /></dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total Orders</dt>
                    <dd className="font-semibold text-gray-900 dark:text-white">{caseData.ordersCount || caseOrders.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Last Updated</dt>
                    <dd className="text-gray-700 dark:text-gray-300">{timeAgo(caseData.updatedAt)}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'files' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Case Files</h3>
              <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" /> Upload File</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caseFiles.map((file) => (
                <div key={file.id} className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-400 transition-colors">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded mr-3">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{file.size} • {file.type}</p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {caseFiles.length === 0 && (
                <p className="text-sm text-gray-500 col-span-full py-8 text-center">No files uploaded yet for this case.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Note</h3>
              <textarea 
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                placeholder="Type your clinical or lab note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="mt-3 flex justify-end">
                <Button onClick={handleAddNote}>Add Note</Button>
              </div>
            </div>

            <div className="space-y-4">
              {caseData.notes && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={caseData.doctorName} size="sm" />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{caseData.doctorName}</span>
                    </div>
                    <span className="text-xs text-gray-500">{timeAgo(caseData.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{caseData.notes}</p>
                </div>
              )}
              {notesList.map((note) => (
                <div key={note.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar name={note.author} size="sm" />
                      <span className="font-medium text-sm text-gray-900 dark:text-white">{note.author}</span>
                    </div>
                    <span className="text-xs text-gray-500">{timeAgo(note.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 max-w-3xl">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Case Timeline</h3>
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-3 space-y-8">
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-100 border-2 border-blue-500 dark:bg-blue-900"></span>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Case Created</h4>
                  <time className="text-xs text-gray-500 flex items-center mt-1 sm:mt-0">
                    <Clock className="w-3 h-3 mr-1" /> {formatDate(caseData.createdAt)}
                  </time>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Created by {caseData.doctorName} at {caseData.clinicName}</p>
              </div>
              <div className="relative pl-6">
                <span className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-green-100 border-2 border-green-500 dark:bg-green-900"></span>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">Status Updated</h4>
                  <time className="text-xs text-gray-500 flex items-center mt-1 sm:mt-0">
                    <Clock className="w-3 h-3 mr-1" /> {timeAgo(caseData.updatedAt)}
                  </time>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Status set to {caseData.status}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
