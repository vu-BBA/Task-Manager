const Task = require('../models/Task');

// GET /api/analytics/overview
exports.getOverview = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const startOfDay   = new Date(now); startOfDay.setHours(0,0,0,0);
    const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [total, completed, todayTotal, todayDone, weekDone, overdue] = await Promise.all([
      Task.countDocuments({ user: userId, isTemplate: false }),
      Task.countDocuments({ user: userId, isTemplate: false, status: 'completed' }),
      Task.countDocuments({ user: userId, isTemplate: false, scheduledAt: { $gte: startOfDay } }),
      Task.countDocuments({ user: userId, isTemplate: false, status: 'completed', completedAt: { $gte: startOfDay } }),
      Task.countDocuments({ user: userId, isTemplate: false, status: 'completed', completedAt: { $gte: startOfWeek } }),
      Task.countDocuments({ user: userId, isTemplate: false, status: { $ne: 'completed' }, deadline: { $lt: now } }),
    ]);

    res.json({
      total, completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      todayTotal, todayDone,
      weekDone, overdue,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/analytics/by-category
exports.getByCategory = async (req, res) => {
  try {
    const data = await Task.aggregate([
      { $match: { user: req.user._id, isTemplate: false } },
      { $group: {
          _id: '$category',
          total:     { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalMins: { $sum: '$duration' },
      }},
      { $sort: { total: -1 } },
    ]);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/analytics/weekly-trend
exports.getWeeklyTrend = async (req, res) => {
  try {
    const weeks = 8;
    const results = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay() - i * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const [total, done] = await Promise.all([
        Task.countDocuments({ user: req.user._id, isTemplate: false, createdAt: { $gte: start, $lte: end } }),
        Task.countDocuments({ user: req.user._id, isTemplate: false, status: 'completed', completedAt: { $gte: start, $lte: end } }),
      ]);
      results.push({ week: `W${weeks - i}`, start, end, total, done, rate: total > 0 ? Math.round((done/total)*100) : 0 });
    }
    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/analytics/daily-heatmap
exports.getDailyHeatmap = async (req, res) => {
  try {
    const days = 30;
    const start = new Date(); start.setDate(start.getDate() - days); start.setHours(0,0,0,0);

    const data = await Task.aggregate([
      { $match: { user: req.user._id, isTemplate: false, status: 'completed', completedAt: { $gte: start } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/analytics/priority-breakdown
exports.getPriorityBreakdown = async (req, res) => {
  try {
    const data = await Task.aggregate([
      { $match: { user: req.user._id, isTemplate: false } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
