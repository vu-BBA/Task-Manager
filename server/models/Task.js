const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category:    { type: String, enum: ['study', 'work', 'health', 'personal', 'other'], default: 'work' },
  priority:    { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:      { type: String, enum: ['pending', 'in-progress', 'completed', 'cancelled'], default: 'pending' },

  deadline:    { type: Date },
  scheduledAt: { type: Date },      // ML-suggested or user-set time slot
  duration:    { type: Number, default: 30 }, // minutes

  tags:        [{ type: String }],
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'custom'] },
    days:      [{ type: Number }],  // 0=Sun ... 6=Sat
    time:      { type: String },    // "HH:MM"
  },
  isTemplate:  { type: Boolean, default: false },
  templateId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },

  completedAt: { type: Date },
  reminderSent:{ type: Boolean, default: false },
  reminderAt:  { type: Date },

  // ML scoring fields
  mlScore:     { type: Number, default: 0 },
  energyLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },

  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

taskSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index for fast queries
taskSchema.index({ user: 1, deadline: 1 });
taskSchema.index({ user: 1, scheduledAt: 1 });
taskSchema.index({ user: 1, status: 1 });
taskSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Task', taskSchema);
