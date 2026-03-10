import React from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const Analytics = ({ habits, completions }) => {
  
  // 1. Habit Distribution
  const getDistributionData = () => {
    const counts = {};
    habits.forEach(h => {
        counts[h.category] = (counts[h.category] || 0) + 1;
    });
    return {
        labels: Object.keys(counts),
        datasets: [{
            data: Object.values(counts),
            backgroundColor: [
                '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
                '#feca57', '#ff9ff3', '#54a0ff'
            ]
        }]
    };
  };

  // 2. Streak Analysis (Simplified: Total completions per habit for now)
  const getStreakData = () => {
    const counts = habits.map(h => {
        return completions.filter(c => c.habitId === h._id && c.completed).length;
    });

    return {
        labels: habits.map(h => h.name),
        datasets: [{
            label: 'Total Completions',
            data: counts,
            backgroundColor: 'rgba(17, 153, 142, 0.8)'
        }]
    };
  };

  return (
    <div className="tab-content active">
        <div className="analytics-grid">
            <div className="chart-card">
                <h3>Habit Distribution</h3>
                <Pie data={getDistributionData()} />
            </div>
            <div className="chart-card">
                <h3>Total Completions by Habit</h3>
                <Bar data={getStreakData()} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>
        </div>
    </div>
  );
};

export default Analytics;