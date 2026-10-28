import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  Lock,
  AlertCircle,
  Info,
  Shield,
  Check
} from 'lucide-react';

export interface PendingUserRecord {
  id: string;
  name: string;
  email: string;
  firstSignIn: string;
  status: 'pending' | 'assigned';
  selectedRole: string;
  grantedAt?: string;
}

export const INITIAL_MOCK_PENDING_USERS: PendingUserRecord[] = [
  {
    id: 'usr-mock-a',
    name: 'Mock Person A',
    email: 'person.a@example.test',
    firstSignIn: '27 Oct, 09:12',
    status: 'pending',
    selectedRole: '',
  },
  {
    id: 'usr-mock-b',
    name: 'Mock Person B',
    email: 'person.b@example.test',
    firstSignIn: '27 Oct, 14:40',
    status: 'pending',
    selectedRole: 'Operations (OPS)',
  },
  {
    id: 'usr-mock-c',
    name: 'Mock Person C',
    email: 'person.c@example.test',
    firstSignIn: '28 Oct, 08:05',
    status: 'assigned',
    selectedRole: 'Finance',
    grantedAt: 'Granted 28 Oct, 22:30',
  },
];

export interface RoleCapabilityDef {
  title: string;
  badge: string;
  capabilities: string[];
  disclaimer: string;
}

export const APPROVED_ASSIGNABLE_ROLES: Record<string, RoleCapabilityDef> = {
  'Operations (OPS)': {
    title: 'Operations (OPS)',
    badge: 'Mock role',
    capabilities: ['reports.read', 'services.edit', 'services.transition'],
    disclaimer: 'Capability codes are examples [NEEDS VERIFICATION]. Operations covers Models and Conversion only.',
  },
  'Customer Service (CS)': {
    title: 'Customer Service (CS)',
    badge: 'Mock role',
    capabilities: ['orders.view', 'pricing.override', 'payer.assign', 'workflow.transition'],
    disclaimer: 'Customer Service covers Order Flow, case intake, and clinician coordination.',
  },
  'Finance': {
    title: 'Finance',
    badge: 'Mock role',
    capabilities: ['reports.read', 'reports.export', 'billing.manage'],
    disclaimer: 'Finance covers billing debtors, invoicing, and executive reporting.',
  },
  'Quality Control (QC)': {
    title: 'Quality Control (QC)',
    badge: 'Mock role',
    capabilities: ['reports.read', 'reports.export', 'clinical.approval'],
    disclaimer: 'Quality Control covers clinical validation and technical sign-offs.',
  },
};

