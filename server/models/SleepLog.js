const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    age: { type: Number, min: 0, max: 110 },
    hours: { type: Number, required: true, min: 0, max: 24 },
    quality: { type: Number, min: 1, max: 10, default: 7 },
    bedtime: { type: String }, // HH:mm
    wakeTime: { type: String }, // HH:mm
    notes: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

sleepLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('SleepLog', sleepLogSchema);
