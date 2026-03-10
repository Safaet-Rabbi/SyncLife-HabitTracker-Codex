const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getDailyContentBundle } = require('../services/dailyContentService');

// @desc Create notification
// @route POST /api/v1/notifications
// @access Private
const createNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    user: req.user._id,
  });
  res.status(201).json(notification);
});

// @desc List notifications
// @route GET /api/v1/notifications
// @access Private
const getNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;
  const query = { user: req.user._id };
  if (req.query.unread === 'true') query.isRead = false;
  if (req.query.module) query.module = req.query.module;

  const [items, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(query),
  ]);

  res.json({
    items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// @desc Mark notification as read
// @route PATCH /api/v1/notifications/:id/read
// @access Private
const markAsRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!item) {
    res.status(404);
    throw new Error('Notification not found');
  }
  res.json(item);
});

// @desc Get user notification settings
// @route GET /api/v1/notifications/settings
// @access Private
const getSettings = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('preferences');
  res.json({
    notificationEnabled: user?.preferences?.notificationEnabled ?? true,
    notificationTime: user?.preferences?.notificationTime || '08:00',
    notificationTimezone: user?.preferences?.notificationTimezone || 'UTC',
  });
});

// @desc Update user notification settings
// @route PUT /api/v1/notifications/settings
// @access Private
const updateSettings = asyncHandler(async (req, res) => {
  const { notificationEnabled, notificationTime, notificationTimezone } = req.body;

  if (notificationTime && !/^\d{2}:\d{2}$/.test(notificationTime)) {
    res.status(400);
    throw new Error('notificationTime must be HH:mm');
  }

  if (notificationTimezone) {
    try {
      // Throws RangeError if invalid timezone.
      new Intl.DateTimeFormat('en-US', { timeZone: notificationTimezone }).format(new Date());
    } catch (error) {
      res.status(400);
      throw new Error('Invalid IANA timezone, e.g., Asia/Dhaka');
    }
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.preferences = {
    ...user.preferences,
    ...(notificationEnabled !== undefined ? { notificationEnabled: Boolean(notificationEnabled) } : {}),
    ...(notificationTime ? { notificationTime } : {}),
    ...(notificationTimezone ? { notificationTimezone } : {}),
  };

  await user.save();
  res.json({
    message: 'Notification settings updated',
    preferences: {
      notificationEnabled: user.preferences.notificationEnabled,
      notificationTime: user.preferences.notificationTime,
      notificationTimezone: user.preferences.notificationTimezone,
    },
  });
});

// @desc Get unified random daily content
// @route GET /api/v1/notifications/daily-content
// @access Private
const getDailyContent = asyncHandler(async (req, res) => {
  const content = await getDailyContentBundle();
  res.json(content);
});

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  getSettings,
  updateSettings,
  getDailyContent,
};
