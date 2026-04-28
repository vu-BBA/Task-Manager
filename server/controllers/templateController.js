const Template = require('../models/Template');
const Task     = require('../models/Task');

// GET /api/templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({
      $or: [{ user: req.user._id }, { isGlobal: true }],
    }).sort('-usageCount');
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/templates
exports.createTemplate = async (req, res) => {
  try {
    const { name, description, category, color, icon, tasks } = req.body;
    const template = await Template.create({
      user: req.user._id, name, description, category, color, icon, tasks,
    });
    res.status(201).json({ template });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/templates/:id
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ template });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/templates/:id
exports.deleteTemplate = async (req, res) => {
  try {
    const t = await Template.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!t) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/templates/:id/apply  — create tasks from template for a given date
exports.applyTemplate = async (req, res) => {
  try {
    const { startDate } = req.body;
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    const base = startDate ? new Date(startDate) : new Date();
    base.setHours(0, 0, 0, 0);

    const tasks = await Task.insertMany(template.tasks.map(t => ({
      user:        req.user._id,
      title:       t.title,
      description: t.description,
      category:    t.category || template.category,
      priority:    t.priority,
      duration:    t.duration,
      energyLevel: t.energyLevel,
      scheduledAt: new Date(base.getTime() + t.offsetMins * 60 * 1000),
      templateId:  template._id,
    })));

    template.usageCount += 1;
    await template.save();

    res.status(201).json({ tasks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
