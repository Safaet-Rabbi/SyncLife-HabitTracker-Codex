import React, { useState, useEffect } from 'react';
import { FaChartLine, FaFire, FaTrophy, FaTachometerAlt, FaList, FaChartBar, FaCalendar, FaUserShield, FaUtensils, FaMoon, FaBookOpen, FaBell } from 'react-icons/fa';
import * as api from './api';
import Dashboard from './components/Dashboard';
import HabitList from './components/HabitList';
import Analytics from './components/Analytics';
import CalendarView from './components/Calendar';
import HabitModal from './components/HabitModal';
import TuitionTracker from './pages/TuitionTracker'; // Import TuitionTracker
import AuthCenter from './pages/AuthCenter';
import NutritionSystem from './pages/NutritionSystem';
import PrayerTracker from './pages/PrayerTracker';
import SleepTracker from './pages/SleepTracker';
import StudyPlanner from './pages/StudyPlanner';
import NotificationCenter from './pages/NotificationCenter';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const normalizeId = (value) => String(value);

const isHabitScheduledOnDate = (habit, date) => {
  const dayOfWeek = date.getDay(); // 0 Sunday ... 6 Saturday
  if (habit.frequency === 'daily') return true;
  if (habit.frequency === 'weekly') return dayOfWeek === 1; // Monday
  if (habit.frequency === 'custom') return Array.isArray(habit.customDays) && habit.customDays.includes(dayOfWeek);
  return false;
};

const buildCompletionLookup = (completions) => {
  const lookup = new Set();
  completions.forEach((c) => {
    if (c.completed) {
      lookup.add(`${normalizeId(c.habitId)}|${c.date}`);
    }
  });
  return lookup;
};

