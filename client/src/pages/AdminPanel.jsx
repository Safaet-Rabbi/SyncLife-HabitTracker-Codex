import React, { useEffect, useState } from 'react';
import { adminResetUserPassword, getAdminStats, getAdminUsers, updateAdminUserRole, updateAdminUserStatus } from '../api';

function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState('');
  const [resetInfo, setResetInfo] = useState('');

  const loadData = async () => {
    try {
      setError('');
      const [statsRes, usersRes] = await Promise.all([getAdminStats(), getAdminUsers()]);
      setStats(statsRes.data);
      setUsers(usersRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load admin data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateRole = async (id, role) => {
    try {
      await updateAdminUserRole(id, role);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, role } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
    }
  };

  const updateStatus = async (id, isActive) => {
    try {
      await updateAdminUserStatus(id, isActive);
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isActive } : u))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const resetPassword = async (id) => {
    try {
      setResetInfo('');
      const res = await adminResetUserPassword(id);
      const token = res.data?.resetToken;
      setResetInfo(token ? `Reset token (dev): ${token}` : 'Reset token generated');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = filter.trim().toLowerCase();
    if (!term) return true;
    return (
      String(u.name || '').toLowerCase().includes(term) ||
      String(u.email || '').toLowerCase().includes(term) ||
      String(u.role || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Admin Overview</h3>
        {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
      </div>

      {stats ? (
        <>
          <div className="dashboard-card"><h3>Total Users</h3><p className="stat-number">{stats.totalUsers}</p></div>
          <div className="dashboard-card"><h3>Total Habits</h3><p className="stat-number">{stats.totalHabits}</p></div>
          <div className="dashboard-card"><h3>Tuition Students</h3><p className="stat-number">{stats.totalStudents}</p></div>
          <div className="dashboard-card"><h3>Food Logs</h3><p className="stat-number">{stats.totalFoodLogs}</p></div>
          <div className="dashboard-card"><h3>Prayer Logs</h3><p className="stat-number">{stats.totalPrayerLogs}</p></div>
          <div className="dashboard-card"><h3>Sleep Logs</h3><p className="stat-number">{stats.totalSleepLogs}</p></div>
          <div className="dashboard-card"><h3>Study Tasks</h3><p className="stat-number">{stats.totalStudyTasks}</p></div>
          <div className="dashboard-card"><h3>Notifications</h3><p className="stat-number">{stats.totalNotifications}</p></div>
        </>
      ) : (
        <div className="dashboard-card"><p>Loading stats...</p></div>
      )}

      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>User Management</h3>
        {resetInfo ? <p style={{ color: '#2563eb' }}>{resetInfo}</p> : null}
        <div className="form-group">
          <label>Search</label>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search name/email/role" />
        </div>
        <div className="habits-list">
          {filteredUsers.length ? filteredUsers.map((user) => (
            <div key={user._id} className="habit-item" style={{ display: 'block' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{user.name}</strong> — {user.email}
                  <div style={{ fontSize: 12, color: '#666' }}>Role: {user.role} | Status: {user.isActive ? 'Active' : 'Disabled'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select value={user.role} onChange={(e) => updateRole(user._id, e.target.value)}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={String(user.isActive)} onChange={(e) => updateStatus(user._id, e.target.value === 'true')}>
                    <option value="true">Active</option>
                    <option value="false">Disabled</option>
                  </select>
                  <button className="btn-small btn-edit" type="button" onClick={() => resetPassword(user._id)}>Reset Password</button>
                </div>
              </div>
            </div>
          )) : <p>No users found.</p>}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
