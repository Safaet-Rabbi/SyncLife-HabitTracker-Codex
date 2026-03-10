const router = require('express').Router();
const Habit = require('../models/Habit');
const Completion = require('../models/Completion');

// GET all habits
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find().sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new habit
router.post('/', async (req, res) => {
  try {
    const newHabit = new Habit(req.body);
    const savedHabit = await newHabit.save();
    res.json(savedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update habit
router.put('/:id', async (req, res) => {
  try {
    const updatedHabit = await Habit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedHabit);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE habit
router.delete('/:id', async (req, res) => {
  try {
    const habit = await Habit.findByIdAndDelete(req.params.id);
    // Also delete associated completions
    await Completion.deleteMany({ habitId: req.params.id });
    res.json({ message: 'Habit deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;