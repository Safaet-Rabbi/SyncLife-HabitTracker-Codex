import React, { useEffect, useState } from 'react';
import api from '../api';
import { FaUtensils, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';

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
  const [error, setError] = useState('');
  
  // New Food Log State
  const [newFood, setNewFood] = useState({
    foodName: '',
    calories: '',
    mealType: 'snack',
    protein: 0,
    carbs: 0,
    fat: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      setError('');
      const [profileRes, recommendationRes, foodsRes] = await Promise.all([
        api.get('/v1/nutrition/profile'),
        api.get('/v1/nutrition/recommendations'),
        api.get('/v1/nutrition/foods?limit=5'),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      setTips(recommendationRes.data?.healthTips || []);
      setFoods(foodsRes.data?.items || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Login required to load nutrition data');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await api.put('/v1/nutrition/profile', profile);
      toast.success('Profile updated!');
      await loadData();
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
      setNewFood({
        foodName: '',
        calories: '',
        mealType: 'snack',
        protein: 0,
        carbs: 0,
        fat: 0,
        date: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error logging food');
    }
  };

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

      {/* Recent Logs List */}
      <div className="dashboard-card" style={{ gridColumn: '1 / -1' }}>
        <h3>Recent Food Logs</h3>
        <div className="habits-grid" style={{ marginTop: '1rem' }}>
          {foods.length ? (
            foods.map((f) => (
              <div key={f._id} className="habit-card" style={{ borderLeftColor: f.mealType === 'breakfast' ? '#feca57' : f.mealType === 'lunch' ? '#4ecdc4' : f.mealType === 'dinner' ? '#667eea' : '#ff9ff3' }}>
                <div style={{ display: 'flex', justifySelf: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold', color: '#666', marginBottom: '4px' }}>
                      {f.mealType} • {f.date}
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
              </div>
            ))
          ) : (
            <div className="empty-state" style={{ gridColumn: '1 / -1', padding: '2rem' }}>
              <p>No food logs yet. Start tracking your meals!</p>
            </div>
          )}
        </div>
      </div>
      {error ? <p style={{ color: '#fc466b', textAlign: 'center', gridColumn: '1 / -1' }}>{error}</p> : null}
    </div>
  );
}

export default NutritionSystem;
