import React, { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import { format, subDays } from 'date-fns';
import { FaCheckCircle, FaMoon, FaSyncAlt } from 'react-icons/fa';
import api from '../api';

const initialPrayers = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
const prayerKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const prayerLabels = {
  fajr: 'Fajr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

function PrayerTracker() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [prayers, setPrayers] = useState(initialPrayers);
  const [monthData, setMonthData] = useState({ logs: [], stats: null, month: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const monthKey = format(activeMonth, 'yyyy-MM');

  const logByDate = useMemo(() => {
    const map = {};
    for (const log of monthData.logs || []) {
      map[log.date] = log;
    }
    return map;
  }, [monthData.logs]);

  const monthlyPrayerCounts = useMemo(() => {
    const counts = { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 };
    for (const log of monthData.logs || []) {
      for (const key of prayerKeys) {
        if (log.prayers?.[key]) counts[key] += 1;
      }
    }
    return counts;
  }, [monthData.logs]);

  const currentFullStreak = useMemo(() => {
    if (!monthData.logs?.length) return 0;
    const dateSet = new Set(
      monthData.logs
        .filter((row) => prayerKeys.every((k) => Boolean(row.prayers?.[k])))
        .map((row) => row.date)
    );
    let streak = 0;
    let cursor = new Date(selectedDate);
    while (dateSet.has(format(cursor, 'yyyy-MM-dd'))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }
    return streak;
  }, [monthData.logs, selectedDate]);

  const syncFormWithSelectedDate = (logsMap, dateKey) => {
    const found = logsMap[dateKey];
    if (!found) {
      setPrayers(initialPrayers);
      return;
    }
    setPrayers({
      fajr: Boolean(found.prayers?.fajr),
      dhuhr: Boolean(found.prayers?.dhuhr),
      asr: Boolean(found.prayers?.asr),
      maghrib: Boolean(found.prayers?.maghrib),
      isha: Boolean(found.prayers?.isha),
    });
  };

  const loadMonthly = async (month = monthKey, dateForSync = selectedDateKey) => {
    try {
      setError('');
      setIsLoading(true);
      const res = await api.get(`/v1/prayer/monthly?month=${month}`);
      const payload = {
        logs: res.data.logs || [],
        stats: res.data.stats || null,
        month: res.data.month || month,
      };
      setMonthData(payload);
      const logsMap = {};
      for (const log of payload.logs) logsMap[log.date] = log;
      syncFormWithSelectedDate(logsMap, dateForSync);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load monthly prayer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMonthly(monthKey, selectedDateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  useEffect(() => {
    syncFormWithSelectedDate(logByDate, selectedDateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateKey, monthData.logs]);

  const saveSelectedDay = async () => {
    try {
      setError('');
      setIsSaving(true);
      await api.put('/v1/prayer/log', { date: selectedDateKey, prayers });
      await loadMonthly(monthKey, selectedDateKey);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save prayer log');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const markAll = (value) => {
    const next = {};
    for (const key of prayerKeys) next[key] = value;
    setPrayers(next);
  };

  const copyPreviousDay = () => {
    const prevKey = format(subDays(selectedDate, 1), 'yyyy-MM-dd');
    const prev = logByDate[prevKey];
    if (!prev) return;
    setPrayers({
      fajr: Boolean(prev.prayers?.fajr),
      dhuhr: Boolean(prev.prayers?.dhuhr),
      asr: Boolean(prev.prayers?.asr),
      maghrib: Boolean(prev.prayers?.maghrib),
      isha: Boolean(prev.prayers?.isha),
    });
  };

  const completedToday = prayerKeys.filter((key) => prayers[key]).length;
  const dayPercentage = Math.round((completedToday / 5) * 100);

  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const key = format(date, 'yyyy-MM-dd');
    const row = logByDate[key];
    if (!row) return null;
    const doneCount = prayerKeys.filter((k) => row.prayers?.[k]).length;
    const bg = doneCount === 5 ? '#16a34a' : doneCount >= 3 ? '#2563eb' : '#e11d48';
    return (
      <div
        style={{
          marginTop: 6,
          fontSize: 10,
          borderRadius: 9999,
          padding: '0px 6px',
          color: '#fff',
          background: bg,
          width: 'fit-content',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {doneCount}/5
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
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(340px, 1.1fr) minmax(340px, 1fr)' }}>
      <div className="dashboard-card">
        <h3><FaMoon /> Prayer Calendar</h3>
        <div style={{ marginBottom: 10, color: '#666' }}>
          Month: <strong>{monthKey}</strong> | Selected Day: <strong>{selectedDateKey}</strong>
        </div>
        <Calendar
          onChange={handleDateSelect}
          value={selectedDate}
          activeStartDate={activeMonth}
          onActiveStartDateChange={({ activeStartDate }) => {
            if (activeStartDate) setActiveMonth(activeStartDate);
          }}
          tileContent={tileContent}
          tileClassName={tileClassName}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-small btn-edit" onClick={() => loadMonthly(monthKey, selectedDateKey)} type="button">
            <FaSyncAlt /> Refresh Month
          </button>
          <button className="btn-small btn-edit" onClick={() => markAll(true)} type="button">
            Mark All 5
          </button>
          <button className="btn-small btn-delete" onClick={() => markAll(false)} type="button">
            Clear Day
          </button>
          <button className="btn-small btn-edit" onClick={copyPreviousDay} type="button">
            Copy Previous Day
          </button>
        </div>
      </div>

      <div className="dashboard-card">
        <h3><FaCheckCircle /> Daily Prayer Editor</h3>
        <div className="form-group">
          <label>Date</label>
          <input
            type="date"
            value={selectedDateKey}
            onChange={(e) => setSelectedDate(new Date(`${e.target.value}T00:00:00`))}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          {prayerKeys.map((key) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: 10,
              }}
            >
              <span>{prayerLabels[key]}</span>
              <input
                type="checkbox"
                checked={prayers[key]}
                onChange={(e) => setPrayers((prev) => ({ ...prev, [key]: e.target.checked }))}
              />
            </label>
          ))}
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ marginBottom: 6 }}>Day Completion: <strong>{completedToday}/5 ({dayPercentage}%)</strong></p>
          <div style={{ height: 8, background: '#e5e7eb', borderRadius: 9999, overflow: 'hidden' }}>
            <div style={{ width: `${dayPercentage}%`, height: '100%', background: 'linear-gradient(90deg,#16a34a,#22c55e)' }} />
          </div>
        </div>
        <button className="btn-primary" onClick={saveSelectedDay} disabled={isSaving || isLoading}>
          {isSaving ? 'Saving...' : 'Save Day'}
        </button>
      </div>

      <div className="dashboard-card">
        <h3>Monthly Progress Analytics</h3>
        {monthData.stats ? (
          <>
            <p>Days Logged: <strong>{monthData.stats.daysLogged}</strong></p>
            <p>Total Checked: <strong>{monthData.stats.totalChecked}/{monthData.stats.totalPossible}</strong></p>
            <p>Completion: <strong>{monthData.stats.completionRate}%</strong></p>
            <p>Full-Prayer Streak (from selected day): <strong>{currentFullStreak} days</strong></p>
            <hr style={{ margin: '10px 0' }} />
            {prayerKeys.map((key) => {
              const count = monthlyPrayerCounts[key];
              const percentage = monthData.stats.daysLogged ? Math.round((count / monthData.stats.daysLogged) * 100) : 0;
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>{prayerLabels[key]}</span>
                    <span>{count} days ({percentage}%)</span>
                  </div>
                  <div style={{ height: 7, background: '#e5e7eb', borderRadius: 9999, overflow: 'hidden' }}>
                    <div style={{ width: `${percentage}%`, height: '100%', background: '#2563eb' }} />
                  </div>
                </div>
              );
            })}
          </>
        ) : <p>{isLoading ? 'Loading month data...' : 'No data'}</p>}
      </div>
      {error ? <p style={{ color: '#fc466b' }}>{error}</p> : null}
    </div>
  );
}

export default PrayerTracker;
