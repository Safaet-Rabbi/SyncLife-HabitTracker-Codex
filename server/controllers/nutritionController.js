const asyncHandler = require('express-async-handler');
const FoodLog = require('../models/FoodLog');
const NutritionProfile = require('../models/NutritionProfile');
const { calculateBMI, calculateDailyCalories } = require('../utils/calculators');

const foodRecommendations = {
  loss: ['Oats with berries', 'Grilled chicken salad', 'Steamed vegetables with lentils'],
  maintain: ['Egg and avocado toast', 'Brown rice with fish', 'Mixed nuts and yogurt'],
  gain: ['Peanut butter banana smoothie', 'Chicken rice bowl', 'Paneer with whole grain roti'],
};

const healthTips = [
  'Drink at least 2 liters of water daily.',
  'Prefer whole foods over processed snacks.',
  'Include protein in every main meal.',
  'Keep 8-10k steps as a baseline activity target.',
];

// @desc Upsert nutrition profile
// @route PUT /api/v1/nutrition/profile
// @access Private
const upsertProfile = asyncHandler(async (req, res) => {
  const { age, gender, weightKg, heightCm, goal, activityLevel } = req.body;

  const bmi = calculateBMI(weightKg, heightCm);
  const dailyCalorieTarget = calculateDailyCalories({
    age,
    weightKg,
    heightCm,
    gender,
    goal,
    activityLevel,
  });

  const profile = await NutritionProfile.findOneAndUpdate(
    { user: req.user._id },
    { age, gender, weightKg, heightCm, goal, activityLevel, bmi, dailyCalorieTarget },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(profile);
});

// @desc Get nutrition profile
// @route GET /api/v1/nutrition/profile
// @access Private
const getProfile = asyncHandler(async (req, res) => {
  const profile = await NutritionProfile.findOne({ user: req.user._id });
  res.json(profile || null);
});

// @desc Add food log
// @route POST /api/v1/nutrition/foods
// @access Private
const createFoodLog = asyncHandler(async (req, res) => {
  const log = await FoodLog.create({
    ...req.body,
    user: req.user._id,
  });
  res.status(201).json(log);
});

// @desc Get food logs with pagination
// @route GET /api/v1/nutrition/foods
// @access Private
const getFoodLogs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const { startDate, endDate } = req.query;

  const query = { user: req.user._id };
  if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
  if (req.query.mealType) query.mealType = req.query.mealType;
  if (req.query.search) {
    query.foodName = { $regex: req.query.search, $options: 'i' };
  }

  const [items, total] = await Promise.all([
    FoodLog.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
    FoodLog.countDocuments(query),
  ]);

  res.json({
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// @desc Update a food log
// @route PUT /api/v1/nutrition/foods/:id
// @access Private
const updateFoodLog = asyncHandler(async (req, res) => {
  const updated = await FoodLog.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!updated) {
    res.status(404);
    throw new Error('Food log not found');
  }

  res.json(updated);
});

// @desc Delete a food log
// @route DELETE /api/v1/nutrition/foods/:id
// @access Private
const deleteFoodLog = asyncHandler(async (req, res) => {
  const deleted = await FoodLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!deleted) {
    res.status(404);
    throw new Error('Food log not found');
  }
  res.json({ message: 'Food log removed' });
});

// @desc Get nutrition analytics
// @route GET /api/v1/nutrition/analytics
// @access Private
const getNutritionAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || 'weekly';
  const days = range === 'monthly' ? 30 : 7;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startDate = start.toISOString().slice(0, 10);

  const analytics = await FoodLog.aggregate([
    { $match: { user: req.user._id, date: { $gte: startDate } } },
    {
      $group: {
        _id: '$date',
        calories: { $sum: '$calories' },
        protein: { $sum: '$protein' },
        carbs: { $sum: '$carbs' },
        fat: { $sum: '$fat' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const totals = analytics.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  res.json({ range, daily: analytics, totals });
});

// @desc Get recommendations and tips
// @route GET /api/v1/nutrition/recommendations
// @access Private
const getRecommendations = asyncHandler(async (req, res) => {
  const profile = await NutritionProfile.findOne({ user: req.user._id });
  const goal = profile?.goal || 'maintain';
  res.json({
    goal,
    dailyFoodRecommendations: foodRecommendations[goal],
    healthTips,
  });
});

module.exports = {
  upsertProfile,
  getProfile,
  createFoodLog,
  getFoodLogs,
  updateFoodLog,
  deleteFoodLog,
  getNutritionAnalytics,
  getRecommendations,
};
