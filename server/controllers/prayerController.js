const asyncHandler = require('express-async-handler');
const PrayerLog = require('../models/PrayerLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getPrayerTimes } = require('../services/prayerTimeService');

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

// @desc Get prayer settings
// @route GET /api/v1/prayer/settings
// @access Private
const getPrayerSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences');
  res.json({
    prayerCity: user?.preferences?.prayerCity || 'Dhaka',
    prayerCountry: user?.preferences?.prayerCountry || 'Bangladesh',
    prayerMethod: user?.preferences?.prayerMethod ?? 2,
    prayerTimezone: user?.preferences?.prayerTimezone || 'Asia/Dhaka',
    prayerReminderOffsetMin: user?.preferences?.prayerReminderOffsetMin ?? 0,
  });
});

// @desc Update prayer settings
// @route PUT /api/v1/prayer/settings
// @access Private
const updatePrayerSettings = asyncHandler(async (req, res) => {
  const { prayerCity, prayerCountry, prayerMethod, prayerTimezone, prayerReminderOffsetMin } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.preferences = {
    ...user.preferences,
    ...(prayerCity ? { prayerCity } : {}),
    ...(prayerCountry ? { prayerCountry } : {}),
    ...(prayerMethod !== undefined ? { prayerMethod: Number(prayerMethod) } : {}),
    ...(prayerTimezone ? { prayerTimezone } : {}),
    ...(prayerReminderOffsetMin !== undefined ? { prayerReminderOffsetMin: Number(prayerReminderOffsetMin) } : {}),
  };

  await user.save();
  res.json({ message: 'Prayer settings updated', preferences: user.preferences });
});

// @desc Get prayer times for a date
// @route GET /api/v1/prayer/times?date=YYYY-MM-DD
// @access Private
const getPrayerTimesForDate = asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const user = await User.findById(req.user._id).select('preferences');
  const settings = user?.preferences || {};

  const payload = await getPrayerTimes({
    date,
    city: settings.prayerCity || 'Dhaka',
    country: settings.prayerCountry || 'Bangladesh',
    method: settings.prayerMethod ?? 2,
    timezone: settings.prayerTimezone || 'Asia/Dhaka',
  });

  res.json(payload);
});

// @desc Create prayer reminder notifications for a date
// @route POST /api/v1/prayer/reminders
// @access Private
const schedulePrayerReminders = asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const user = await User.findById(req.user._id).select('preferences');
  const settings = user?.preferences || {};
  const offset = Number(settings.prayerReminderOffsetMin || 0);

  const times = await getPrayerTimes({
    date,
    city: settings.prayerCity || 'Dhaka',
    country: settings.prayerCountry || 'Bangladesh',
    method: settings.prayerMethod ?? 2,
    timezone: settings.prayerTimezone || 'Asia/Dhaka',
  });

  const entries = Object.entries(times.timings || {});
  const payload = entries.map(([name, time]) => {
    // Best-effort scheduled time stored as ISO without timezone conversion.
    const [hh, mm] = time.split(':').map(Number);
    const scheduled = new Date(`${date}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00`);
    scheduled.setMinutes(scheduled.getMinutes() - offset);

    return {
      user: req.user._id,
      module: 'prayer',
      type: 'reminder',
      title: `${name} Prayer Reminder`,
      message: `Time: ${time} (${times.timezone})`,
      scheduledFor: scheduled,
      meta: {
        date,
        prayer: name,
        timezone: times.timezone,
        offsetMin: offset,
      },
    };
  });

  await Notification.insertMany(payload, { ordered: false });
  res.json({ message: 'Prayer reminders scheduled', count: payload.length });
});

module.exports = {
  upsertPrayerLog,
  getMonthlyPrayerLogs,
  getPrayerSettings,
  updatePrayerSettings,
  getPrayerTimesForDate,
  schedulePrayerReminders,
};
