const express = require('express');
const {
  createTask,
  getTasks,
  updateTask,
  reorderTasks,
  deleteTask,
} = require('../controllers/studyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.route('/tasks').post(createTask).get(getTasks);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);
router.put('/reorder', reorderTasks);

module.exports = router;