export const CmsAccessManagement: React.FC = () => {
  const [users, setUsers] = useState<PendingUserRecord[]>(INITIAL_MOCK_PENDING_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInspectorRole, setActiveInspectorRole] = useState<string>('Operations (OPS)');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRoleChange = (userId: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, selectedRole: newRole } : u))
    );
    if (newRole && APPROVED_ASSIGNABLE_ROLES[newRole]) {
      setActiveInspectorRole(newRole);
    }
  };

  const handleAssignRole = (userId: string) => {
    const now = new Date();
    const formattedDate = `${now.getDate()} Oct, ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId && u.selectedRole
          ? {
              ...u,
              status: 'assigned',
              grantedAt: `Granted ${formattedDate}`,
            }
          : u
      )
    );
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Re-filter: assigned people leave the list on refresh as documented in screenshot
      setUsers((prev) => {
        const remaining = prev.filter((u) => u.status === 'pending');
        // If all were assigned, reset to default mock list for repeatable demo testing
        return remaining.length > 0 ? remaining : INITIAL_MOCK_PENDING_USERS;
      });
      setIsRefreshing(false);
    }, 300);
  };

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.selectedRole.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const pendingCount = users.filter((u) => u.status === 'pending').length;
  const currentRoleInfo = APPROVED_ASSIGNABLE_ROLES[activeInspectorRole] || APPROVED_ASSIGNABLE_ROLES['Operations (OPS)'];

  return (
    <div className="space-y-6 w-full min-w-0" data-testid="cms-access-management">
      {/* Page Title & Status Badges */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Access
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            People who signed in with Google but have no role yet. They see Pending Access until you assign one.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          <span className="px-2.5 py-1 rounded-md text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 shadow-xs">
            <Lock size={12} className="text-rose-500" />
            <span>BLOCKED: user list</span>
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 shadow-xs">
            <AlertCircle size={12} className="text-amber-500" />
            <span>MOCK</span>
          </span>
        </div>
      </div>

      {/* Authoritative Warning Callout Banner */}
      <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/80 dark:bg-purple-950/20 text-purple-900 dark:text-purple-200 flex items-start gap-3 shadow-xs">
        <Info size={18} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          The roles list and the role assignment are in the IAM API. The list of pending users is not in it yet, so this table shows mock people until the backend adds one <span className="font-bold underline decoration-purple-400">[NEEDS VERIFICATION]</span>. A new role applies on the person&apos;s next request.
        </div>
      </div>

      {/* Main Grid: Left = Table, Right = Role Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Search, Table, Actions */}
        <div className="lg:col-span-8 space-y-4">
          {/* Search Bar & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search name or email"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all shadow-xs"
              />
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-sky-500' : 'text-slate-400'} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Pending Users Counter */}
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 px-1">
            {pendingCount} pending users
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-3">First Sign-In</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                        No pending users match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => {
                      const isAssigned = user.status === 'assigned';
                      return (
                        <tr
                          key={user.id}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                          onClick={() => {
                            if (user.selectedRole && APPROVED_ASSIGNABLE_ROLES[user.selectedRole]) {
                              setActiveInspectorRole(user.selectedRole);
                            }
                          }}
                        >
                          {/* User Name & Email */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {user.name}
                            </div>
                            <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {user.email}
                            </div>
                          </td>

                          {/* First Sign-In */}
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                            {user.firstSignIn}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 size={12} className="text-emerald-500" />
                                <span>Role assigned</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300">
                                <Clock size={12} className="text-amber-500" />
                                <span>Pending access</span>
                              </span>
                            )}
                          </td>

                          {/* Role Selection / Role Label */}
                          <td className="py-3.5 px-3">
                            {isAssigned ? (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {user.selectedRole}
                              </span>
                            ) : (
                              <select
                                aria-label={`Select role for ${user.name}`}
                                value={user.selectedRole}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all font-medium cursor-pointer"
                              >
                                <option value="">Choose a role</option>
                                {Object.keys(APPROVED_ASSIGNABLE_ROLES).map((roleKey) => (
                                  <option key={roleKey} value={roleKey}>
                                    {roleKey}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>

                          {/* Action Button / Granted Date */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isAssigned ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                {user.grantedAt || 'Granted'}
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={!user.selectedRole}
                                onClick={() => handleAssignRole(user.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                                  user.selectedRole
                                    ? 'bg-sky-600 hover:bg-sky-700 text-white cursor-pointer active:scale-95'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                Assign
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="py-3 px-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
              <div>
                1 to {filteredUsers.length} of {users.length}
              </div>
              <div className="italic text-[11px] text-slate-400 dark:text-slate-500">
                Assigned people leave the list after a refresh.
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Role Inspector Card */}
        <div className="lg:col-span-4">
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {currentRoleInfo.title}
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {currentRoleInfo.badge}
              </span>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              What this role can do, from the roles list.
            </div>

            {/* Capability Checklist */}
            <div className="space-y-2 py-1">
              {currentRoleInfo.capabilities.map((cap) => (
                <div key={cap} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200 font-mono">
                  <Check size={14} className="text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>

            {/* Role Disclaimer Note */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
              {currentRoleInfo.disclaimer}
            </div>

            {/* Non-Negotiable Admin Restriction */}
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/30 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <Lock size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <span>Admin cannot be assigned here. An admin cannot give the Admin role to someone else.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
