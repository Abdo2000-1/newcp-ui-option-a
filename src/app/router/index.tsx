import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '@/app/shell/Layout';
import { LoadingState } from '@/shared/components/LoadingState';
import { useAuth, PendingAccessView } from '@/features/auth';
import { getPostHog } from '@/shared/observability';

// Feature Pages - Lazy Loaded
// Auth
const Login = lazy(() => import('@/features/auth/pages/Login'));
const Profile = lazy(() => import('@/features/auth/pages/Profile'));

// Orders & Cases
const Flow = lazy(() => import('@/features/orders/pages/Flow'));
const AddCase = lazy(() => import('@/features/orders/pages/AddCase'));
const EditCasePage = lazy(() => import('@/features/orders/pages/EditCasePage'));
const OrderDetailsPage = lazy(() => import('@/features/orders/pages/OrderDetailsPage'));
const ViewOrder = lazy(() => import('@/features/orders/pages/ViewOrder'));
const OrderWorkflow = lazy(() => import('@/features/orders/pages/OrderWorkflow'));
const OrderFiles = lazy(() => import('@/features/orders/pages/OrderFiles'));
const SubOrderDetail = lazy(() => import('@/features/orders/pages/SubOrderDetail'));
const Cases = lazy(() => import('@/features/orders/pages/Cases'));
const CaseDetails = lazy(() => import('@/features/orders/pages/CaseDetails'));
const WorkflowBoard = lazy(() => import('@/features/orders/pages/WorkflowBoard'));
const ChangeRequests = lazy(() => import('@/features/orders/pages/ChangeRequests'));

// Models
const Task47ModelWorkReport = lazy(() => import('@/features/models/pages/Task47ModelWorkReport'));

// Reporting
const Dashboard = lazy(() => import('@/features/reporting/pages/Dashboard'));
const Reports = lazy(() => import('@/features/reporting/pages/Reports'));
const QuarterTargetsReport = lazy(() => import('@/features/reporting/pages/QuarterTargetsReport'));
const Task31StaffTargets = lazy(() => import('@/features/reporting/pages/Task31StaffTargets'));

// Settings & Administration
const ConfigManager = lazy(() => import('@/features/settings/pages/ConfigManager'));
const CmsControls = lazy(() => import('@/features/settings/pages/CmsControls'));
const Settings = lazy(() => import('@/features/settings/pages/Settings'));
const Billing = lazy(() => import('@/features/settings/pages/Billing'));
const Clinics = lazy(() => import('@/features/settings/pages/Clinics'));
const ClinicDetails = lazy(() => import('@/features/settings/pages/ClinicDetails'));
const Doctors = lazy(() => import('@/features/settings/pages/Doctors'));
const DoctorDetails = lazy(() => import('@/features/settings/pages/DoctorDetails'));
const Patients = lazy(() => import('@/features/settings/pages/Patients'));
const PatientDetails = lazy(() => import('@/features/settings/pages/PatientDetails'));
const ScanCenter = lazy(() => import('@/features/settings/pages/ScanCenter'));
const Documents = lazy(() => import('@/features/settings/pages/Documents'));
const Notifications = lazy(() => import('@/features/settings/pages/Notifications'));

// System & Error Views (UIUX-REQ-021)
const HomePage = lazy(() => import('@/features/system/pages/HomePage'));
const NotFoundPage = lazy(() => import('@/features/system/pages/NotFoundPage'));
const Maintenance503Page = lazy(() => import('@/features/system/pages/Maintenance503Page'));

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  FLOW: '/flow',
  ORDERS: '/orders',
  ADD_CASE: '/add-case',
  EDIT_CASE: '/edit-case',
  ORDER_DETAILS: '/order-details',
  QUARTER_TARGETS: '/quarter-targets',
  TASK_47: '/task-47',
  TASK_31: '/task-31',
  PROFILE: '/profile',
  CONFIG_MANAGER: '/config-manager',
  CMS: '/cms',
  CASES: '/cases',
  BILLING: '/billing',
  CLINICS: '/clinics',
  DOCTORS: '/doctors',
  PATIENTS: '/patients',
  SCAN_CENTER: '/scan-center',
  DOCUMENTS: '/documents',
  NOTIFICATIONS: '/notifications',
  CHANGE_REQUESTS: '/change-requests',
  WORKFLOW_BOARD: '/workflow-board',
  REPORTS: '/reports',
  SETTINGS: '/settings',
  NOT_FOUND: '/404',
  MAINTENANCE: '/503',
} as const;


export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { status, isAuthenticated, isPendingAccess } = useAuth();
  const location = useLocation();
  const isPublicSystemRoute = ['/503', '/maintenance', '/404'].includes(location.pathname);
  if (isPublicSystemRoute) return <>{children}</>;
  const legacyAuth = typeof window !== 'undefined' && localStorage.getItem('3ddx-auth') === 'true';

  if (isPendingAccess) {
    return <PendingAccessView />;
  }

  if (!isAuthenticated && !legacyAuth && status !== 'authenticating') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoadingState text="Loading 3DDX CP Module..." />}>{children}</Suspense>;
}

