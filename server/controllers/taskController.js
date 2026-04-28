const Task = require('../models/Task');

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const { category, status, priority, search, date, sort = '-createdAt', page = 1, limit = 50 } = req.query;
    const filter = { user: req.user._id, isTemplate: false };

    if (category) filter.category = category;
    if (status)   filter.status = status;
    if (priority) filter.priority = priority;
    if (search)   filter.title = { $regex: search, $options: 'i' };
    if (date) {
      const d = new Date(date);
      const next = new Date(d); next.setDate(next.getDate() + 1);
      filter.scheduledAt = { $gte: d, $lt: next };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sort).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tasks/today
exports.getTodayTasks = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end   = new Date(); end.setHours(23, 59, 59, 999);
    const tasks = await Task.find({
      user: req.user._id,
      isTemplate: false,
      $or: [
        { scheduledAt: { $gte: start, $lte: end } },
        { deadline:    { $gte: start, $lte: end } },
      ],
    }).sort('scheduledAt');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tasks/:id
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, priority, deadline, scheduledAt,
            duration, tags, isRecurring, recurrencePattern, energyLevel, reminderAt } = req.body;

    const task = await Task.create({
      user: req.user._id, title, description, category, priority,
      deadline, scheduledAt, duration, tags, isRecurring,
      recurrencePattern, energyLevel, reminderAt,
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Mark completedAt when status changes to completed
    if (req.body.status === 'completed' && !task.completedAt) {
      task.completedAt = new Date();
      await task.save();
    }
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /api/tasks/:id/complete
exports.completeTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'completed', completedAt: new Date(), updatedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
