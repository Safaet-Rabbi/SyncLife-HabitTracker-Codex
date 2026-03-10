const express = require('express');
const { upsertPrayerLog, getMonthlyPrayerLogs } = require('../controllers/prayerController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.put('/log', upsertPrayerLog);
router.get('/monthly', getMonthlyPrayerLogs);

module.exports = router;
