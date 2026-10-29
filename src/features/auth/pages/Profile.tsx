import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Shield,
  Mail,
  Building2,
  Key,
  LogOut,
  CheckCircle2,
  Clock,
  IdCard,
} from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/app/providers/contexts/LanguageContext';

export default function Profile() {
  const navigate = useNavigate();
  const { session, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = session?.fullName || (session?.email ? session.email.split('@')[0] : 'Authenticated User');
  const displayEmail = session?.email || 'No email provided';
  const displayUserId = session?.userId || 'N/A';
  const roles = session?.roles || [];
  const capabilities = session?.capabilities || [];
  const activeTenant = session?.activeTenant;
  const tenantSlug = session?.tenantSlug;

  // Extract initials for avatar
  const initials = (session?.fullName || session?.email || 'AU')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6" data-testid="profile-page">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0284c7] to-[#38bdf8] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-[#0284c7]/20">
              <span data-testid="profile-avatar-initials">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white" data-testid="profile-user-name">
                {displayName}
              </h1>
              {session?.accessStatus && (
                <span
                  data-testid="profile-access-status"
                  className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                >
                  {session.accessStatus}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5" data-testid="profile-user-email">
              <Mail size={14} className="text-slate-400" />
              <span>{displayEmail}</span>
            </p>
          </div>
        </div>

        <div className="self-start sm:self-center">
          <button
            type="button"
            onClick={handleLogout}
            data-testid="profile-logout-button"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Backend-Derived Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Identity & Account Section */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            <IdCard size={17} className="text-[#0284c7]" />
            <span>Identity & Account</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 gap-1">
              <span className="text-slate-500 dark:text-slate-400">Authenticated User</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{displayName}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 gap-1">
              <span className="text-slate-500 dark:text-slate-400">Email Address</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{displayEmail}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 gap-1">
              <span className="text-slate-500 dark:text-slate-400">User Identifier</span>
              <span className="font-mono text-slate-800 dark:text-slate-200" data-testid="profile-user-id">{displayUserId}</span>
            </div>

            {/* Tenant Information: Displayed ONLY when returned by the backend */}
            {(activeTenant || tenantSlug) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/50 gap-1" data-testid="profile-tenant-info">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Building2 size={13} className="text-[#0284c7]" />
                  <span>Tenant Organization</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {activeTenant ? `${activeTenant.label} (ID #${activeTenant.id})` : tenantSlug}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Clock size={13} className="text-slate-400" />
                <span>Session State</span>
              </span>
              <span className="font-mono text-slate-800 dark:text-slate-200 capitalize">
                {session?.status || (isAuthenticated ? 'authenticated' : 'unauthenticated')}
              </span>
            </div>
          </div>
        </div>

        {/* Roles & IAM Assignment Section */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield size={17} className="text-[#0284c7]" />
            <span>Assigned Roles</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Role designations authoritative in backend IAM and Casbin authorization policies:
            </p>

            <div className="flex flex-wrap gap-2 pt-1" data-testid="profile-role-codes">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-sky-50 dark:bg-sky-950/40 text-[#0284c7] dark:text-sky-300 border border-sky-200 dark:border-sky-800"
                    data-testid={`role-tag-${role}`}
                  >
                    <Shield size={12} />
                    <span>{role}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No role codes assigned</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backend Capabilities / Permissions Section */}
      <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Key size={17} className="text-[#0284c7]" />
            <span>Backend Capabilities & Permissions</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {capabilities.length} granted
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Individual capabilities resolved and returned by backend <code className="font-mono text-slate-700 dark:text-slate-300">GET /api/v1/auth/me</code>:
        </p>

        <div className="flex flex-wrap gap-2 pt-2" data-testid="profile-capabilities">
          {capabilities.length > 0 ? (
            capabilities.map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs"
                data-testid={`capability-tag-${cap}`}
              >
                <CheckCircle2 size={11} className="text-emerald-500" />
                <span>{cap}</span>
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-400 italic">No explicit capabilities returned by backend</span>
          )}
        </div>
      </div>
    </div>
  );
}
