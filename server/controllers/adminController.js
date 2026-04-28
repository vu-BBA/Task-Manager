const User = require('../models/User');
const Task = require('../models/Task');
const Template = require('../models/Template');

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const [totalUsers, activeUsers, totalTasks, completedTasks, templates] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true, lastLogin: { $gte: new Date(Date.now() - 7*24*60*60*1000) } }),
      Task.countDocuments({ isTemplate: false }),
      Task.countDocuments({ isTemplate: false, status: 'completed' }),
      Template.countDocuments({ isGlobal: true }),
    ]);

    // Category distribution across all users
    const categoryDist = await Task.aggregate([
      { $match: { isTemplate: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    res.json({ totalUsers, activeUsers, totalTasks, completedTasks, templates, categoryDist });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort('-createdAt').skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/admin/users/:id/toggle
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot disable admin' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ user, message: `User ${user.isActive ? 'enabled' : 'disabled'}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin' });
    await Task.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);
    res.json({ message: 'User and all their tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/templates  — create global template
exports.createGlobalTemplate = async (req, res) => {
  try {
    const template = await Template.create({ ...req.body, isGlobal: true, user: req.user._id });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
