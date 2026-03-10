import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import { format } from 'date-fns';
import { FaBed, FaChartLine, FaMoon, FaSyncAlt } from 'react-icons/fa';
import api from '../api';

const scoreColor = (score) => {
  if (score >= 85) return '#16a34a';
  if (score >= 70) return '#2563eb';
  if (score >= 50) return '#f59e0b';
  return '#e11d48';
};

function SleepTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [range, setRange] = useState('weekly');
  const [monthlyData, setMonthlyData] = useState({ logs: [], stats: null, month: '' });
  const [rangeData, setRangeData] = useState({ logs: [], stats: null, range: 'weekly' });
  const [form, setForm] = useState({
    age: 22,
    hours: 7,
    quality: 7,
    bedtime: '23:00',
    wakeTime: '06:00',
    notes: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const monthKey = format(activeMonth, 'yyyy-MM');

  const monthlyByDate = useMemo(() => {
    const map = {};
    for (const row of monthlyData.logs || []) {
      map[row.date] = row;
    }
    return map;
  }, [monthlyData.logs]);

  const bestDay = useMemo(() => {
    if (!monthlyData.logs?.length) return null;
    const sorted = [...monthlyData.logs].sort((a, b) => (b.quality || 0) - (a.quality || 0));
    return sorted[0];
  }, [monthlyData.logs]);

  const consistencyScore = useMemo(() => {
    const stats = monthlyData.stats;
    if (!stats) return 0;
    const rec = stats.recommendation;
    const avgHours = stats.avgHours || 0;
    let hoursScore = 60;
    if (rec?.min && rec?.max) {
      if (avgHours >= rec.min && avgHours <= rec.max) hoursScore = 95;
      else {
        const diff = Math.min(Math.abs(avgHours - rec.min), Math.abs(avgHours - rec.max));
        hoursScore = Math.max(25, 95 - diff * 20);
      }
    }
    const qualityScore = (stats.avgQuality || 0) * 10;
    return Math.round(hoursScore * 0.6 + qualityScore * 0.4);
  }, [monthlyData.stats]);

  const loadMonthly = async (month = monthKey, dateForSync = selectedDateKey) => {
    try {
      setError('');
      setIsLoading(true);
      const res = await api.get(`/v1/sleep/monthly?month=${month}`);
      setMonthlyData({
        logs: res.data.logs || [],
        stats: res.data.stats || null,
        month: res.data.month || month,
      });
      const current = (res.data.logs || []).find((row) => row.date === dateForSync);
      if (current) {
        setForm({
          age: current.age || 22,
          hours: current.hours || 7,
          quality: current.quality || 7,
          bedtime: current.bedtime || '23:00',
          wakeTime: current.wakeTime || '06:00',
          notes: current.notes || '',
        });
      } else {
        setForm((prev) => ({ ...prev, hours: 7, quality: 7, bedtime: '23:00', wakeTime: '06:00', notes: '' }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load monthly sleep data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRange = async (targetRange = range) => {
    try {
      const res = await api.get(`/v1/sleep/analytics?range=${targetRange}`);
      setRangeData({
        logs: res.data.logs || [],
        stats: res.data.stats || null,
        range: res.data.range || targetRange,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load range analytics');
    }
  };

  useEffect(() => {
    loadMonthly(monthKey, selectedDateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  useEffect(() => {
    loadRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  useEffect(() => {
    const row = monthlyByDate[selectedDateKey];
    if (!row) return;
    setForm({
      age: row.age || 22,
      hours: row.hours || 7,
      quality: row.quality || 7,
      bedtime: row.bedtime || '23:00',
      wakeTime: row.wakeTime || '06:00',
      notes: row.notes || '',
    });
  }, [selectedDateKey, monthlyByDate]);

  const saveDay = async () => {
    try {
      setError('');
      setIsSaving(true);
      await api.put('/v1/sleep/log', {
        date: selectedDateKey,
        age: Number(form.age),
        hours: Number(form.hours),
        quality: Number(form.quality),
        bedtime: form.bedtime,
        wakeTime: form.wakeTime,
        notes: form.notes,
      });
      await Promise.all([loadMonthly(monthKey, selectedDateKey), loadRange(range)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save sleep data');
    } finally {
      setIsSaving(false);
    }
  };

  const applyRecommendedMid = () => {
    const rec = monthlyData.stats?.recommendation || rangeData.stats?.recommendation;
    if (!rec) return;
    const mid = Number(((rec.min + rec.max) / 2).toFixed(1));
    setForm((prev) => ({ ...prev, hours: mid }));
  };

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const key = format(date, 'yyyy-MM-dd');
    const row = monthlyByDate[key];
    if (!row) return null;
    return (
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          borderRadius: 9999,
          padding: '0px 6px',
          color: '#fff',
          background: row.hours >= 7 ? '#16a34a' : row.hours >= 6 ? '#2563eb' : '#e11d48',
          width: 'fit-content',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {row.hours}h
      </div>
    );
  };

  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    const key = format(date, 'yyyy-MM-dd');
    if (key === selectedDateKey) return 'bg-blue-100 rounded-lg';
    return '';
  };

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(340px,1.1fr) minmax(340px,1fr)' }}>
      <div className="dashboard-card">
        <h3><FaMoon /> Sleep Calendar</h3>
        <div style={{ marginBottom: 10, color: '#666' }}>
          Month: <strong>{monthKey}</strong> | Selected Day: <strong>{selectedDateKey}</strong>
        </div>
        <Calendar
          onChange={(date) => setSelectedDate(date)}
          value={selectedDate}
          activeStartDate={activeMonth}
          onActiveStartDateChange={({ activeStartDate }) => activeStartDate && setActiveMonth(activeStartDate)}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-small btn-edit" type="button" onClick={() => loadMonthly(monthKey, selectedDateKey)}>
            <FaSyncAlt /> Refresh Month
          </button>
          <button className="btn-small btn-edit" type="button" onClick={applyRecommendedMid}>
            Use Recommended Hours
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h3><FaBed /> Daily Sleep Entry</h3>
        <div className="form-group">
          <label>Date</label>
          <input type="date" value={selectedDateKey} onChange={(e) => setSelectedDate(new Date(`${e.target.value}T00:00:00`))} />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input type="number" min="5" max="100" value={form.age} onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Hours Slept</label>
          <input type="number" step="0.5" min="0" max="24" value={form.hours} onChange={(e) => setForm((p) => ({ ...p, hours: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Sleep Quality (1-10)</label>
          <input type="range" min="1" max="10" value={form.quality} onChange={(e) => setForm((p) => ({ ...p, quality: e.target.value }))} />
          <p>Quality Score: <strong>{form.quality}</strong>/10</p>
        </div>
        <div className="form-group">
          <label>Bedtime</label>
          <input type="time" value={form.bedtime} onChange={(e) => setForm((p) => ({ ...p, bedtime: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Wake Time</label>
          <input type="time" value={form.wakeTime} onChange={(e) => setForm((p) => ({ ...p, wakeTime: e.target.value }))} />
        </div>
        <div className="form-group">
          <label>Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Caffeine late night / workout day / stress level..." />
        </div>
        <button className="btn-primary" onClick={saveDay} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Save Day'}
        </button>
      </div>

      <div className="dashboard-card">
        <h3><FaChartLine /> Sleep Analytics</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <button className="btn-small btn-edit" type="button" onClick={() => setRange('weekly')}>Weekly</button>
          <button className="btn-small btn-edit" type="button" onClick={() => setRange('monthly')}>Monthly</button>
          <button className="btn-small btn-edit" type="button" onClick={() => setRange('yearly')}>Yearly</button>
        </div>
        {rangeData.stats ? (
          <>
            <p>Range: <strong>{rangeData.range}</strong></p>
            <p>Total Entries: <strong>{rangeData.stats.totalEntries}</strong></p>
            <p>Average Hours: <strong>{rangeData.stats.avgHours}</strong></p>
            <p>Average Quality: <strong>{rangeData.stats.avgQuality}</strong>/10</p>
            {rangeData.stats.recommendation ? (
              <p>Recommended: <strong>{rangeData.stats.recommendation.min}-{rangeData.stats.recommendation.max}h</strong></p>
            ) : null}
          </>
        ) : <p>{isLoading ? 'Loading analytics...' : 'No analytics yet.'}</p>}
        <hr style={{ margin: '12px 0' }} />
        {monthlyData.stats ? (
          <>
            <p>Month Days Logged: <strong>{monthlyData.stats.daysLogged}</strong></p>
            <p>Month Avg Hours: <strong>{monthlyData.stats.avgHours}</strong></p>
            <p>Month Avg Quality: <strong>{monthlyData.stats.avgQuality}</strong></p>
            <p>Consistency Score: <strong style={{ color: scoreColor(consistencyScore) }}>{consistencyScore}/100</strong></p>
            {bestDay ? (
              <p>Best Day: <strong>{bestDay.date}</strong> ({bestDay.hours}h, quality {bestDay.quality}/10)</p>
            ) : null}
          </>
        ) : null}
      </div>

      {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
    </div>
  );
}

export default SleepTracker;
