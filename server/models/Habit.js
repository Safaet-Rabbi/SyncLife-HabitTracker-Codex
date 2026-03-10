const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: { 
    type: String, 
    required: true,
    enum: ['health', 'productivity', 'learning', 'mindfulness', 'social', 'creativity', 'other'],
    default: 'other'
  },
  frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'custom'], 
    required: true,
    default: 'daily'
  },
  customDays: [Number], // 0 for Sunday, 1 for Monday, etc.
  target: Number,
  unit: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Habit', HabitSchema);