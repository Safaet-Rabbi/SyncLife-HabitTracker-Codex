import React, { useEffect, useState } from 'react';
import api from '../api';

function NotificationCenter() {
  const [items, setItems] = useState([]);
  const [daily, setDaily] = useState(null);
  const [settings, setSettings] = useState({
    notificationEnabled: true,
    notificationTime: '08:00',
    notificationTimezone: 'Asia/Dhaka',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [notificationsRes, dailyRes, settingsRes] = await Promise.all([
        api.get('/v1/notifications?limit=10'),
        api.get('/v1/notifications/daily-content'),
        api.get('/v1/notifications/settings'),
      ]);
      setItems(notificationsRes.data.items || []);
      setDaily(dailyRes.data);
      setSettings({
        notificationEnabled: settingsRes.data.notificationEnabled,
        notificationTime: settingsRes.data.notificationTime,
        notificationTimezone: settingsRes.data.notificationTimezone,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load notifications');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError('');
      await api.put('/v1/notifications/settings', settings);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/v1/notifications/${id}/read`);
      setItems((prev) => prev.map((item) => (item._id === id ? { ...item, isRead: true } : item)));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not mark notification as read');
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card">
        <h3>Daily Motivation Bundle</h3>
        {daily ? (
          <>
            <p><strong>Quran:</strong> {daily.quran}</p>
            <p><strong>Hadith:</strong> {daily.hadith}</p>
            <p><strong>Health:</strong> {daily.health}</p>
            <p><strong>Study:</strong> {daily.study}</p>
            <p><strong>Sleep:</strong> {daily.sleep}</p>
          </>
        ) : <p>Loading...</p>}
      </div>

      <div className="dashboard-card">
        <h3>Reminder Settings</h3>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={settings.notificationEnabled}
            onChange={(e) => setSettings((prev) => ({ ...prev, notificationEnabled: e.target.checked }))}
          /> Enable Daily Reminders
        </label>
        <div className="form-group">
          <label>Reminder Time</label>
          <input
            type="time"
            value={settings.notificationTime}
            onChange={(e) => setSettings((prev) => ({ ...prev, notificationTime: e.target.value }))}
          />
        </div>
        <div className="form-group">
          <label>Timezone</label>
          <input
            value={settings.notificationTimezone}
            onChange={(e) => setSettings((prev) => ({ ...prev, notificationTimezone: e.target.value }))}
            placeholder="Asia/Dhaka"
          />
        </div>
        <button className="btn-primary" onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="dashboard-card">
        <h3>Unified Notifications</h3>
        {items.length ? items.map((n) => (
          <div key={n._id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #e5e7eb' }}>
            <p><strong>{n.module}</strong> | {n.title} - {n.message}</p>
            {!n.isRead && (
              <button className="btn-small btn-edit" type="button" onClick={() => markAsRead(n._id)}>
                Mark Read
              </button>
            )}
          </div>
        )) : <p>No notifications</p>}
      </div>
      {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
    </div>
  );
}

export default NotificationCenter;
