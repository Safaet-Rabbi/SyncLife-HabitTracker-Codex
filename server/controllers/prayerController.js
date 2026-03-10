const asyncHandler = require('express-async-handler');
const PrayerLog = require('../models/PrayerLog');

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

// @desc Upsert daily prayer log
// @route PUT /api/v1/prayer/log
// @access Private
const upsertPrayerLog = asyncHandler(async (req, res) => {
  const { date, prayers, notes } = req.body;

  if (!date) {
    res.status(400);
    throw new Error('date is required (YYYY-MM-DD)');
  }

  const safePrayers = PRAYER_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(prayers?.[key]);
    return acc;
  }, {});

  const log = await PrayerLog.findOneAndUpdate(
    { user: req.user._id, date },
    { prayers: safePrayers, notes },
    { new: true, upsert: true, runValidators: true }
  );

  res.json(log);
});

// @desc Get monthly prayer logs + progress
// @route GET /api/v1/prayer/monthly?month=YYYY-MM
// @access Private
const getMonthlyPrayerLogs = asyncHandler(async (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);
  const start = `${month}-01`;
  const endDate = new Date(`${month}-01T00:00:00.000Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  endDate.setUTCDate(0);
  const end = endDate.toISOString().slice(0, 10);

  const logs = await PrayerLog.find({
    user: req.user._id,
    date: { $gte: start, $lte: end },
  }).sort({ date: 1 });

  const totalChecked = logs.reduce(
    (sum, row) => sum + PRAYER_KEYS.filter((key) => row.prayers?.[key]).length,
    0
  );
  const totalPossible = logs.length * 5;
  const completionRate = totalPossible ? Number(((totalChecked / totalPossible) * 100).toFixed(1)) : 0;

  res.json({
    month,
    logs,
    stats: {
      daysLogged: logs.length,
      totalChecked,
      totalPossible,
      completionRate,
    },
  });
});

module.exports = {
  upsertPrayerLog,
  getMonthlyPrayerLogs,
};
