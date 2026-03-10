const router = require('express').Router();
const Completion = require('../models/Completion');

// GET completions
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};
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
router.post('/toggle', async (req, res) => {
  const { habitId, date } = req.body;
  try {
    const existing = await Completion.findOne({ habitId, date });
    
    if (existing) {
      // Toggle the completed status
      existing.completed = !existing.completed;
      await existing.save();
      res.json(existing);
    } else {
      // Create new completion (default true)
      const newCompletion = new Completion({ habitId, date, completed: true });
      await newCompletion.save();
      res.json(newCompletion);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;