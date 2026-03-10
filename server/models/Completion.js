const mongoose = require('mongoose');

const CompletionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit', required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  completed: { type: Boolean, default: true }
});

// Ensure a habit can only have one completion record per day
CompletionSchema.index({ user: 1, habitId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Completion', CompletionSchema);
