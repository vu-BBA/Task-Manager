const User = require('../models/User');
const jwt  = require('jsonwebtoken');

const generateTokens = (userId) => {
  const access = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { access, refresh };
};

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    const user = await User.create({ name, email, password });
    const { access, refresh } = generateTokens(user._id);

    res.status(201).json({ user, access, refresh });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.isActive)
      return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await user.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { access, refresh } = generateTokens(user._id);
    res.json({ user, access, refresh });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/auth/refresh
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: 'User not found' });

    const { access, refresh } = generateTokens(user._id);
    res.json({ access, refresh });
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

// PUT /api/auth/me
exports.updateMe = async (req, res) => {
  try {
    const { name, avatar, preferences } = req.body;
    const update = {};
    if (name) update.name = name;
    if (avatar !== undefined) update.avatar = avatar;
    if (preferences) update.preferences = { ...req.user.preferences.toObject(), ...preferences };

    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

// PUT /api/auth/password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ message: 'Current password incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
