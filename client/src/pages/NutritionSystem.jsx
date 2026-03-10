import React, { useEffect, useMemo, useState } from 'react';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaChartPie, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../api';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const defaultFood = {
  foodName: '',
  calories: '',
  mealType: 'snack',
  protein: 0,
  carbs: 0,
  fat: 0,
  date: new Date().toISOString().split('T')[0],
};

function NutritionSystem() {
  const [profile, setProfile] = useState({
    age: 22,
    gender: 'male',
    weightKg: 70,
    heightCm: 170,
    goal: 'maintain',
    activityLevel: 'moderate',
  });
  const [tips, setTips] = useState([]);
  const [foods, setFoods] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 8, totalPages: 1 });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    mealType: '',
    search: '',
  });
  const [analyticsRange, setAnalyticsRange] = useState('weekly');
  const [analytics, setAnalytics] = useState({ daily: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  const [newFood, setNewFood] = useState(defaultFood);
  const [editingFood, setEditingFood] = useState(null);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    const [profileRes, recommendationRes] = await Promise.all([
      api.get('/v1/nutrition/profile'),
      api.get('/v1/nutrition/recommendations'),
    ]);
    if (profileRes.data) setProfile(profileRes.data);
    setTips(recommendationRes.data?.healthTips || []);
  };

  const fetchFoods = async (page = 1) => {
    const params = {
      page,
      limit: pagination.limit,
    };
    if (filters.startDate && filters.endDate) {
      params.startDate = filters.startDate;
      params.endDate = filters.endDate;
    }
    if (filters.mealType) params.mealType = filters.mealType;
    if (filters.search) params.search = filters.search;

    const res = await api.get('/v1/nutrition/foods', { params });
    setFoods(res.data.items || []);
    setPagination(res.data.pagination || { page: 1, limit: pagination.limit, totalPages: 1 });
  };

  const fetchAnalytics = async (range = analyticsRange) => {
    const res = await api.get(`/v1/nutrition/analytics?range=${range}`);
    setAnalytics(res.data || { daily: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0 } });
  };

  const loadData = async () => {
    try {
      setError('');
      await Promise.all([fetchProfile(), fetchFoods(1), fetchAnalytics(analyticsRange)]);
    } catch (err) {
      setError(err.response?.data?.message || 'Login required to load nutrition data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    fetchAnalytics(analyticsRange);
  }, [analyticsRange]);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.put('/v1/nutrition/profile', profile);
      toast.success('Profile updated!');
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save profile');
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    if (!newFood.foodName || !newFood.calories) {
      toast.error('Please provide food name and calories');
      return;
    }
    try {
      await api.post('/v1/nutrition/foods', newFood);
      toast.success('Food logged successfully!');
      setNewFood(defaultFood);
      fetchFoods(1);
      fetchAnalytics(analyticsRange);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error logging food');
    }
  };

  const handleUpdateFood = async (e) => {
    e.preventDefault();
    if (!editingFood) return;
    try {
      await api.put(`/v1/nutrition/foods/${editingFood._id}`, editingFood);
      toast.success('Food log updated');
      setEditingFood(null);
      fetchFoods(pagination.page);
      fetchAnalytics(analyticsRange);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating food');
    }
  };

  const handleDeleteFood = async (id) => {
    if (!window.confirm('Delete this food log?')) return;
    try {
      await api.delete(`/v1/nutrition/foods/${id}`);
      toast.success('Food log deleted');
      fetchFoods(pagination.page);
      fetchAnalytics(analyticsRange);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting food');
    }
  };

  const applyFilters = () => {
    fetchFoods(1);
  };

  const dailyLabels = analytics.daily.map((item) => item._id);
  const dailyCalories = analytics.daily.map((item) => item.calories);

  const macroTotal = analytics.totals || { protein: 0, carbs: 0, fat: 0 };
  const macroData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [
      {
        data: [macroTotal.protein, macroTotal.carbs, macroTotal.fat],
        backgroundColor: ['#16a34a', '#2563eb', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const calorieBarData = {
    labels: dailyLabels,
    datasets: [
      {
        label: 'Calories',
        data: dailyCalories,
        backgroundColor: 'rgba(102,126,234,0.8)',
        borderRadius: 6,
      },
    ],
  };

  const macroTotalCalories = useMemo(() => macroTotal.protein + macroTotal.carbs + macroTotal.fat, [macroTotal]);

  return (
    <div className="dashboard-grid">
      {/* Nutrition Profile */}
      <div className="dashboard-card">
        <h3><FaUtensils /> Nutrition Profile</h3>
        <form onSubmit={saveProfile}>
          <div className="form-group">
            <label>Age</label>
            <input type="number" value={profile.age} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Weight (kg)</label>
            <input type="number" value={profile.weightKg} onChange={(e) => setProfile({ ...profile, weightKg: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label>Height (cm)</label>
            <input type="number" value={profile.heightCm} onChange={(e) => setProfile({ ...profile, heightCm: Number(e.target.value) })} />
          </div>
          <button className="btn-primary" type="submit">Save Profile</button>
        </form>
        {profile.bmi ? (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
            <p>BMI: <strong>{profile.bmi}</strong></p>
            <p>Daily Target: <strong>{profile.dailyCalorieTarget}</strong> kcal</p>
          </div>
        ) : null}
      </div>

      {/* Log New Food Form */}
      <div className="dashboard-card">
        <h3><FaPlus /> Log New Food</h3>
        <form onSubmit={handleAddFood}>
          <div className="form-group">
            <label>Food Name</label>
            <input
              type="text"
              placeholder="e.g. Chicken Breast"
              value={newFood.foodName}
              onChange={(e) => setNewFood({ ...newFood, foodName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Calories (kcal)</label>
            <input
              type="number"
              value={newFood.calories}
              onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Meal Type</label>
            <select
              value={newFood.mealType}
              onChange={(e) => setNewFood({ ...newFood, mealType: e.target.value })}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label>Protein (g)</label>
              <input type="number" value={newFood.protein} onChange={(e) => setNewFood({ ...newFood, protein: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Carb (g)</label>
              <input type="number" value={newFood.carbs} onChange={(e) => setNewFood({ ...newFood, carbs: Number(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Fat (g)</label>
              <input type="number" value={newFood.fat} onChange={(e) => setNewFood({ ...newFood, fat: Number(e.target.value) })} />
            </div>
          </div>
          <button className="btn-primary" type="submit">Add Log</button>
        </form>
      </div>

      {/* Analytics */}
      <div className="dashboard-card">
        <h3><FaChartBar /> Calorie Trend</h3>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="btn-small btn-edit" type="button" onClick={() => setAnalyticsRange('weekly')}>Weekly</button>
          <button className="btn-small btn-edit" type="button" onClick={() => setAnalyticsRange('monthly')}>Monthly</button>
        </div>
        <div style={{ height: 220 }}>
          <Bar data={calorieBarData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
        </div>
      </div>

      <div className="dashboard-card">
        <h3><FaChartPie /> Macro Split</h3>
        <div style={{ height: 220 }}>
          {macroTotalCalories > 0 ? (
            <Doughnut data={macroData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          ) : (
            <p>No macro data yet.</p>
          )}
        </div>
      </div>

      {/* Health Tips */}
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Health Tips</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {tips.length ? tips.map((tip) => (
            <div key={tip} style={{ padding: '8px 15px', background: 'white', borderRadius: '20px', border: '1px solid #eee', fontSize: '0.9rem' }}>
              {tip}
            </div>
          )) : <p>No tips loaded</p>}
        </div>
      </div>

      {/* Filters */}
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Food Log Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
          <div className="form-group">
            <label>Start Date</label>
            <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Meal Type</label>
            <select value={filters.mealType} onChange={(e) => setFilters({ ...filters, mealType: e.target.value })}>
              <option value="">All</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="Chicken, rice, apple..." />
          </div>
        </div>
        <button className="btn-primary" type="button" onClick={applyFilters}>Apply Filters</button>
      </div>

      {/* Recent Logs List */}
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Food Logs</h3>
        <div className="habits-grid" style={{ marginTop: '1rem' }}>
          {foods.length ? (
            foods.map((f) => (
              <div key={f._id} className="habit-card" style={{ borderLeftColor: f.mealType === 'breakfast' ? '#feca57' : f.mealType === 'lunch' ? '#4ecdc4' : f.mealType === 'dinner' ? '#667eea' : '#ff9ff3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                      {f.mealType} | {f.date}
                    </div>
                    <div className="habit-title" style={{ fontSize: '1.1rem' }}>{f.foodName}</div>
                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '4px' }}>
                      P: {f.protein}g | C: {f.carbs}g | F: {f.fat}g
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#11998e' }}>{f.calories}</div>
                    <div style={{ fontSize: '0.7rem', color: '#aaa', textTransform: 'uppercase' }}>kcal</div>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                  <button className="btn-small btn-edit" type="button" onClick={() => setEditingFood(f)}><FaEdit /> Edit</button>
                  <button className="btn-small btn-delete" type="button" onClick={() => handleDeleteFood(f._id)}><FaTrash /> Delete</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
              <p>No food logs yet. Start tracking your meals!</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" type="button" disabled={pagination.page <= 1} onClick={() => fetchFoods(pagination.page - 1)}>
            Prev
          </button>
          <button className="btn-secondary" type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchFoods(pagination.page + 1)}>
            Next
          </button>
        </div>
      </div>

      {editingFood && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Food Log</h3>
              <button className="close-btn" onClick={() => setEditingFood(null)}>×</button>
            </div>
            <form onSubmit={handleUpdateFood}>
              <div className="form-group">
                <label>Food Name</label>
                <input value={editingFood.foodName} onChange={(e) => setEditingFood({ ...editingFood, foodName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={editingFood.date} onChange={(e) => setEditingFood({ ...editingFood, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Calories</label>
                <input type="number" value={editingFood.calories} onChange={(e) => setEditingFood({ ...editingFood, calories: Number(e.target.value) })} />
              </div>
              <div className="form-group">
                <label>Meal Type</label>
                <select value={editingFood.mealType} onChange={(e) => setEditingFood({ ...editingFood, mealType: e.target.value })}>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>Protein (g)</label>
                  <input type="number" value={editingFood.protein} onChange={(e) => setEditingFood({ ...editingFood, protein: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Carb (g)</label>
                  <input type="number" value={editingFood.carbs} onChange={(e) => setEditingFood({ ...editingFood, carbs: Number(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Fat (g)</label>
                  <input type="number" value={editingFood.fat} onChange={(e) => setEditingFood({ ...editingFood, fat: Number(e.target.value) })} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditingFood(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error ? <p style={{ color: '#fc466b', textAlign: 'center', gridColumn: '1 / -1' }}>{error}</p> : null}
    </div>
  );
}

export default NutritionSystem;
