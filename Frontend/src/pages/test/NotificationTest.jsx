import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCheck, Trash2, Bell, BellOff } from 'lucide-react';
import notificationsAPI from '../../api/notifications';

const PRIORITY_STYLES = {
  URGENT: { bar: 'border-l-red-500',   badge: 'bg-red-100 text-red-800' },
  HIGH:   { bar: 'border-l-orange-500', badge: 'bg-orange-100 text-orange-800' },
  MEDIUM: { bar: 'border-l-blue-500',  badge: 'bg-blue-100 text-blue-800' },
  LOW:    { bar: 'border-l-gray-400',  badge: 'bg-gray-100 text-gray-700' },
};

export default function NotificationTest() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [filter, setFilter]               = useState('ALL'); // ALL | UNREAD | READ

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nRes, cRes] = await Promise.all([
        notificationsAPI.getAll(),
        notificationsAPI.getUnreadCount(),
      ]);
      setNotifications(nRes.data?.results ?? nRes.data ?? []);
      setUnreadCount(cRes.data?.count ?? 0);
    } catch (err) {
      setError(err?.response?.data?.detail ?? err.message ?? 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('markRead failed:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('markAllRead failed:', err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete ALL notifications?')) return;
    try {
      await notificationsAPI.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('clearAll failed:', err);
    }
  };

  const visible = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'READ')   return n.is_read;
    return true;
  });

  const readCount = notifications.length - unreadCount;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notification Test Page</h1>
                <p className="text-sm text-gray-500">
                  Run{' '}
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">
                    python manage.py test_notifications --clear-first
                  </code>{' '}
                  to populate
                </p>
              </div>
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total',  value: notifications.length, color: 'blue' },
              { label: 'Unread', value: unreadCount,          color: 'red' },
              { label: 'Read',   value: readCount,            color: 'green' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-lg p-4 text-center`}>
                <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
                <p className="text-sm text-gray-600 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Actions + Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={handleClearAll}
              disabled={notifications.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>

            {/* Filter tabs */}
            <div className="ml-auto flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              {['ALL', 'UNREAD', 'READ'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 font-medium transition-colors ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* ── Notification List ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-8 h-8 animate-spin mb-3" />
              <p>Loading…</p>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <BellOff className="w-10 h-10 mb-3" />
              <p className="font-medium">No notifications</p>
              {filter !== 'ALL' && (
                <p className="text-sm mt-1">Try switching to "ALL"</p>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {visible.map((notif) => {
                const style = PRIORITY_STYLES[notif.priority] ?? PRIORITY_STYLES.MEDIUM;
                return (
                  <li
                    key={notif.id}
                    className={`flex gap-4 p-4 border-l-4 ${style.bar} ${
                      notif.is_read ? 'bg-white' : 'bg-blue-50/40'
                    } hover:bg-gray-50 transition-colors`}
                  >
                    {/* Unread dot */}
                    <div className="pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${
                        notif.is_read ? 'bg-transparent' : 'bg-blue-500'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm">{notif.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                          {notif.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 font-mono">
                          {notif.notification_type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{notif.message}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                        <span>{notif.time_ago ?? new Date(notif.created_at).toLocaleString()}</span>
                        {notif.link && (
                          <span className="text-blue-500">→ {notif.link}</span>
                        )}
                        <span>{notif.is_read ? '✓ Read' : '● Unread'}</span>
                      </div>
                    </div>

                    {/* Mark read button */}
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="flex-shrink-0 text-xs text-blue-600 hover:text-blue-800 font-medium self-start mt-1"
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Status panel ── */}
        <div className="bg-gray-900 text-green-400 rounded-xl p-5 font-mono text-sm space-y-1">
          <p className="text-green-300 font-bold mb-2">// API Status</p>
          <p>endpoint  : GET /api/v1/notifications/</p>
          <p>total     : {notifications.length}</p>
          <p>unread    : {unreadCount}</p>
          <p>filter    : {filter} ({visible.length} shown)</p>
          <p>api       : {error ? `❌ ${error}` : '✅ OK'}</p>
        </div>
      </div>
    </div>
  );
}
