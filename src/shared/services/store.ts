import type { Order, Patient, Doctor, Clinic, Case, BillingRecord, ChangeRequest, Notification, ScanCenter, ReportsData, MonthlyVolume, OrderStatus, Priority, UserProfile } from '@/shared/types';
import { api } from './api';

const STORAGE_PREFIX = 'dentalab_store_';

class ReactiveStore {
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  private orders: Order[] = [];
  private patients: Patient[] = [];
  private doctors: Doctor[] = [];
  private clinics: Clinic[] = [];
  private cases: Case[] = [];
  private billing: BillingRecord[] = [];
  private changeRequests: ChangeRequest[] = [];
  private notifications: Notification[] = [];
  private scanCenters: ScanCenter[] = [];
  private reports: ReportsData | null = null;
  private volume: MonthlyVolume[] = [];
  private profile: UserProfile = {
    firstName: 'Jessica',
    lastName: 'Ruiz',
    email: 'j.ruiz@dentalab-cad.com',
    phone: '+1 (555) 749-3821',
    role: 'Lab Director',
    specialty: 'Orthodontics & 3D CAD/CAM',
    licenseNumber: 'CAD-DL-89421',
    avatarInitials: 'JR',
    bio: 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.',
  };

  constructor() {
    this.init();
  }

  private getStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private setStorage(key: string, data: any): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  public async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const [
        savedOrders,
        savedPatients,
        savedDoctors,
        savedClinics,
        savedCases,
        savedBilling,
        savedCRs,
        savedNotifs,
        savedCenters,
        savedReports,
        savedVolume,
      ] = [
        this.getStorage<Order[]>('orders'),
        this.getStorage<Patient[]>('patients'),
        this.getStorage<Doctor[]>('doctors'),
        this.getStorage<Clinic[]>('clinics'),
        this.getStorage<Case[]>('cases'),
        this.getStorage<BillingRecord[]>('billing'),
        this.getStorage<ChangeRequest[]>('changeRequests'),
        this.getStorage<Notification[]>('notifications'),
        this.getStorage<ScanCenter[]>('scanCenters'),
        this.getStorage<ReportsData>('reports'),
        this.getStorage<MonthlyVolume[]>('volume'),
      ];

      this.orders = savedOrders || await api.getOrders();
      this.patients = savedPatients || await api.getPatients();
      this.doctors = savedDoctors || await api.getDoctors();
      this.clinics = savedClinics || await api.getClinics();
      this.cases = savedCases || await api.getCases();
      this.billing = savedBilling || await api.getBilling();
      this.changeRequests = savedCRs || await api.getChangeRequests();
      this.notifications = savedNotifs || await api.getNotifications();
      this.scanCenters = savedCenters || await api.getScanCenters();
      this.reports = savedReports || await api.getReports();
      this.volume = savedVolume || await api.getDashboardVolume();

      const savedProfile = this.getStorage<UserProfile>('profile');
      if (savedProfile) {
        this.profile = { ...this.profile, ...savedProfile };
      }

