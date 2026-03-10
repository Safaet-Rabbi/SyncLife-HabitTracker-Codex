const asyncHandler = require('express-async-handler');
const StudyTask = require('../models/StudyTask');

// @desc Create task
// @route POST /api/v1/study/tasks
// @access Private
const createTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.create({
    ...req.body,
    user: req.user._id,
  });
  res.status(201).json(task);
});

// @desc List tasks with filter/pagination
// @route GET /api/v1/study/tasks
// @access Private
const getTasks = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 30);
  const skip = (page - 1) * limit;
  const { status, priority, search } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { subject: { $regex: search, $options: 'i' } }];

  const [items, total] = await Promise.all([
    StudyTask.find(query).sort({ position: 1, createdAt: -1 }).skip(skip).limit(limit),
    StudyTask.countDocuments(query),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// @desc Update task
// @route PUT /api/v1/study/tasks/:id
// @access Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json(task);
});

// @desc Reorder tasks
// @route PUT /api/v1/study/reorder
// @access Private
const reorderTasks = asyncHandler(async (req, res) => {
  const { orders } = req.body; // [{id, position}]
  if (!Array.isArray(orders)) {
    res.status(400);
    throw new Error('orders must be an array');
  }

  await Promise.all(
    orders.map((entry) =>
      StudyTask.updateOne(
        { _id: entry.id, user: req.user._id },
        { $set: { position: Number(entry.position || 0) } }
      )
    )
  );

  res.json({ message: 'Task order updated' });
});

// @desc Delete task
// @route DELETE /api/v1/study/tasks/:id
// @access Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await StudyTask.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  res.json({ message: 'Task removed' });
});

module.exports = {
  createTask,
  getTasks,
  updateTask,
  reorderTasks,
  deleteTask,
};
