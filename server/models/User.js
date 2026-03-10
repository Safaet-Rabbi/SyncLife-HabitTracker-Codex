const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      locale: { type: String, default: 'en' },
      notificationEnabled: { type: Boolean, default: true },
      notificationTime: { type: String, default: '08:00' },
      notificationTimezone: { type: String, default: 'UTC' },
      prayerCity: { type: String, default: 'Dhaka' },
      prayerCountry: { type: String, default: 'Bangladesh' },
      prayerMethod: { type: Number, default: 2 }, // Aladhan method id
      prayerTimezone: { type: String, default: 'Asia/Dhaka' },
      prayerReminderOffsetMin: { type: Number, default: 0 },
    },
    passwordResetTokenHash: {
      type: String,
      default: null,
      index: true,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function handlePasswordHash(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