function App() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState([]); // Array of completion objects
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats
  const [streak, setStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [habits, completions]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [habitsRes, completionsRes] = await Promise.all([
        api.getHabits(),
        api.getCompletions()
      ]);
      setHabits(habitsRes.data);
      setCompletions(completionsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const todayDate = new Date();
    const todayKey = toDateKey(todayDate);
    const completionLookup = buildCompletionLookup(completions);

    // Completed Today (count only habits scheduled for today)
    const todayHabits = habits.filter((habit) => isHabitScheduledOnDate(habit, todayDate));
    const todayCompletedCount = todayHabits.filter((habit) =>
      completionLookup.has(`${normalizeId(habit._id)}|${todayKey}`)
    ).length;
    setCompletedToday(todayCompletedCount);

    // Longest current streak among all habits (schedule-aware + created-date-aware)
    let longestCurrentStreak = 0;

    habits.forEach((habit) => {
      const habitId = normalizeId(habit._id);
      const createdAt = habit.createdAt ? startOfDay(new Date(habit.createdAt)) : null;
      let habitStreak = 0;

      for (let i = 0; i < 366; i++) {
        const checkDate = new Date(todayDate);
        checkDate.setDate(todayDate.getDate() - i);

        // Stop when we reach dates before habit creation.
        if (createdAt && startOfDay(checkDate) < createdAt) {
          break;
        }

        const shouldTrack = isHabitScheduledOnDate(habit, checkDate);
        if (!shouldTrack) continue;

        const dateKey = toDateKey(checkDate);
        const completed = completionLookup.has(`${habitId}|${dateKey}`);
        if (completed) {
          habitStreak += 1;
        } else {
          break;
        }
      }

      longestCurrentStreak = Math.max(longestCurrentStreak, habitStreak);
    });

    setStreak(longestCurrentStreak);
  };

  const handleOpenModal = (habit = null) => {
    setEditingHabit(habit);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingHabit(null);
    setShowModal(false);
  };

  const handleSaveHabit = async (habitData) => {
    try {
      if (editingHabit) {
        console.log('Attempting to update habit:', editingHabit._id, habitData);
        await api.updateHabit(editingHabit._id, habitData);
        console.log('Habit updated successfully. Triggering toast.');
        toast.success('Habit updated successfully!');
      } else {
        console.log('Attempting to create new habit:', habitData);
        await api.createHabit(habitData);
        console.log('Habit created successfully. Triggering toast.');
        toast.success('Habit created successfully!');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving habit:', error);
      toast.error('Error saving habit');
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await api.deleteHabit(id);
        toast.success('Habit deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting habit:', error);
        toast.error('Error deleting habit');
      }
    }
  };

  const getTodayHabits = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
    return habits.filter(habit => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') return dayOfWeek === 1; // Assume Monday start for weekly
      if (habit.frequency === 'custom') {
        return habit.customDays && habit.customDays.includes(dayOfWeek);
      }
      return false;
    });
  };

  const isCompleted = (habitId, date = new Date().toISOString().split('T')[0]) => {
    return completions.some(c => c.habitId === habitId && c.date === date && c.completed);
  };


  const handleMarkAllComplete = async () => {
    const todayHabitsToComplete = getTodayHabits().filter(habit => !isCompleted(habit._id));
    const dateStr = new Date().toISOString().split('T')[0];

    if (todayHabitsToComplete.length === 0) {
      toast.info('All applicable habits for today are already complete!');
      return;
    }

    try {
      await Promise.all(
        todayHabitsToComplete.map(habit => api.toggleCompletion(habit._id, dateStr))
      );
      toast.success(`${todayHabitsToComplete.length} habits marked complete!`);
      fetchData(); // Refresh all data
    } catch (error) {
      console.error('Error marking all habits complete:', error);
      toast.error('Error marking all habits complete');
      fetchData(); // Revert on error
    }
  };

  const handleToggleCompletion = async (habitId, date) => {
    try {
        // Optimistic update
        const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === date);
        let newCompletions = [...completions];
        let isCompleted = true;
        
        if (existingIndex > -1) {
            isCompleted = !newCompletions[existingIndex].completed;
            newCompletions[existingIndex] = { ...newCompletions[existingIndex], completed: isCompleted };
        } else {
            newCompletions.push({ habitId, date, completed: true });
        }
        setCompletions(newCompletions);

        // API Call
        await api.toggleCompletion(habitId, date);
        // We could refetch or just trust the optimistic update
        const res = await api.getCompletions(); // Sync to be safe
        setCompletions(res.data);
        
        // Find habit name for toast
        const habit = habits.find(h => h._id === habitId);
        if (habit) {
            toast.success(`${habit.name} ${isCompleted ? 'completed' : 'unmarked'}!`);
        }
    } catch (error) {
        console.error('Error toggling completion:', error);
        toast.error('Error updating habit status');
        fetchData(); // Revert on error
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1><FaChartLine /> SyncLife</h1>
          <p className="subtitle">Build better habits, track your progress</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <FaFire />
            <div>
              <span className="stat-number">{streak}</span>
              <span className="stat-label">Longest Streak</span>
            </div>
          </div>
          <div className="stat-card">
            <FaTrophy />
            <div>
              <span className="stat-number">{completedToday}</span>
              <span className="stat-label">Completed Today</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <FaTachometerAlt /> Dashboard
        </button>
        <button 
          className={`nav-tab ${activeTab === 'habits' ? 'active' : ''}`}
          onClick={() => setActiveTab('habits')}
        >
          <FaList /> My Habits
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <FaChartBar /> Analytics
        </button>
        <button 
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <FaCalendar /> Calendar
        </button>
        <button 
          className={`nav-tab ${activeTab === 'tuition' ? 'active' : ''}`}
          onClick={() => setActiveTab('tuition')}
        >
          <FaTrophy /> Tuition Tracker
        </button>
        <button
          className={`nav-tab ${activeTab === 'auth' ? 'active' : ''}`}
          onClick={() => setActiveTab('auth')}
        >
          <FaUserShield /> Auth
        </button>
        <button
          className={`nav-tab ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          <FaUtensils /> Nutrition
        </button>
        <button
          className={`nav-tab ${activeTab === 'prayer' ? 'active' : ''}`}
          onClick={() => setActiveTab('prayer')}
        >
          <FaCalendar /> Prayer
        </button>
        <button
          className={`nav-tab ${activeTab === 'sleep' ? 'active' : ''}`}
          onClick={() => setActiveTab('sleep')}
        >
          <FaMoon /> Sleep
        </button>
        <button
          className={`nav-tab ${activeTab === 'study' ? 'active' : ''}`}
          onClick={() => setActiveTab('study')}
        >
          <FaBookOpen /> Study
        </button>
        <button
          className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <FaBell /> Notify
        </button>
      </nav>

      {/* Content */}
      <main>
        {activeTab === 'dashboard' && (
                    <Dashboard
                      habits={habits}
                      completions={completions}
                      onToggle={handleToggleCompletion}
                      onAdd={() => handleOpenModal()}
                                  onMarkAllComplete={handleMarkAllComplete}
                                />        )}
        {activeTab === 'habits' && (
          <HabitList 
            habits={habits} 
            completions={completions}
            onEdit={handleOpenModal}
            onDelete={handleDeleteHabit}
            onAdd={() => handleOpenModal()}
          />
        )}
        {activeTab === 'analytics' && (
          <Analytics habits={habits} completions={completions} />
        )}
        {activeTab === 'calendar' && (
          <CalendarView habits={habits} completions={completions} />
        )}
        {activeTab === 'tuition' && (
          <TuitionTracker />
        )}
        {activeTab === 'auth' && <AuthCenter />}
        {activeTab === 'nutrition' && <NutritionSystem />}
        {activeTab === 'prayer' && <PrayerTracker />}
        {activeTab === 'sleep' && <SleepTracker />}
        {activeTab === 'study' && <StudyPlanner />}
        {activeTab === 'notifications' && <NotificationCenter />}
      </main>

      {/* Modal */}
      {showModal && (
        <HabitModal 
          habit={editingHabit} 
          onClose={handleCloseModal} 
          onSave={handleSaveHabit} 
        />
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;
