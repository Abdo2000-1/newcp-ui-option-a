import React, { useState } from 'react';
import { Package, GitBranch, FileText, Receipt, AlertCircle, Settings, Check, ArrowRight, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { timeAgo } from '@/shared/utils/format';
import { useStore } from '@/shared/hooks/useStore';
import { store } from '@/shared/services/store';
import type { Notification } from '@/shared/types';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'order': return <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'workflow': return <GitBranch className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    case 'file': return <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'billing': return <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'request': 
    case 'change_request': return <AlertCircle className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    default: return <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
  }
};

const getTypeStyles = (type: string) => {
  switch (type) {
    case 'order': return 'bg-blue-50 dark:bg-blue-900/30';
    case 'workflow': return 'bg-cyan-50 dark:bg-cyan-900/30';
    case 'file': return 'bg-emerald-50 dark:bg-emerald-900/30';
    case 'billing': return 'bg-amber-50 dark:bg-amber-900/30';
    case 'request': 
    case 'change_request': return 'bg-violet-50 dark:bg-violet-900/30';
    default: return 'bg-slate-50 dark:bg-slate-800';
  }
};

export default function Notifications() {
  const notifications = useStore((s) => s.getNotifications());
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const filteredNotifications = notifications.filter(n => filter === 'all' || !n.read);

  const handleMarkAsRead = (id: string) => {
    store.markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    store.markAllNotificationsAsRead();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            You have {unreadCount} unread alert{unreadCount === 1 ? '' : 's'} across your cases
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'all' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                filter === 'unread' 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0} className="text-xs gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Bell className="w-8 h-8 text-gray-400" />}
              title="No notifications"
              description={filter === 'unread' ? "You're all caught up! No unread notifications." : "You don't have any notifications yet."}
            />
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredNotifications.map((notification) => (
              <li 
                key={notification.id} 
                className={`p-5 transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                  !notification.read ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${getTypeStyles(notification.type)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className={`text-sm ${!notification.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.message}</p>
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(notification.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-xs">
                      {notification.relatedId && (
                        <Link 
                          to={`/orders/${notification.relatedId}`} 
                          className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                        >
                          View order case <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {!notification.read && (
                        <button 
                          onClick={() => handleMarkAsRead(notification.id)} 
                          className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-medium transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="shrink-0 w-2.5 h-2.5 rounded-full bg-blue-600 mt-2" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
