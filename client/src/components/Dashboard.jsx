import React, { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { FaPlus, FaCheckDouble, FaDownload, FaUpload, FaCheck, FaTimes, FaFire, FaChartPie, FaBolt, FaHistory, FaCalendarWeek, FaSun } from 'react-icons/fa';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const Dashboard = ({ habits, completions, onToggle, onAdd, onMarkAllComplete }) => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const getTodayHabits = () => {
    const dayOfWeek = today.getDay();
    return habits.filter(habit => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') return dayOfWeek === 1; // Assume Monday start for weekly
      if (habit.frequency === 'custom') {
        return habit.customDays && habit.customDays.includes(dayOfWeek);
      }
      return false;
    });
  };

  const isCompleted = (habitId, date = dateStr) => {
    return completions.some(c => c.habitId === habitId && c.date === date && c.completed);
  };

  const todayHabits = getTodayHabits();
  const completedCount = todayHabits.filter(h => isCompleted(h._id)).length;
  const progressPercentage = todayHabits.length > 0 ? Math.round((completedCount / todayHabits.length) * 100) : 0;

  // Charts Data
  const doughnutData = {
    datasets: [{
      data: [progressPercentage, 100 - progressPercentage],
      backgroundColor: ['rgba(102, 126, 234, 1)', 'rgba(240, 240, 240, 1)'],
      borderWidth: 0
    }]
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    maintainAspectRatio: true,
    responsive: true
  };

  const getWeeklyData = () => {
    // Get last 7 days including today? Or strict Mon-Sun week?
    // Let's do Mon-Sun relative to today for simplicity or just last 7 days.
    // The original app did "Monday of this week".
    const data = [];
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Find Monday
    const d = new Date(today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));

    for (let i = 0; i < 7; i++) {
        const temp = new Date(monday);
        temp.setDate(monday.getDate() + i);
        const dStr = temp.toISOString().split('T')[0];
        
        // Count completions for this day
        // We need to know which habits were active on that day to be accurate, 
        // but for simplicity, let's just count total completions for now, 
        // OR better: check all habits against that day.
        
        // Accurate way:
        const dayOfWeek = temp.getDay();
        const activeHabits = habits.filter(h => {
             if (h.frequency === 'daily') return true;
             if (h.frequency === 'weekly') return dayOfWeek === 1;
             if (h.frequency === 'custom') return h.customDays?.includes(dayOfWeek);
             return false;
        });

        const completedOnDay = activeHabits.filter(h => 
            completions.some(c => c.habitId === h._id && c.date === dStr && c.completed)
        ).length;

        data.push(completedOnDay);
    }
    return data;
  };

  const weeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Completed Habits',
      data: getWeeklyData(),
      backgroundColor: 'rgba(102, 126, 234, 0.8)',
      borderColor: 'rgba(102, 126, 234, 1)',
      borderWidth: 1,
      borderRadius: 4
    }]
  };

  const getCategoryIcon = (cat) => {
    const icons = {
        health: '🏃', productivity: '📈', learning: '📚',
        mindfulness: '🧘', social: '👥', creativity: '🎨', other: '📝'
    };
    return icons[cat] || '📝';
  };

  return (
    <div className="tab-content active">
      <div className="dashboard-grid">
        <div className="dashboard-card progress-overview">
          <h3><FaChartPie /> Today's Progress</h3>
          <div className="progress-circle">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="progress-text">
              <span className="progress-percentage">{progressPercentage}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <h3><FaBolt /> Quick Actions</h3>
          <button className="action-btn primary" onClick={onAdd}>
            <FaPlus /> Add New Habit
          </button>
          {/* Placeholders for other actions */}
          <button className="action-btn secondary" onClick={onMarkAllComplete}>
            <FaCheckDouble /> Mark All Complete
          </button>
        </div>

        <div className="dashboard-card weekly-overview">
          <h3><FaCalendarWeek /> This Week</h3>
          <div style={{ height: '200px' }}>
              <Bar data={weeklyData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          </div>
        </div>

        <div className="today-habits" style={{ gridColumn: '1 / -1' }}>
          <h3><FaSun /> Today's Habits</h3>
          <div className="habits-grid">
            {todayHabits.length === 0 ? (
               <div className="empty-state">
                  <p>No habits for today. Add one!</p>
               </div>
            ) : (
              todayHabits.map(habit => {
                  const done = isCompleted(habit._id);
                  return (
                      <div 
                          key={habit._id} 
                          className={`habit-card ${done ? 'completed' : 'incomplete'}`}
                          data-category={habit.category}
                          onClick={() => onToggle(habit._id, dateStr)}
                      >
                          <div className="habit-header">
                              <div>
                                  <div className="habit-title">{habit.name}</div>
                                  <div className="habit-category">{getCategoryIcon(habit.category)} {habit.category}</div>
                              </div>
                              <div className={`habit-status ${done ? 'completed' : ''}`}>
                                  {done && <FaCheck />}
                              </div>
                          </div>
                          <div className="habit-progress">
                              <div className="habit-progress-bar" style={{ width: done ? '100%' : '0%' }}></div>
                          </div>
                      </div>
                  );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;