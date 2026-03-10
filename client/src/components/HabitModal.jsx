import React, { useState, useEffect } from 'react';

const HabitModal = ({ habit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'health',
    frequency: 'daily',
    customDays: [],
    target: '',
    unit: ''
  });

  useEffect(() => {
    if (habit) {
      setFormData({
        name: habit.name,
        description: habit.description || '',
        category: habit.category,
        frequency: habit.frequency,
        customDays: habit.customDays || [],
        target: habit.target || '',
        unit: habit.unit || ''
      });
    }
  }, [habit]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id === 'habitName' ? 'name' : id.replace('habit', '').toLowerCase()]: value }));
  };

  // The above handleChange is a bit hacking to match IDs. Let's make it cleaner.
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDayToggle = (day) => {
    const dayNum = parseInt(day);
    setFormData(prev => {
      const days = prev.customDays.includes(dayNum)
        ? prev.customDays.filter(d => d !== dayNum)
        : [...prev.customDays, dayNum];
      return { ...prev, customDays: days };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>{habit ? 'Edit Habit' : 'Add New Habit'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Habit Name *</label>
            <input 
              type="text" 
              id="name" 
              required 
              placeholder="e.g., Drink 8 glasses of water"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea 
              id="description" 
              placeholder="Optional description..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select 
              id="category"
              value={formData.category}
              onChange={(e) => updateField('category', e.target.value)}
            >
              <option value="health">🏃 Health & Fitness</option>
              <option value="productivity">📈 Productivity</option>
              <option value="learning">📚 Learning</option>
              <option value="mindfulness">🧘 Mindfulness</option>
              <option value="social">👥 Social</option>
              <option value="creativity">🎨 Creativity</option>
              <option value="other">📝 Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="frequency">Frequency</label>
            <select 
              id="frequency"
              value={formData.frequency}
              onChange={(e) => updateField('frequency', e.target.value)}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom Days</option>
            </select>
          </div>

          {formData.frequency === 'custom' && (
            <div className="form-group">
              <label>Select Days</label>
              <div className="days-selector">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                  <label key={index}>
                    <input 
                      type="checkbox" 
                      checked={formData.customDays.includes(index)}
                      onChange={() => handleDayToggle(index)}
                    /> {day}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="target">Target (optional)</label>
            <input 
              type="number" 
              id="target" 
              min="1" 
              placeholder="e.g., 8 for 8 glasses"
              value={formData.target}
              onChange={(e) => updateField('target', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit">Unit (optional)</label>
            <input 
              type="text" 
              id="unit" 
              placeholder="e.g., glasses, pages, minutes"
              value={formData.unit}
              onChange={(e) => updateField('unit', e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Save Habit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;