const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Habit = require('../models/Habit');
const Student = require('../models/Student');
const FoodLog = require('../models/FoodLog');
const PrayerLog = require('../models/PrayerLog');
const SleepLog = require('../models/SleepLog');
const StudyTask = require('../models/StudyTask');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// @desc Admin stats overview
// @route GET /api/v1/admin/stats
// @access Admin
const getAdminStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalHabits,
    totalStudents,
    totalFoodLogs,
    totalPrayerLogs,
    totalSleepLogs,
    totalStudyTasks,
    totalNotifications,
  ] = await Promise.all([
    User.countDocuments(),
    Habit.countDocuments(),
    Student.countDocuments(),
    FoodLog.countDocuments(),
    PrayerLog.countDocuments(),
    SleepLog.countDocuments(),
    StudyTask.countDocuments(),
    Notification.countDocuments(),
  ]);

  res.json({
    totalUsers,
    totalHabits,
    totalStudents,
    totalFoodLogs,
    totalPrayerLogs,
    totalSleepLogs,
    totalStudyTasks,
    totalNotifications,
  });
});

// @desc List users
// @route GET /api/v1/admin/users
// @access Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
});

// @desc Update user role
// @route PUT /api/v1/admin/users/:id/role
// @access Admin
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'user'].includes(role)) {
    res.status(400);
    throw new Error('Role must be admin or user');
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.role = role;
  await user.save();
  res.json({ message: 'Role updated', user: { id: user._id, role: user.role } });
});

// @desc Update user active status
// @route PUT /api/v1/admin/users/:id/status
// @access Admin
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (String(user._id) === String(req.user._id)) {
    res.status(400);
    throw new Error('Cannot deactivate your own account');
  }
  user.isActive = Boolean(isActive);
  await user.save();
  res.json({ message: 'Status updated', user: { id: user._id, isActive: user.isActive } });
});

// @desc Admin reset user password (dev returns token)
// @route POST /api/v1/admin/users/:id/reset-password
// @access Admin
const adminResetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const rawResetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetTokenHash = crypto.createHash('sha256').update(rawResetToken).digest('hex');
  user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();
  const payload = { message: 'Reset token generated' };
  if (process.env.NODE_ENV !== 'production') {
    payload.resetToken = rawResetToken;
  }
  res.json(payload);
});

module.exports = {
  getAdminStats,
  getUsers,
  updateUserRole,
  updateUserStatus,
  adminResetPassword,
};
