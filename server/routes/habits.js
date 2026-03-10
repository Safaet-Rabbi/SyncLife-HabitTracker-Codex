const router = require('express').Router();
const Habit = require('../models/Habit');
const Completion = require('../models/Completion');
const { protect } = require('../middleware/authMiddleware');

// GET all habits
router.get('/', protect, async (req, res) => {
  try {
    const habits = await Habit.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new habit
router.post('/', protect, async (req, res) => {
  try {
    const newHabit = new Habit({ ...req.body, user: req.user._id });
    const savedHabit = await newHabit.save();
    res.json(savedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update habit
router.put('/:id', protect, async (req, res) => {
  try {
    const updatedHabit = await Habit.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    res.json(updatedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE habit
router.delete('/:id', protect, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    // Also delete associated completions
    await Completion.deleteMany({ habitId: req.params.id, user: req.user._id });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
