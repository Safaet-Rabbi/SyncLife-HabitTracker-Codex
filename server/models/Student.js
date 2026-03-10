const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  status: {
    type: Boolean,
    default: false, // true for present, false for absent
  },
});

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  className: { // Renamed from 'Class' to 'className' to avoid potential conflicts with JS keywords
    type: String,
    required: true,
    trim: true,
  },
  subjectCount: {
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  monthlyFee: {
    type: Number,
    min: 0,
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  attendanceRecords: [attendanceRecordSchema],
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