      this.initialized = true;
      this.notify();
    } catch (err) {
      console.error('Failed to initialize ReactiveStore:', err);
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(fn => fn());
  }

  // --- Orders ---
  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id || o.orderNumber === id);
  }

  public createOrder(orderData: Partial<Order>): Order {
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `DL-${Math.floor(100000 + Math.random() * 900000)}`,
      patientId: orderData.patientId || 'pt-1',
      patientName: orderData.patientName || 'Default Patient',
      doctorId: orderData.doctorId || 'dr-1',
      doctorName: orderData.doctorName || 'Dr. Allison Park',
      clinicId: orderData.clinicId || 'cl-1',
      clinicName: orderData.clinicName || 'Bright Smile Dental',
      scanCenterId: orderData.scanCenterId || 'sc-1',
      scanCenterName: orderData.scanCenterName || 'Downtown Imaging',
      status: (orderData.status as OrderStatus) || 'New',
      priority: (orderData.priority as Priority) || 'Normal',
      restoration: orderData.restoration || 'Crown',
      arch: orderData.arch || 'Both',
      shade: orderData.shade || 'A2',
      units: orderData.units || 1,
      amount: orderData.amount || 320,
      format: orderData.format || 'Digital',
      receivedAt: new Date().toISOString(),
      dueDate: orderData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      notes: orderData.notes || '',
      billed: false,
      billTo: 'Clinic',
      vouchers: 0,
      isLocked: false,
      hasNotes: Boolean(orderData.notes),
      ...orderData,
    };

    this.orders = [newOrder, ...this.orders];
    this.setStorage('orders', this.orders);

    // Also automatically create a billing entry
    this.createBillingRecord({
      orderId: newOrder.id,
      orderNumber: newOrder.orderNumber,
      patientName: newOrder.patientName,
      doctorName: newOrder.doctorName,
      clinicName: newOrder.clinicName,
      amount: newOrder.amount,
      status: 'Pending',
      dueDate: newOrder.dueDate,
    });

    // Also create a notification
    this.createNotification({
      type: 'order',
      title: `New Order ${newOrder.orderNumber}`,
      message: `Prescription created for ${newOrder.patientName} (${newOrder.restoration})`,
      relatedId: newOrder.id,
    });

    this.notify();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: OrderStatus): void {
    this.orders = this.orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return { ...o, status, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    this.setStorage('orders', this.orders);
    this.notify();
  }

  public updateOrder(orderId: string, updates: Partial<Order>): void {
    this.orders = this.orders.map(o => {
      if (o.id === orderId || o.orderNumber === orderId) {
        return { ...o, ...updates, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    this.setStorage('orders', this.orders);
    this.notify();
  }

  public deleteOrder(orderId: string): void {
    this.orders = this.orders.filter(o => o.id !== orderId && o.orderNumber !== orderId);
    this.setStorage('orders', this.orders);
    this.notify();
  }

  // --- Patients ---
  public getPatients(): Patient[] {
    return [...this.patients];
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find(p => p.id === id);
  }

  public createPatient(patientData: Partial<Patient>): Patient {
    const newPt: Patient = {
      id: `pt-${Date.now()}`,
      name: patientData.name || 'New Patient',
      email: patientData.email || '',
      phone: patientData.phone || '',
      dob: patientData.dob || '1990-01-01',
      gender: patientData.gender || 'M',
      clinicId: patientData.clinicId || 'cl-1',
      clinicName: patientData.clinicName || 'Bright Smile Dental',
      doctorId: patientData.doctorId || 'dr-1',
      doctorName: patientData.doctorName || 'Dr. Allison Park',
      status: patientData.status || 'Active',
      ordersCount: 0,
      lastVisit: new Date().toISOString(),
      ...patientData,
    };
    this.patients = [newPt, ...this.patients];
    this.setStorage('patients', this.patients);
    this.notify();
    return newPt;
  }

  // --- Doctors ---
  public getDoctors(): Doctor[] {
    return [...this.doctors];
  }

  public getDoctorById(id: string): Doctor | undefined {
    return this.doctors.find(d => d.id === id);
  }

  public createDoctor(docData: Partial<Doctor>): Doctor {
    const newDoc: Doctor = {
      id: `dr-${Date.now()}`,
      name: docData.name?.startsWith('Dr.') ? docData.name : `Dr. ${docData.name || 'Dentist'}`,
      specialty: docData.specialty || 'General Dentistry',
      clinicId: docData.clinicId || 'cl-1',
      clinicName: docData.clinicName || 'Bright Smile Dental',
      email: docData.email || '',
      phone: docData.phone || '',
      status: docData.status || 'Active',
      ordersCount: 0,
      joinedDate: new Date().toISOString(),
      avatar: '',
      ...docData,
    };
    this.doctors = [newDoc, ...this.doctors];
    this.setStorage('doctors', this.doctors);
    this.notify();
    return newDoc;
  }

  // --- Clinics ---
  public getClinics(): Clinic[] {
    return [...this.clinics];
  }

  public getClinicById(id: string): Clinic | undefined {
    return this.clinics.find(c => c.id === id);
  }

  // --- Cases ---
  public getCases(): Case[] {
    return [...this.cases];
  }

  public getCaseById(id: string): Case | undefined {
    return this.cases.find(c => c.id === id);
  }

  public createCase(caseData: Partial<Case>): Case {
    const newCase: Case = {
      id: `case-${Date.now()}`,
      caseNumber: `CS-${Math.floor(10000 + Math.random() * 90000)}`,
      title: caseData.title || 'New Dental Case',
      patientId: caseData.patientId || 'pt-1',
      patientName: caseData.patientName || 'Default Patient',
      doctorId: caseData.doctorId || 'dr-1',
      doctorName: caseData.doctorName || 'Dr. Allison Park',
      clinicId: caseData.clinicId || 'cl-1',
      clinicName: caseData.clinicName || 'Bright Smile Dental',
      status: caseData.status || 'Open',
      priority: caseData.priority || 'Normal',
      ordersCount: 0,
      filesCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: caseData.notes || '',
      ...caseData,
    };
    this.cases = [newCase, ...this.cases];
    this.setStorage('cases', this.cases);
    this.notify();
    return newCase;
  }

  public addCaseNote(caseId: string, noteContent: string): void {
    this.cases = this.cases.map(c => {
      if (c.id === caseId) {
        return { ...c, notes: c.notes ? `${c.notes}\n${noteContent}` : noteContent, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    this.setStorage('cases', this.cases);
    this.notify();
  }

  // --- Billing ---
  public getBilling(): BillingRecord[] {
    return [...this.billing];
  }

  public createBillingRecord(data: Partial<BillingRecord>): BillingRecord {
    const newBill: BillingRecord = {
      id: `bill-${Date.now()}`,
      orderId: data.orderId || 'ord-1',
      orderNumber: data.orderNumber || 'DL-000000',
      patientName: data.patientName || '',
      doctorName: data.doctorName || '',
      clinicName: data.clinicName || '',
      amount: data.amount || 0,
      status: data.status || 'Pending',
      invoiceNumber: data.invoiceNumber || `INV-${Math.floor(10000 + Math.random() * 90000)}`,
      invoiceDate: new Date().toISOString(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 86400000).toISOString(),
      paidDate: null,
      vouchers: 0,
      notes: data.notes || '',
    };
    this.billing = [newBill, ...this.billing];
    this.setStorage('billing', this.billing);
    this.notify();
    return newBill;
  }

  public updateBillingStatus(id: string, status: 'Paid' | 'Pending' | 'Invoiced' | 'Overdue'): void {
    this.billing = this.billing.map(b => {
      if (b.id === id || b.invoiceNumber === id) {
        return { 
          ...b, 
          status, 
          paidDate: status === 'Paid' ? new Date().toISOString() : b.paidDate 
        };
      }
      return b;
    });
    this.setStorage('billing', this.billing);
    this.notify();
  }

  // --- Change Requests ---
  public getChangeRequests(): ChangeRequest[] {
    return [...this.changeRequests];
  }

  public updateChangeRequestStatus(id: string, status: 'Approved' | 'Rejected' | 'In Review' | 'Completed'): void {
    this.changeRequests = this.changeRequests.map(cr => {
      if (cr.id === id) {
        return { ...cr, status };
      }
      return cr;
    });
    this.setStorage('changeRequests', this.changeRequests);

    // If approved, update notification
    const req = this.changeRequests.find(r => r.id === id);
    if (req) {
      this.createNotification({
        type: 'change_request',
        title: `Change Request ${status}`,
        message: `Request for Order ${req.orderId} was marked as ${status}`,
        relatedId: req.orderId,
      });
    }

    this.notify();
  }

  // --- Notifications ---
  public getNotifications(): Notification[] {
    return [...this.notifications];
  }

  public createNotification(notifData: Partial<Notification>): void {
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      title: notifData.title || 'Notification',
      message: notifData.message || '',
      type: notifData.type || 'system',
      read: false,
      createdAt: new Date().toISOString(),
      relatedId: notifData.relatedId,
    };
    this.notifications = [newNotif, ...this.notifications];
    this.setStorage('notifications', this.notifications);
    this.notify();
  }

  public markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    this.setStorage('notifications', this.notifications);
    this.notify();
  }

  public markAllNotificationsAsRead(): void {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.setStorage('notifications', this.notifications);
    this.notify();
  }

  // --- Scan Centers, Reports, Volume ---
  public getScanCenters(): ScanCenter[] {
    return [...this.scanCenters];
  }

  public getReports(): ReportsData | null {
    return this.reports;
  }

  public getDashboardVolume(): MonthlyVolume[] {
    return [...this.volume];
  }

  // --- Profile ---
  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public updateProfile(data: Partial<UserProfile>): UserProfile {
    this.profile = { ...this.profile, ...data };
    this.setStorage('profile', this.profile);
    this.notify();
    return { ...this.profile };
  }

  // Reset demo data to factory defaults
  public resetToFactoryDefaults(): void {
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORAGE_PREFIX))
      .forEach(k => localStorage.removeItem(k));
    this.initialized = false;
    this.init();
  }
}

export const store = new ReactiveStore();
