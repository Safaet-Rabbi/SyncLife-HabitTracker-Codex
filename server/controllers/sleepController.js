const asyncHandler = require('express-async-handler');
const SleepLog = require('../models/SleepLog');
const { getSleepRecommendationByAge } = require('../utils/calculators');

// @desc Upsert daily sleep log
// @route PUT /api/v1/sleep/log
// @access Private
const upsertSleepLog = asyncHandler(async (req, res) => {
  const { date, age, hours, quality, bedtime, wakeTime, notes } = req.body;
  if (!date || hours === undefined) {
    res.status(400);
    throw new Error('date and hours are required');
  }

  const log = await SleepLog.findOneAndUpdate(
    { user: req.user._id, date },
    { age, hours, quality, bedtime, wakeTime, notes },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(log);
});

// @desc Get sleep analytics
// @route GET /api/v1/sleep/analytics?range=weekly|monthly|yearly
// @access Private
const getSleepAnalytics = asyncHandler(async (req, res) => {
  const range = req.query.range || 'weekly';
  const days = range === 'yearly' ? 365 : range === 'monthly' ? 30 : 7;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startDate = start.toISOString().slice(0, 10);

  const logs = await SleepLog.find({
    user: req.user._id,
    date: { $gte: startDate },
  }).sort({ date: 1 });

  const avgHours = logs.length
    ? Number((logs.reduce((sum, row) => sum + row.hours, 0) / logs.length).toFixed(2))
    : 0;
  const avgQuality = logs.length
    ? Number((logs.reduce((sum, row) => sum + (row.quality || 0), 0) / logs.length).toFixed(2))
    : 0;

  let recommendation = null;
  if (logs[logs.length - 1]?.age) {
    recommendation = getSleepRecommendationByAge(logs[logs.length - 1].age);
  }

  res.json({
    range,
    logs,
    stats: {
      totalEntries: logs.length,
      avgHours,
      avgQuality,
      recommendation,
    },
  });
});

// @desc Get recommendation by age
// @route GET /api/v1/sleep/recommendation/:age
// @access Private
const getSleepRecommendation = asyncHandler(async (req, res) => {
  const age = Number(req.params.age);
  const recommendation = getSleepRecommendationByAge(age);
  res.json({ age, recommendation });
});

// @desc Get monthly sleep logs + stats
// @route GET /api/v1/sleep/monthly?month=YYYY-MM
// @access Private
const getMonthlySleepLogs = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const start = `${month}-01`;
  const endDate = new Date(`${month}-01T00:00:00.000Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  endDate.setUTCDate(0);
  const end = endDate.toISOString().slice(0, 10);

  const logs = await SleepLog.find({
    user: req.user._id,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const avgHours = logs.length
    ? Number((logs.reduce((sum, row) => sum + row.hours, 0) / logs.length).toFixed(2))
    : 0;
  const avgQuality = logs.length
    ? Number((logs.reduce((sum, row) => sum + (row.quality || 0), 0) / logs.length).toFixed(2))
    : 0;
  const latestAge = logs[logs.length - 1]?.age;

  res.json({
    month,
    logs,
    stats: {
      daysLogged: logs.length,
      avgHours,
      avgQuality,
      recommendation: latestAge ? getSleepRecommendationByAge(latestAge) : null,
    },
  });
});

module.exports = {
  upsertSleepLog,
  getSleepAnalytics,
  getSleepRecommendation,
  getMonthlySleepLogs,
};
