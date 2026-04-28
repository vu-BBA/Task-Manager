const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role:     { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:   { type: String, default: '' },

  preferences: {
    workStartTime:   { type: String, default: '09:00' },
    workEndTime:     { type: String, default: '17:00' },
    focusBlockMins:  { type: Number, default: 90 },
    reminderMins:    { type: Number, default: 15 },
    timezone:        { type: String, default: 'UTC' },
    theme:           { type: String, default: 'dark' },
    defaultCategory: { type: String, default: 'work' },
  },

  isActive:   { type: Boolean, default: true },
  lastLogin:  { type: Date },
  createdAt:  { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
