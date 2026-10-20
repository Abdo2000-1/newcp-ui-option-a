export interface UserSession {
  userId: string;
  email: string;
  fullName: string;
  role: 'doctor' | 'planner' | 'operator' | 'lab_tech' | 'cs' | 'finance' | 'admin';
  tenantId: string;
  permissions: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  session: UserSession | null;
  token: string | null;
}
