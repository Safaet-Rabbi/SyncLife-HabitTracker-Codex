const express = require('express');
const {
  upsertSleepLog,
  getSleepAnalytics,
  getSleepRecommendation,
  getMonthlySleepLogs,
} = require('../controllers/sleepController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.put('/log', upsertSleepLog);
router.get('/analytics', getSleepAnalytics);
router.get('/monthly', getMonthlySleepLogs);
router.get('/recommendation/:age', getSleepRecommendation);

module.exports = router;
