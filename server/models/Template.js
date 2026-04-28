const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  isGlobal:    { type: Boolean, default: false }, // admin-created templates
  category:    { type: String, enum: ['study', 'work', 'health', 'personal', 'other'], default: 'work' },
  color:       { type: String, default: '#6366f1' },
  icon:        { type: String, default: '📋' },

  tasks: [{
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    category:    { type: String, default: 'work' },
    priority:    { type: String, default: 'medium' },
    duration:    { type: Number, default: 30 },
    offsetMins:  { type: Number, default: 0 }, // minutes from template start
    energyLevel: { type: String, default: 'medium' },
  }],

  usageCount: { type: Number, default: 0 },
  createdAt:  { type: Date, default: Date.now },
  updatedAt:  { type: Date, default: Date.now },
});

templateSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Template', templateSchema);
