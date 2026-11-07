import { Bell, Check, Heart, MessageCircle, RefreshCw, Share2, Trophy } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api.js';

const icons = {
  like: Heart,
  comment: MessageCircle,
  share: Share2,
  milestone: Trophy,
};

function notificationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function NotificationCenter({ audience = 'creator' }) {
  const isViewer = audience === 'viewer';
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await apiRequest('/notifications');
      setNotifications(result.notifications || []);
      setUnreadCount(result.unreadCount || 0);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 60_000);
    return () => window.clearInterval(timer);
  }, [loadNotifications]);

  async function markRead(notification) {
    if (notification.readAt) return;
    try {
      const result = await apiRequest(`/notifications/${notification._id}/read`, { method: 'PATCH' });
      setNotifications((current) => current.map((item) => item._id === notification._id ? result.notification : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function markAllRead() {
    try {
      await apiRequest('/notifications/read-all', { method: 'PATCH' });
      const readAt = new Date().toISOString();
      setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
      setUnreadCount(0);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="notification-center">
      <button
        className="notification-button"
        type="button"
        title="Notifications"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => { setOpen((current) => !current); if (!open) loadNotifications(); }}
      >
        <Bell size={19} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && <section className="notification-popover" aria-label="Notifications">
        <header className="notification-popover-header">
          <div><strong>Notifications</strong><span>{unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}</span></div>
          <div className="notification-popover-actions">
            <button type="button" onClick={loadNotifications} aria-label="Refresh notifications" disabled={loading}><RefreshCw size={15} className={loading ? 'spin-icon' : ''} /></button>
            {unreadCount > 0 && <button type="button" onClick={markAllRead} aria-label="Mark all notifications as read"><Check size={16} /></button>}
          </div>
        </header>
        {error && <p className="notification-error" role="alert">{error}</p>}
        {loading && !notifications.length ? <p className="notification-empty">Loading notifications...</p> : notifications.length ? (
          <div className="notification-list">
            {notifications.map((notification) => {
              const Icon = icons[notification.type] || Bell;
              return (
                <Link
                  key={notification._id}
                  to={isViewer ? `/content/${notification.content}#comments` : notification.type === 'comment' ? '/dashboard/comments' : `/content/${notification.content}`}
                  className={notification.readAt ? 'notification-item is-read' : 'notification-item is-unread'}
                  onClick={() => { markRead(notification); setOpen(false); }}
                >
                  <span className={`notification-item-icon notification-type-${notification.type}`}><Icon size={17} /></span>
                  <span className="notification-item-copy">
                    <span><strong>{notification.actorName}</strong> {notification.message}</span>
                    <small>{notification.contentTitle} · {notificationTime(notification.createdAt)}</small>
                  </span>
                  {!notification.readAt && <i className="notification-unread-dot" />}
                </Link>
              );
            })}
          </div>
        ) : !error && <p className="notification-empty">{isViewer ? 'Replies and likes on your comments will show up here.' : 'Likes, comments, shares, and milestones will show up here.'}</p>}
      </section>}
    </div>
  );
}
