const express = require('express');
const {
  upsertProfile,
  getProfile,
  createFoodLog,
  getFoodLogs,
  updateFoodLog,
  deleteFoodLog,
  getNutritionAnalytics,
  getRecommendations,
} = require('../controllers/nutritionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/profile').get(getProfile).put(upsertProfile);
router.route('/foods').get(getFoodLogs).post(createFoodLog);
router.route('/foods/:id').put(updateFoodLog).delete(deleteFoodLog);
router.get('/analytics', getNutritionAnalytics);
router.get('/recommendations', getRecommendations);

module.exports = router;
