// Order types
export type OrderStatus = 'New' | 'Review' | 'Design' | 'Production' | 'Quality Check' | 'Ready' | 'Completed' | 'Cancelled';
export type Priority = 'Low' | 'Normal' | 'High' | 'Urgent';
export type RestoType = 'Crown' | 'Bridge' | 'Veneer' | 'Implant Crown' | 'Full Arch' | 'Night Guard' | 'Inlay' | 'Onlay' | 'Partial Denture' | 'Complete Denture' | string;
export type ArchType = 'Maxilla' | 'Mandible' | 'Both' | 'Upper' | 'Lower';

export interface Order {
  id: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicId: string;
  clinicName: string;
  scanCenterId: string;
  scanCenterName: string;
  status: OrderStatus;
  priority: Priority;
  restoration: RestoType;
  arch: ArchType;
  format: string;
  shade: string;
  units: number;
  amount: number;
  billed: boolean;
  billedAmount?: number;
  billTo: string;
  vouchers: number;
  isLocked: boolean;
  hasNotes: boolean;
  notes: string;
  archiveDate?: string;
  receivedAt: string;
  sentAt?: string;
  updatedAt: string;
  chargedAt?: string;
  dueDate: string;
  changeRequest?: string;
  csTask?: string;
  technicianId?: string;
  technicianName?: string;
}

export type OrdersViewState = 'normal' | 'loading' | 'empty' | 'error';

// Sub-order types  
export type SubOrderStatus = 'done' | 'in-progress' | 'pending' | 'blocked';

export interface SubOrder {
  id: string;
  orderId?: string;
  service: string;
  icon: string;
  status: SubOrderStatus;
  formsComplete: number;
  formsTotal: number;
  scansComplete: number;
  scansTotal: number;
  teeth: number[];
  priority: Priority;
  dueDate: string;
  notes: string;
}

export interface OrderWorkflowStage {
  name: string;
  completed: boolean;
  active: boolean;
}

// Patient types
export type PatientStatus = 'Active' | 'Inactive';
export interface Patient {
  id: string; name: string; dob: string; gender: 'M' | 'F';
  phone: string; email: string; clinicId: string; clinicName: string;
  doctorId: string; doctorName: string; status: PatientStatus;
  ordersCount: number; lastVisit: string;
}

// Case types
export type CaseStatus = 'Open' | 'In Progress' | 'Review' | 'Closed';
export interface Case {
  id: string; caseNumber: string; title: string;
  patientId: string; patientName: string; doctorId: string;
  doctorName: string; clinicId: string; clinicName: string;
  status: CaseStatus; priority: Priority; ordersCount: number;
  filesCount: number; createdAt: string; updatedAt: string; notes: string;
}

// Billing types
export interface BillingRecord {
  id: string; orderId: string; orderNumber: string;
  patientName: string; doctorName: string; clinicName: string;
  amount: number; status: 'Pending' | 'Invoiced' | 'Paid' | 'Overdue' | 'Cancelled';
  invoiceNumber?: string; invoiceDate?: string; dueDate: string;
  paidDate?: string | null; vouchers: number; notes: string;
  isBillable?: boolean;
  billingAccountName?: string;
  billingAccountType?: 'Clinic' | 'Doctor' | 'ScanCenter' | 'DirectAccount';
}

// Doctor types
export type DoctorStatus = 'Active' | 'Inactive';
export interface Doctor {
  id: string; name: string; specialty: string; clinicId: string;
  clinicName: string; email: string; phone: string;
  status: DoctorStatus; ordersCount: number; joinedDate: string; avatar: string;
}

// Clinic types
export type ClinicStatus = 'Active' | 'Inactive';
export interface Clinic {
  id: string; name: string; address: string; city: string;
  phone: string; email: string; doctorsCount: number;
  patientsCount: number; ordersCount: number;
  status: ClinicStatus; accountManager: string;
}

// Document types
export type DocumentCategory = 'Prescriptions' | 'Scan Files' | 'Patient Photos' | 'Invoices' | 'Reports';
export interface LabDocument {
  id: string; name: string; category: DocumentCategory; type: string;
  size: string; date: string; doctor: string; patientName?: string;
  orderId?: string; orderNumber?: string; subOrderId?: string;
}

// Notification types
export type NotificationType = 'order' | 'workflow' | 'file' | 'billing' | 'system' | 'request' | 'change_request';
export interface Notification {
  id: string; type: NotificationType; title: string;
  message: string; read: boolean; createdAt: string;
  relatedId?: string; relatedType?: string;
}

// Report types
export interface RevenuePoint { month: string; revenue: number; }
export interface BreakdownSlice { name: string; value: number; }
export interface TurnaroundPoint { day: string; days: number; }
export interface StageShare { stage: string; count: number; percent: number; }
export interface ReportsData {
  monthlyRevenue: RevenuePoint[]; restorationBreakdown: BreakdownSlice[];
  turnaround: TurnaroundPoint[]; workflowShare: StageShare[];
}

// Change Request types
export interface ChangeRequest {
  id: string; requestNumber: string; orderId: string; orderNumber: string;
  patientName: string; requester: string;
  status: 'Pending' | 'In Review' | 'Approved' | 'Rejected' | 'Completed';
  priority: Priority; description: string; createdAt: string; updatedAt: string;
}

// Scan Center types
export interface ScanCenter {
  id: string; name: string; location: string; operator: string;
  devices: number; activeOrders: number; completedToday: number;
  status: 'Operational' | 'Maintenance';
}

// Dashboard types
export interface DashboardStats {
  totalOrders: number; inProgress: number; completed: number;
  avgTurnaroundDays: number; revenue: number; pendingBills: number;
}
export interface MonthlyVolume { month: string; orders: number; }

// Navigation types
export interface NavItem {
  id: string; label: string; icon: string; path: string; badge?: number;
}

export interface BreadcrumbItem {
  label: string; path?: string;
}

// Tooth types  
export type ToothJaw = 'upper' | 'lower';
export interface DentalTooth {
  id: string; number: number; jaw: ToothJaw;
  quadrant: 1 | 2 | 3 | 4;
  type: 'central-incisor' | 'lateral-incisor' | 'canine' | 'first-premolar' | 'second-premolar' | 'first-molar' | 'second-molar' | 'third-molar';
}

export const FDI_UPPER_NUMBERS = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28] as const;
export const FDI_LOWER_NUMBERS = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38] as const;

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  specialty: string;
  licenseNumber: string;
  avatarInitials: string;
  bio: string;
  avatarColor?: string;
}


export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errors?: Record<string, string[]>;
}
