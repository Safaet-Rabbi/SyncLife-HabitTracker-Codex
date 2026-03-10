const express = require('express');
const {
  createNotification,
  getNotifications,
  markAsRead,
  getSettings,
  updateSettings,
  getDailyContent,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/').post(createNotification).get(getNotifications);
router.route('/settings').get(getSettings).put(updateSettings);
router.patch('/:id/read', markAsRead);
router.get('/daily-content', getDailyContent);

module.exports = router;
