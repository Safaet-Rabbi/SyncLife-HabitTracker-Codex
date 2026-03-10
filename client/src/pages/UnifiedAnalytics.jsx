import React, { useEffect, useMemo, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { FaChartBar } from 'react-icons/fa';
import api, { getHabits, getCompletions } from '../api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function UnifiedAnalytics() {
  const [kpis, setKpis] = useState({
    habits: 0,
    completions7: 0,
    nutritionAvgCalories: 0,
    prayerCompletionRate: 0,
    sleepAvgHours: 0,
    studyTotal: 0,
    studyDone: 0,
    unreadNotifications: 0,
  });
  const [completionSeries, setCompletionSeries] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');
      const monthKey = new Date().toISOString().slice(0, 7);
      const [
        habitsRes,
        completionsRes,
        nutritionRes,
        prayerRes,
        sleepRes,
        studyRes,
        notifRes,
      ] = await Promise.all([
        getHabits(),
        getCompletions(),
        api.get('/v1/nutrition/analytics?range=weekly'),
        api.get(`/v1/prayer/monthly?month=${monthKey}`),
        api.get('/v1/sleep/analytics?range=weekly'),
        api.get('/v1/study/tasks?limit=200'),
        api.get('/v1/notifications?unread=true&limit=1'),
      ]);

      const habits = habitsRes.data || [];
      const completions = (completionsRes.data || []).filter((c) => c.completed);

      const last7 = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = toDateKey(d);
        labels.push(key);
        last7.push(completions.filter((c) => c.date === key).length);
      }

      setCompletionSeries({ labels, data: last7 });

      const nutritionAvgCalories = Math.round((nutritionRes.data?.totals?.calories || 0) / 7);
      const prayerCompletionRate = prayerRes.data?.stats?.completionRate || 0;
      const sleepAvgHours = sleepRes.data?.stats?.avgHours || 0;
      const studyItems = studyRes.data?.items || [];
      const studyDone = studyItems.filter((t) => t.status === 'done').length;
      const unreadNotifications = notifRes.data?.pagination?.total || 0;

      setKpis({
        habits: habits.length,
        completions7: last7.reduce((a, b) => a + b, 0),
        nutritionAvgCalories,
        prayerCompletionRate,
        sleepAvgHours,
        studyTotal: studyItems.length,
        studyDone,
        unreadNotifications,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load unified analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const chartData = useMemo(
    () => ({
      labels: completionSeries.labels,
      datasets: [
        {
          label: 'Completions',
          data: completionSeries.data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.2)',
          tension: 0.3,
        },
      ],
    }),
    [completionSeries]
  );

  return (
    <div className="dashboard-grid">
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3><FaChartBar /> Unified Analytics</h3>
        {loading ? <p>Loading...</p> : null}
        {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
      </div>

      <div className="dashboard-card">
        <h3>Total Habits</h3>
        <p className="stat-number">{kpis.habits}</p>
      </div>
      <div className="dashboard-card">
        <h3>7-Day Completions</h3>
        <p className="stat-number">{kpis.completions7}</p>
      </div>
      <div className="dashboard-card">
        <h3>Avg Calories (Weekly)</h3>
        <p className="stat-number">{kpis.nutritionAvgCalories}</p>
      </div>
      <div className="dashboard-card">
        <h3>Prayer Completion %</h3>
        <p className="stat-number">{kpis.prayerCompletionRate}%</p>
      </div>
      <div className="dashboard-card">
        <h3>Avg Sleep Hours</h3>
        <p className="stat-number">{kpis.sleepAvgHours}</p>
      </div>
      <div className="dashboard-card">
        <h3>Study Tasks Done</h3>
        <p className="stat-number">{kpis.studyDone}/{kpis.studyTotal}</p>
      </div>
      <div className="dashboard-card">
        <h3>Unread Notifications</h3>
        <p className="stat-number">{kpis.unreadNotifications}</p>
      </div>

      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Completions (Last 7 Days)</h3>
        {completionSeries.labels.length ? (
          <div style={{ height: 240 }}>
            <Line data={chartData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        ) : (
          <p>No data yet.</p>
        )}
      </div>
    </div>
  );
}

export default UnifiedAnalytics;
