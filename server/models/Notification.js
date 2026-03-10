const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    module: {
      type: String,
      enum: ['nutrition', 'tuition', 'prayer', 'sleep', 'study', 'system'],
      default: 'system',
    },
    type: {
      type: String,
      enum: ['quote', 'tip', 'reminder', 'alert'],
      default: 'reminder',
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 600 },
    scheduledFor: { type: Date },
    isRead: { type: Boolean, default: false },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
