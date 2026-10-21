import type { Order, SubOrder, Patient, Case, BillingRecord, Doctor, Clinic, LabDocument, Notification, ChangeRequest, ScanCenter, ReportsData, MonthlyVolume } from '@/shared/types';

const fetchJson = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
};

export const api = {
  getOrders: () => fetchJson<Order[]>('/data/orders.json'),
  getOrderById: async (id: string) => {
    const orders = await fetchJson<Order[]>('/data/orders.json');
    return orders.find(o => o.id === id);
  },
  getSubOrders: () => fetchJson<SubOrder[]>('/data/sub-orders.json'),
  getSubOrdersByOrderId: async (orderId: string) => {
    const subs = await fetchJson<SubOrder[]>('/data/sub-orders.json');
    return subs.filter(s => s.orderId === orderId);
  },
  getPatients: () => fetchJson<Patient[]>('/data/patients.json'),
  getPatientById: async (id: string) => {
    const patients = await fetchJson<Patient[]>('/data/patients.json');
    return patients.find(p => p.id === id);
  },
  getCases: () => fetchJson<Case[]>('/data/cases.json'),
  getCaseById: async (id: string) => {
    const cases = await fetchJson<Case[]>('/data/cases.json');
    return cases.find(c => c.id === id);
  },
  getBilling: () => fetchJson<BillingRecord[]>('/data/billing.json'),
  getDoctors: () => fetchJson<Doctor[]>('/data/doctors.json'),
  getDoctorById: async (id: string) => {
    const doctors = await fetchJson<Doctor[]>('/data/doctors.json');
    return doctors.find(d => d.id === id);
  },
  getClinics: () => fetchJson<Clinic[]>('/data/clinics.json'),
  getClinicById: async (id: string) => {
    const clinics = await fetchJson<Clinic[]>('/data/clinics.json');
    return clinics.find(c => c.id === id);
  },
  getDocuments: () => fetchJson<LabDocument[]>('/data/documents.json'),
  getNotifications: () => fetchJson<Notification[]>('/data/notifications.json'),
  getChangeRequests: () => fetchJson<ChangeRequest[]>('/data/change-requests.json'),
  getScanCenters: () => fetchJson<ScanCenter[]>('/data/scan-centers.json'),
  getReports: () => fetchJson<ReportsData>('/data/reports.json'),
  getDashboardVolume: () => fetchJson<MonthlyVolume[]>('/data/dashboard-volume.json'),
  getCase: async (id: string) => {
    const cases = await fetchJson<Case[]>('/data/cases.json');
    return cases.find(c => c.id === id);
  },
  patients: () => fetchJson<Patient[]>('/data/patients.json'),
  orders: () => fetchJson<Order[]>('/data/orders.json'),
  cases: () => fetchJson<Case[]>('/data/cases.json'),
  doctors: () => fetchJson<Doctor[]>('/data/doctors.json'),
  clinics: () => fetchJson<Clinic[]>('/data/clinics.json'),
};
