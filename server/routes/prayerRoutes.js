const express = require('express');
const {
  upsertPrayerLog,
  getMonthlyPrayerLogs,
  getPrayerSettings,
  updatePrayerSettings,
  getPrayerTimesForDate,
  schedulePrayerReminders,
} = require('../controllers/prayerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.put('/log', upsertPrayerLog);
router.get('/monthly', getMonthlyPrayerLogs);
router.get('/settings', getPrayerSettings);
router.put('/settings', updatePrayerSettings);
router.get('/times', getPrayerTimesForDate);
router.post('/reminders', schedulePrayerReminders);

module.exports = router;
