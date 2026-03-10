const router = require('express').Router();
const Completion = require('../models/Completion');
const Habit = require('../models/Habit');
const { protect } = require('../middleware/authMiddleware');

// GET completions
router.get('/', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { user: req.user._id };
    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }
    const completions = await Completion.find(query);
    res.json(completions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST toggle completion
router.post('/toggle', protect, async (req, res) => {
  const { habitId, date } = req.body;
  try {
    const habit = await Habit.findOne({ _id: habitId, user: req.user._id });
    if (!habit) {
      return res.status(404).json({ error: 'Habit not found' });
    }

    const existing = await Completion.findOne({ habitId, date, user: req.user._id });
    
    if (existing) {
      // Toggle the completed status
      existing.completed = !existing.completed;
      await existing.save();
      res.json(existing);
    } else {
      // Create new completion (default true)
      const newCompletion = new Completion({ habitId, date, completed: true, user: req.user._id });
      await newCompletion.save();
      res.json(newCompletion);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
