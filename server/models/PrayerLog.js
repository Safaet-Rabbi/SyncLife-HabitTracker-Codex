const mongoose = require('mongoose');

const prayerLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    prayers: {
      fajr: { type: Boolean, default: false },
      dhuhr: { type: Boolean, default: false },
      asr: { type: Boolean, default: false },
      maghrib: { type: Boolean, default: false },
      isha: { type: Boolean, default: false },
    },
    notes: { type: String, trim: true, maxlength: 280 },
  },
  { timestamps: true }
);

prayerLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PrayerLog', prayerLogSchema);
