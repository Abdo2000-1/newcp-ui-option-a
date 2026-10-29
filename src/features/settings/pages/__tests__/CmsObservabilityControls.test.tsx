import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ConfigManager from '../ConfigManager';
import { AuthProvider, type UserSession } from '@/features/auth';
import { ConfigProvider } from '@/app/providers/contexts/ConfigContext';
import { ThemeProvider } from '@/app/providers/contexts/ThemeContext';
import { LanguageProvider } from '@/app/providers/contexts/LanguageContext';
import { validateAppConfig, DEFAULT_APP_CONFIG } from '@/shared/config/appConfig';
import { PostHogAdapter } from '@/shared/observability/posthog/posthogAdapter';

// Mock Sound
vi.mock('@/shared/utils/sound', () => ({
  sound: {
    playSuccess: vi.fn(),
    playClick: vi.fn(),
    playWarning: vi.fn(),
    playNotification: vi.fn(),
  },
}));

const mockAdminSession: UserSession = {
  userId: 'usr-admin-001',
  email: 'admin.demo@3ddx.com',
  fullName: 'Tenant Admin Operator',
  activeTenant: { id: 1, label: '3ddx.com' },
  tenantId: 1,
  family: 'ADMIN',
  roles: ['tenant_admin'],
  capabilities: [
    'orders.view',
    'services.models.edit',
    'services.conversion.edit',
    'pricing.override',
    'payer.assign',
    'workflow.transition',
    'reports.view_all',
    'reports.export',
    'iam.roles.assign',
  ],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const mockSeniorOpsSession: UserSession = {
  userId: 'usr-ops-001',
  email: 'ops.demo@3ddx.com',
  fullName: 'Senior Ops Specialist',
  activeTenant: { id: 1, label: '3ddx.com' },
  tenantId: 1,
  family: 'OPS',
  roles: ['ops_senior'],
  capabilities: [
    'orders.view',
    'services.models.edit',
    'services.conversion.edit',
    'pricing.override',
    'workflow.transition',
    'reports.view_all',
  ],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const mockOrdinarySession: UserSession = {
  userId: 'usr-cs-001',
  email: 'cs.demo@3ddx.com',
  fullName: 'CS Operator',
  activeTenant: { id: 1, label: '3ddx.com' },
  tenantId: 1,
  family: 'CS',
  roles: ['cs_operator'],
  capabilities: ['orders.view'],
  status: 'authenticated',
  accessStatus: 'AUTHORIZED',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const mockPendingSession: UserSession = {
  userId: 'usr-unassigned-001',
  email: 'unassigned@3ddx.com',
  fullName: 'Unassigned Internal Employee',
  activeTenant: null,
  tenantId: null,
  roles: [],
  capabilities: [],
  status: 'pending_access',
  accessStatus: 'PENDING',
  tenantSwitchingEnabled: false,
  issuedAt: Date.now(),
  lastActivityAt: Date.now(),
  expiresAt: Date.now() + 3600000,
};

function renderConfigManager(session: UserSession | null = mockAdminSession) {
  if (session) {
    localStorage.setItem('newcp_iam_session_v098', JSON.stringify(session));
    localStorage.setItem('newcp_iam_session_v097', JSON.stringify(session));
  } else {
    localStorage.removeItem('newcp_iam_session_v098');
    localStorage.removeItem('newcp_iam_session_v097');
  }

  return render(
    <MemoryRouter initialEntries={['/cms']}>
      <ThemeProvider>
        <LanguageProvider>
          <ConfigProvider>
            <AuthProvider>
              <Routes>
                <Route path="/cms" element={<ConfigManager />} />
                <Route path="/home" element={<div>Home Page</div>} />
              </Routes>
            </AuthProvider>
          </ConfigProvider>
        </LanguageProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

describe('UIUX-CMS-001: CMS & Observability Controls Acceptance Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Authoritative Role & Capability Access Boundary', () => {
    it('allows access to CMS for authorized Admin users with iam.roles.assign capability', () => {
      renderConfigManager(mockAdminSession);
      expect(screen.getByTestId('cms-page')).toBeInTheDocument();
      expect(screen.getByText('CMS & System Controls')).toBeInTheDocument();
      expect(screen.queryByTestId('cms-access-denied')).not.toBeInTheDocument();
    });

    it('allows access to CMS for authorized Senior roles', () => {
      renderConfigManager(mockSeniorOpsSession);
      expect(screen.getByTestId('cms-page')).toBeInTheDocument();
      expect(screen.queryByTestId('cms-access-denied')).not.toBeInTheDocument();
    });

    it('denies access (403 Forbidden) to ordinary users without admin or senior capability', () => {
      renderConfigManager(mockOrdinarySession);
      expect(screen.getByTestId('cms-access-denied')).toBeInTheDocument();
      expect(screen.getByText('403 FORBIDDEN')).toBeInTheDocument();
      expect(screen.getByText('Administrative Access Restricted')).toBeInTheDocument();
      expect(screen.queryByTestId('cms-page')).not.toBeInTheDocument();
    });

    it('denies access to users in pending_access status', () => {
      renderConfigManager(mockPendingSession);
      expect(screen.getByTestId('cms-access-denied')).toBeInTheDocument();
      expect(screen.getByText(/Pending Access status/i)).toBeInTheDocument();
      expect(screen.queryByTestId('cms-page')).not.toBeInTheDocument();
    });

    it('denies access by default when session capability data is unavailable', () => {
      renderConfigManager(null);
      expect(screen.getByTestId('cms-access-denied')).toBeInTheDocument();
      expect(screen.getByText(/Authoritative session capability data is unavailable/i)).toBeInTheDocument();
    });
  });

  describe('2. Access & Pending Accounts Management (User-Uploaded Mock View)', () => {
    it('renders Access page with title, subtitle, and authoritative badges', () => {
      renderConfigManager(mockAdminSession);
      expect(screen.getByTestId('cms-access-management')).toBeInTheDocument();
      expect(screen.getByText('Access')).toBeInTheDocument();
      expect(screen.getByText(/People who signed in with Google but have no role yet/i)).toBeInTheDocument();
      expect(screen.getByText('BLOCKED: user list')).toBeInTheDocument();
      expect(screen.getByText('MOCK')).toBeInTheDocument();
    });

    it('renders the callout notice regarding IAM API pending users limitation', () => {
      renderConfigManager(mockAdminSession);
      expect(screen.getByText(/The roles list and the role assignment are in the IAM API/i)).toBeInTheDocument();
      expect(screen.getByText(/A new role applies on the person's next request/i)).toBeInTheDocument();
    });

    it('displays the pending users table with mock accounts and status badges', () => {
      renderConfigManager(mockAdminSession);
      expect(screen.getByText('Mock Person A')).toBeInTheDocument();
      expect(screen.getByText('person.a@example.test')).toBeInTheDocument();
      expect(screen.getByText('Mock Person B')).toBeInTheDocument();
      expect(screen.getByText('person.b@example.test')).toBeInTheDocument();
      expect(screen.getByText('Mock Person C')).toBeInTheDocument();
      expect(screen.getByText('person.c@example.test')).toBeInTheDocument();

      expect(screen.getAllByText('Pending access').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Role assigned').length).toBeGreaterThanOrEqual(1);
    });

    it('updates role inspector preview when role is chosen and prevents admin assignment', () => {
      renderConfigManager(mockAdminSession);
      expect(screen.getByRole('heading', { name: 'Operations (OPS)' })).toBeInTheDocument();
      expect(screen.getByText('What this role can do, from the roles list.')).toBeInTheDocument();
      expect(screen.getByText('reports.read')).toBeInTheDocument();
      expect(screen.getByText('services.edit')).toBeInTheDocument();
      expect(screen.getByText('services.transition')).toBeInTheDocument();

      // Non-negotiable Admin assignment restriction
      expect(screen.getByText(/Admin cannot be assigned here/i)).toBeInTheDocument();
    });

    it('allows assigning role to a pending user and transitions status to Role assigned', () => {
      renderConfigManager(mockAdminSession);
      // Mock Person B already has 'Operations (OPS)' selected
      const assignButtons = screen.getAllByRole('button', { name: /assign/i });
      const activeAssignBtn = assignButtons.find((btn) => !btn.hasAttribute('disabled'));
      expect(activeAssignBtn).toBeDefined();

      if (activeAssignBtn) {
        fireEvent.click(activeAssignBtn);
      }

      expect(screen.getAllByText('Role assigned').length).toBe(2);
    });
  });

  describe('3. CMS Configuration, Validation & Safe Fallback', () => {
    it('switches to Configuration tab and displays branding and theme sections', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-configuration'));
      expect(screen.getByTestId('cms-configuration-view')).toBeInTheDocument();
      expect(screen.getByText('Branding & Product Labels')).toBeInTheDocument();
      expect(screen.getByText('Theme Colors (Hex Codes)')).toBeInTheDocument();
      expect(screen.getByText('Approved Links & Support')).toBeInTheDocument();
    });

    it('displays mandatory security and local storage notices', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-configuration'));
      expect(screen.getByText(/Browser-local changes are saved in local browser storage only/i)).toBeInTheDocument();
      expect(screen.getByText(/CMS presentation settings do NOT bypass backend IAM/i)).toBeInTheDocument();
    });

    it('validates configuration and catches invalid colors and page size', () => {
      const invalid = {
        branding: { appName: 'Test' },
        theme: { primaryColor: 'invalid-red' },
        features: { defaultPageSize: -5 },
      };
      const result = validateAppConfig(invalid);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.validatedConfig.theme.primaryColor).toBe(DEFAULT_APP_CONFIG.theme.primaryColor);
      expect(result.validatedConfig.features.defaultPageSize).toBe(DEFAULT_APP_CONFIG.features.defaultPageSize);
    });

    it('resets configuration to default when Reset to Default is confirmed', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-configuration'));

      vi.spyOn(window, 'confirm').mockReturnValue(true);
      fireEvent.click(screen.getByTestId('reset-config-button'));

      expect(screen.getByText('Factory defaults restored.')).toBeInTheDocument();
    });
  });

  describe('4. PostHog Observability & Feature Flags Matrix', () => {
    it('switches to PostHog tab and renders provider status without exposing secret token', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-posthog'));
      expect(screen.getByTestId('posthog-settings-view')).toBeInTheDocument();
      expect(screen.getByTestId('posthog-status-badge')).toBeInTheDocument();

      // Secret Non-Disclosure Check: Masked or Not Configured only
      const maskedKey = screen.getByTestId('posthog-masked-key').textContent;
      expect(maskedKey).not.toMatch(/phc_[a-zA-Z0-9]{15,}/);
      expect(maskedKey === 'Not Configured' || maskedKey?.includes('•')).toBe(true);

      // Zero-PHI notice
      expect(screen.getByText(/Strict Zero-PHI & PII Sanitization Boundary/i)).toBeInTheDocument();
    });

    it('distinguishes remote, local, disabled, and unavailable feature flag states', () => {
      // 1. Disabled state (telemetryEnabled: false)
      const disabledAdapter = new PostHogAdapter(
        { enabled: false, host: 'https://us.i.posthog.com', captureInDev: false, trackEmail: false },
        'production'
      );
      const disabledEval = disabledAdapter.evaluateFeatureFlag('new_reports_ui', false);
      expect(disabledEval.state).toBe('disabled');
      expect(disabledEval.enabled).toBe(false);

      // 2. Unavailable state (SDK client offline/missing)
      const unavailableAdapter = new PostHogAdapter(
        { enabled: true, key: 'mock_key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        'production',
        {} as any // Empty client without isFeatureEnabled
      );
      const unavailableEval = unavailableAdapter.evaluateFeatureFlag('new_reports_ui', true);
      expect(unavailableEval.state).toBe('unavailable');
      expect(unavailableEval.enabled).toBe(true); // Preserves local fallback

      // 3. Remote state (SDK client returns boolean)
      const remoteAdapter = new PostHogAdapter(
        { enabled: true, key: 'mock_key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        'production',
        {
          isFeatureEnabled: (key: string) => key === 'new_reports_ui',
        } as any
      );
      const remoteEval = remoteAdapter.evaluateFeatureFlag('new_reports_ui', false);
      expect(remoteEval.state).toBe('remote');
      expect(remoteEval.enabled).toBe(true);

      // 4. Local state (evaluation exception falls back safely)
      const errorAdapter = new PostHogAdapter(
        { enabled: true, key: 'mock_key', host: 'https://us.i.posthog.com', captureInDev: true, trackEmail: false },
        'production',
        {
          isFeatureEnabled: () => {
            throw new Error('Network error');
          },
        } as any
      );
      const localEval = errorAdapter.evaluateFeatureFlag('new_reports_ui', false);
      expect(localEval.state).toBe('local');
      expect(localEval.enabled).toBe(false);
    });
  });

  describe('5. Sentry Error Monitoring & Safe Verification', () => {
    it('switches to Sentry tab and renders status without exposing raw DSN', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-sentry'));
      expect(screen.getByTestId('sentry-settings-view')).toBeInTheDocument();
      expect(screen.getByTestId('sentry-status-badge')).toBeInTheDocument();

      // Secret Non-Disclosure Check: Raw DSN is never shown
      const maskedDsn = screen.getByTestId('sentry-masked-dsn').textContent;
      expect(maskedDsn).not.toMatch(/https:\/\/[a-f0-9]{32}@/);

      // Scrubbing notice
      expect(screen.getByText(/Automated Data Scrubber & HIPAA Compliance/i)).toBeInTheDocument();
    });

    it('allows authorized Admin to trigger safe synthetic test error verification', () => {
      renderConfigManager(mockAdminSession);
      fireEvent.click(screen.getByTestId('tab-sentry'));

      const triggerBtn = screen.getByTestId('trigger-test-error-button');
      fireEvent.click(triggerBtn);

      expect(screen.getByTestId('test-error-result')).toBeInTheDocument();
      expect(screen.getByText(/Verification Dispatch Completed/i)).toBeInTheDocument();
    });
  });
});
