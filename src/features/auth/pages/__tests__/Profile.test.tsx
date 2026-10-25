import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Profile from '../Profile';
import { AppProviders } from '@/app/providers';
import { store } from '@/shared/services/store';

// Mock sound utility
vi.mock('@/shared/utils/sound', () => ({
  sound: {
    playPop: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderProfile() {
  return render(
    <MemoryRouter initialEntries={['/profile']}>
      <AppProviders>
        <Routes>
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </AppProviders>
    </MemoryRouter>
  );
}

describe('Dedicated Operator Profile Page (UIUX-REQ-008)', () => {
  beforeEach(() => {
    localStorage.clear();
    mockNavigate.mockClear();
    // Reset store profile to defaults
    store.updateProfile({
      firstName: 'Jessica',
      lastName: 'Ruiz',
      email: 'j.ruiz@dentalab-cad.com',
      phone: '+1 (555) 749-3821',
      role: 'Lab Director',
      specialty: 'Orthodontics & 3D CAD/CAM',
      licenseNumber: 'CAD-DL-89421',
      avatarInitials: 'JR',
      bio: 'Specialist in digital dental prosthetics and 3D intraoral scan segmentation.',
    });
  });

  describe('Page Identity & Header Card', () => {
    it('renders the operator name, role, license number, and avatar initials', () => {
      renderProfile();

      expect(screen.getByText(/Jessica Ruiz/i)).toBeInTheDocument();
      expect(screen.getByText(/Lab Director/i)).toBeInTheDocument();
      expect(screen.getByText(/CAD-DL-89421/i)).toBeInTheDocument();
      expect(screen.getByText(/CP PRO MAX • Dedicated Specialist Profile/i)).toBeInTheDocument();
      expect(screen.getByText(/^JR$/i)).toBeInTheDocument();
    });

    it('displays the mock authentication boundary notice', () => {
      renderProfile();

      expect(
        screen.getByText(/MOCK AUTHENTICATION BOUNDARY: Profile modifications are updated in local application state only/i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Editing & Store Synchronization', () => {
    it('allows updating clinician details and synchronizes with reactive store', async () => {
      renderProfile();

      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/corporate email/i);
      const roleInput = screen.getByLabelText(/clinical role designation/i);

      fireEvent.change(firstNameInput, { target: { value: 'Alex' } });
      fireEvent.change(lastNameInput, { target: { value: 'Morgan' } });
      fireEvent.change(emailInput, { target: { value: 'a.morgan@3ddx.com' } });
      fireEvent.change(roleInput, { target: { value: 'Senior CAD Specialist' } });

      const saveBtn = screen.getByRole('button', { name: /update clinician info/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        const updated = store.getProfile();
        expect(updated.firstName).toBe('Alex');
        expect(updated.lastName).toBe('Morgan');
        expect(updated.email).toBe('a.morgan@3ddx.com');
        expect(updated.role).toBe('Senior CAD Specialist');
      });

      expect(screen.getByText(/profile and preferences updated successfully!/i)).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('switches to Workstation & Docking tab and allows dock position selection', () => {
      renderProfile();

      const appearanceTab = screen.getByRole('tab', { name: /workstation & docking/i });
      fireEvent.click(appearanceTab);

      expect(screen.getByText(/workstation personalization & navigation dock/i)).toBeInTheDocument();
      expect(screen.getByText(/top navbar/i)).toBeInTheDocument();
      expect(screen.getByText(/bottom taskbar/i)).toBeInTheDocument();

      // Click on Bottom Taskbar
      const bottomTaskbarOption = screen.getByText(/bottom taskbar/i).closest('button');
      if (bottomTaskbarOption) {
        fireEvent.click(bottomTaskbarOption);
      }
      expect(localStorage.getItem('3ddx-cp-nav-position')).toBe('bottom');
    });

    it('switches to PACS & Power BI Gateway tab and displays connection telemetry', () => {
      renderProfile();

      const pacsTab = screen.getByRole('tab', { name: /pacs & power bi gateway/i });
      fireEvent.click(pacsTab);

      expect(screen.getByText(/pacs server connection & microsoft power bi gateway/i)).toBeInTheDocument();
      expect(screen.getByText(/pacs-prod\.3ddx\.org/i)).toBeInTheDocument();
      expect(screen.getByText(/fabric dw • q4 attainment/i)).toBeInTheDocument();
      expect(screen.getByText(/webgl 2\.0 \/ 3d shaders/i)).toBeInTheDocument();
    });

    it('switches to Security & Access Logs tab and supports Sign Out', () => {
      renderProfile();

      const securityTab = screen.getByRole('tab', { name: /security & access logs/i });
      fireEvent.click(securityTab);

      expect(screen.getByText(/security clearance & production privileges/i)).toBeInTheDocument();
      expect(screen.getByText(/master orders flow control/i)).toBeInTheDocument();
      expect(screen.getByText(/active mock session/i)).toBeInTheDocument();

      const signOutBtn = screen.getByRole('button', { name: /sign out of cp pro max/i });
      fireEvent.click(signOutBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});
