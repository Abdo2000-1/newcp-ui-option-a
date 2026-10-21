import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Trash2, 
  FileCode, 
  FileText, 
  CheckCircle2, 
  Clock, 
  HardDrive,
  Eye,
  Plus
} from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { useStore } from '@/shared/hooks/useStore';
import { formatDate } from '@/shared/utils/format';

interface OrderFileEntry {
  id: string;
  name: string;
  type: 'STL' | 'PLY' | 'PDF' | 'IMAGE';
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  category: 'Scans' | 'Designs' | 'Prescriptions';
}

const INITIAL_FILES: OrderFileEntry[] = [
  { id: 'f1', name: 'upper_arch_maxilla_scan.stl', type: 'STL', size: '14.2 MB', uploadedAt: '2025-02-12T10:30:00Z', uploadedBy: 'Dr. Marcus Webb', category: 'Scans' },
  { id: 'f2', name: 'lower_arch_mandible_scan.stl', type: 'STL', size: '12.8 MB', uploadedAt: '2025-02-12T10:31:00Z', uploadedBy: 'Dr. Marcus Webb', category: 'Scans' },
  { id: 'f3', name: 'bite_registration_scan.ply', type: 'PLY', size: '4.5 MB', uploadedAt: '2025-02-12T10:32:00Z', uploadedBy: 'Dr. Marcus Webb', category: 'Scans' },
  { id: 'f4', name: 'cad_crown_design_v2.stl', type: 'STL', size: '8.1 MB', uploadedAt: '2025-02-13T14:15:00Z', uploadedBy: 'T. Anderson (CAD Lead)', category: 'Designs' },
  { id: 'f5', name: 'clinical_rx_prescription_signed.pdf', type: 'PDF', size: '420 KB', uploadedAt: '2025-02-12T09:45:00Z', uploadedBy: 'Clinic Reception', category: 'Prescriptions' },
];

export default function OrderFiles() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const orders = useStore((s) => s.getOrders());
  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);

  const [files, setFiles] = useState<OrderFileEntry[]>(INITIAL_FILES);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!order) {
    return (
      <div className="p-8 text-center bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/orders')}>Return to Orders</Button>
      </div>
    );
  }

  const filteredFiles = files.filter((f) => {
    if (filterCategory === 'all') return true;
    return f.category === filterCategory;
  });

  const handleDownload = (file: OrderFileEntry) => {
    const dummyContent = `// 3DDX Dental Cad Model File: ${file.name}\n// Order ID: ${order.orderNumber}\n// Generated: ${new Date().toISOString()}`;
    const blob = new Blob([dummyContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const uploaded = Array.from(e.target.files);
    setIsUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          setTimeout(() => {
            const newEntries: OrderFileEntry[] = uploaded.map((f, i) => ({
              id: `f-${Date.now()}-${i}`,
              name: f.name,
              type: f.name.endsWith('.stl') ? 'STL' : f.name.endsWith('.ply') ? 'PLY' : 'PDF',
              size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'Current Operator',
              category: f.name.endsWith('.pdf') ? 'Prescriptions' : 'Scans',
            }));
            setFiles((prev) => [...newEntries, ...prev]);
            setIsUploading(false);
            setUploadProgress(0);
          }, 400);
          return 100;
        }
        return p + 25;
      });
    }, 150);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${order.id}`)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Digital Assets & 3D Models: {order.orderNumber}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Intraoral scans, CAD design outputs, and laboratory documentation
            </p>
          </div>
        </div>

        <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold cursor-pointer shadow-sm transition-colors">
          <Plus className="w-4 h-4" />
          <span>Upload New Assets</span>
          <input type="file" multiple onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Uploading Status Bar */}
      {isUploading && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm">
          <div className="flex justify-between items-center text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">
            <span>Uploading digital scan file(s)...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'all', label: 'All Assets', count: files.length },
          { id: 'Scans', label: 'Intraoral Scans (.STL/.PLY)', count: files.filter(f => f.category === 'Scans').length },
          { id: 'Designs', label: 'CAD Designs', count: files.filter(f => f.category === 'Designs').length },
          { id: 'Prescriptions', label: 'Prescriptions & PDFs', count: files.filter(f => f.category === 'Prescriptions').length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              filterCategory === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <span>{tab.label}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[11px] bg-gray-100 dark:bg-gray-800">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* File List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {filteredFiles.map((file) => (
            <div 
              key={file.id} 
              className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                  {file.type === 'PDF' ? <FileText className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    <span className="font-medium text-gray-600 dark:text-gray-300">{file.size}</span>
                    <span>•</span>
                    <span>Uploaded by {file.uploadedBy}</span>
                    <span>•</span>
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleDownload(file)}
                  className="gap-1.5 text-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => handleDelete(file.id)}
                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
