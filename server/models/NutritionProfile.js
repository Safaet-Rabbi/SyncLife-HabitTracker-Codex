const mongoose = require('mongoose');

const nutritionProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    age: { type: Number, required: true, min: 8, max: 100 },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    weightKg: { type: Number, required: true, min: 20, max: 300 },
    heightCm: { type: Number, required: true, min: 80, max: 250 },
    goal: { type: String, enum: ['loss', 'maintain', 'gain'], default: 'maintain' },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'moderate',
    },
    bmi: { type: Number, default: 0 },
    dailyCalorieTarget: { type: Number, default: 2000 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('NutritionProfile', nutritionProfileSchema);