export function LegacyTaskQueryHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const task = searchParams.get('task');
    if (task && location.pathname === '/') {
      const taskLower = task.toLowerCase();
      if (taskLower === 'flow') {
        navigate('/flow', { replace: true });
      } else if (taskLower === 'addcase') {
        navigate('/add-case', { replace: true });
      } else if (taskLower === 'cpreportviewer') {
        navigate('/quarter-targets', { replace: true });
      } else if (task === '47') {
        navigate('/task-47', { replace: true });
      } else if (task === '31') {
        navigate('/task-31', { replace: true });
      } else if (taskLower === 'editcase') {
        navigate(`/edit-case?${searchParams.toString()}`, { replace: true });
      }
    }
  }, [searchParams, location.pathname, navigate]);

  return null;
}

function RouteTelemetryTracker() {
  const location = useLocation();

  useEffect(() => {
    getPostHog().capturePageView(location.pathname);
  }, [location.pathname]);

  return null;
}

export function AppRouter() {
  return (
    <>
      <RouteTelemetryTracker />
      <LegacyTaskQueryHandler />
      <Routes>
        <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* Default landing: 3DDX CP Login */}
          <Route index element={<Navigate to="/home" replace />} />
          
          {/* 8 Target Modernized Pages */}
          <Route path="home" element={<SuspenseWrapper><HomePage /></SuspenseWrapper>} />
          <Route path="flow" element={<SuspenseWrapper><Flow /></SuspenseWrapper>} />
          <Route path="orders" element={<SuspenseWrapper><Flow /></SuspenseWrapper>} />
          <Route path="add-case" element={<SuspenseWrapper><AddCase /></SuspenseWrapper>} />
          <Route path="order-details" element={<SuspenseWrapper><OrderDetailsPage /></SuspenseWrapper>} />
          <Route path="quarter-targets" element={<SuspenseWrapper><QuarterTargetsReport /></SuspenseWrapper>} />
          <Route path="task-47" element={<SuspenseWrapper><Task47ModelWorkReport /></SuspenseWrapper>} />
          <Route path="task-31" element={<SuspenseWrapper><Task31StaffTargets /></SuspenseWrapper>} />
          <Route path="edit-case" element={<SuspenseWrapper><EditCasePage /></SuspenseWrapper>} />
          <Route path="dashboard" element={<SuspenseWrapper><Dashboard /></SuspenseWrapper>} />
          <Route path="profile" element={<SuspenseWrapper><Profile /></SuspenseWrapper>} />
          <Route path="config-manager" element={<SuspenseWrapper><ConfigManager /></SuspenseWrapper>} />
          <Route path="cms" element={<SuspenseWrapper><CmsControls /></SuspenseWrapper>} />

          {/* Auxiliary ERP & CRM Routes */}
          <Route path="orders/:orderId" element={<SuspenseWrapper><ViewOrder /></SuspenseWrapper>} />
          <Route path="orders/:orderId/workflow" element={<SuspenseWrapper><OrderWorkflow /></SuspenseWrapper>} />
          <Route path="orders/:orderId/files" element={<SuspenseWrapper><OrderFiles /></SuspenseWrapper>} />
          <Route path="orders/:orderId/sub-orders/:subOrderId" element={<SuspenseWrapper><SubOrderDetail /></SuspenseWrapper>} />
          <Route path="cases" element={<SuspenseWrapper><Cases /></SuspenseWrapper>} />
          <Route path="cases/:caseId" element={<SuspenseWrapper><CaseDetails /></SuspenseWrapper>} />
          <Route path="patients" element={<SuspenseWrapper><Patients /></SuspenseWrapper>} />
          <Route path="patients/:patientId" element={<SuspenseWrapper><PatientDetails /></SuspenseWrapper>} />
          <Route path="doctors" element={<SuspenseWrapper><Doctors /></SuspenseWrapper>} />
          <Route path="doctors/:doctorId" element={<SuspenseWrapper><DoctorDetails /></SuspenseWrapper>} />
          <Route path="clinics" element={<SuspenseWrapper><Clinics /></SuspenseWrapper>} />
          <Route path="clinics/:clinicId" element={<SuspenseWrapper><ClinicDetails /></SuspenseWrapper>} />
          <Route path="billing" element={<SuspenseWrapper><Billing /></SuspenseWrapper>} />
          <Route path="reports" element={<SuspenseWrapper><Reports /></SuspenseWrapper>} />
          <Route path="settings" element={<SuspenseWrapper><Settings /></SuspenseWrapper>} />
          <Route path="notifications" element={<SuspenseWrapper><Notifications /></SuspenseWrapper>} />
          <Route path="change-requests" element={<SuspenseWrapper><ChangeRequests /></SuspenseWrapper>} />
          <Route path="scan-center" element={<SuspenseWrapper><ScanCenter /></SuspenseWrapper>} />
          <Route path="workflow-board" element={<SuspenseWrapper><WorkflowBoard /></SuspenseWrapper>} />
          <Route path="documents" element={<SuspenseWrapper><Documents /></SuspenseWrapper>} />
          <Route path="503" element={<SuspenseWrapper><Maintenance503Page /></SuspenseWrapper>} />
          <Route path="maintenance" element={<SuspenseWrapper><Maintenance503Page /></SuspenseWrapper>} />
          <Route path="404" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
          <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
        </Route>
        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
    </>
  );
}
