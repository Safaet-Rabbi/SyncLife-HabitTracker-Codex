const mongoose = require('mongoose');

const checklistItemSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    done: { type: Boolean, default: false },
  },
  { _id: true }
);

const studyTaskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1500 },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
    tags: [{ type: String, trim: true }],
    checklist: [checklistItemSchema],
    deadline: { type: Date },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

studyTaskSchema.index({ user: 1, position: 1 });
studyTaskSchema.index({ user: 1, deadline: 1 });

module.exports = mongoose.model('StudyTask', studyTaskSchema);
