const Task = require('../models/Task');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/**
 * Lightweight ML Engine — pure JavaScript + Google Gemini AI
 * Features:
 *  1. Smart task ordering (priority × urgency × energy scoring)
 *  2. Recurring task detection (frequency analysis)
 *  3. Best productive hour detection
 *  4. AI-powered task analysis and recommendations (Gemini)
 */

// ─── 1. SMART SCHEDULING SCORE ────────────────────────────────────────────────
const PRIORITY_WEIGHTS = { urgent: 4, high: 3, medium: 2, low: 1 };
const ENERGY_WEIGHTS   = { high: 3, medium: 2, low: 1 };

function computeTaskScore(task, now = new Date()) {
  const priority  = PRIORITY_WEIGHTS[task.priority]  || 2;
  const energy    = ENERGY_WEIGHTS[task.energyLevel]  || 2;

  // Urgency: how close is the deadline (0–10 scale)
  let urgency = 0;
  if (task.deadline) {
    const hoursLeft = (new Date(task.deadline) - now) / (1000 * 60 * 60);
    if (hoursLeft <= 0)       urgency = 10;
    else if (hoursLeft <= 6)  urgency = 9;
    else if (hoursLeft <= 24) urgency = 7;
    else if (hoursLeft <= 72) urgency = 4;
    else                      urgency = 1;
  }

  return (priority * 3) + (urgency * 2) + energy;
}

// GET /api/ml/suggestions
exports.getSmartSuggestions = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isTemplate: false,
      status: { $in: ['pending', 'in-progress'] },
    });

    const now = new Date();
    const scored = tasks.map(t => ({
      ...t.toObject(),
      mlScore: computeTaskScore(t, now),
    })).sort((a, b) => b.mlScore - a.mlScore);

    // Save scores back
    await Promise.all(scored.map(t => Task.findByIdAndUpdate(t._id, { mlScore: t.mlScore })));

    res.json({ suggestions: scored.slice(0, 10) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── 2. RECURRING TASK DETECTION ──────────────────────────────────────────────
exports.detectRecurring = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isTemplate: false,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // last 30 days
    });

    // Group by normalized title
    const groups = {};
    tasks.forEach(t => {
      const key = t.title.toLowerCase().trim();
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });

    const recurring = [];
    for (const [title, group] of Object.entries(groups)) {
      if (group.length < 3) continue; // needs at least 3 occurrences

      // Detect time pattern
      const times = group
        .filter(t => t.scheduledAt)
        .map(t => {
          const d = new Date(t.scheduledAt);
          return d.getHours() * 60 + d.getMinutes();
        });

      const avgTime = times.length > 0 ? Math.round(times.reduce((a,b) => a+b, 0) / times.length) : null;
      const hours   = avgTime !== null ? String(Math.floor(avgTime / 60)).padStart(2, '0') : null;
      const mins    = avgTime !== null ? String(avgTime % 60).padStart(2, '0') : null;

      // Detect day-of-week pattern
      const dayCount = Array(7).fill(0);
      group.forEach(t => {
        const d = t.scheduledAt ? new Date(t.scheduledAt) : new Date(t.createdAt);
        dayCount[d.getDay()]++;
      });
      const dominantDay = dayCount.indexOf(Math.max(...dayCount));

      recurring.push({
        title,
        occurrences:  group.length,
        category:     group[0].category,
        suggestedTime: hours ? `${hours}:${mins}` : null,
        suggestedDay:  dominantDay,
        confidence:   Math.min(100, Math.round((group.length / 30) * 100 * 3)),
      });
    }

    res.json({ recurring: recurring.sort((a, b) => b.occurrences - a.occurrences) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── 3. PRODUCTIVE HOURS ──────────────────────────────────────────────────────
exports.getProductiveHours = async (req, res) => {
  try {
    const completed = await Task.find({
      user: req.user._id,
      status: 'completed',
      completedAt: { $exists: true },
    });

    const hourBuckets = Array(24).fill(0);
    completed.forEach(t => {
      const h = new Date(t.completedAt).getHours();
      hourBuckets[h]++;
    });

    const data = hourBuckets.map((count, hour) => ({ hour, count }));
    const peak = data.reduce((max, cur) => cur.count > max.count ? cur : max, data[0]);

    res.json({ data, peakHour: peak.hour, peakCount: peak.count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── 4. AI-POWERED TASK ANALYSIS & RECOMMENDATIONS (Google Gemini) ───────────
exports.getAIAnalysis = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isTemplate: false,
      status: { $in: ['pending', 'in-progress'] },
    }).limit(20);

    if (tasks.length === 0) {
      return res.json({ analysis: 'No tasks to analyze', recommendations: [] });
    }

    // Format tasks for AI analysis
    const taskSummary = tasks.map(t => 
      `${t.title} (${t.priority} priority, ${t.energyLevel} energy, deadline: ${t.deadline || 'none'})`
    ).join('\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are a productivity expert. Analyze these tasks and provide 3 specific recommendations to optimize productivity and reduce overwhelm:

Tasks:
${taskSummary}

Provide:
1. A brief overall assessment (2 sentences)
2. 3 actionable recommendations (bullet points)
3. Suggested priority order for today

Be concise and practical.`;

    const result = await model.generateContent(prompt);
    const analysis = result.response.text();

    res.json({ analysis, taskCount: tasks.length });
  } catch (err) {
    console.error('AI Analysis Error:', err);
    res.status(500).json({ message: 'AI analysis failed', error: err.message });
  }
};

// ─── 5. AI TASK CATEGORIZATION ────────────────────────────────────────────────
exports.getAITaskCategorization = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      category: { $exists: false },
    }).limit(50);

    if (tasks.length === 0) {
      return res.json({ categorized: 0, message: 'All tasks already categorized' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    let categorized = 0;

    for (const task of tasks) {
      const prompt = `Categorize this task into ONE category. Respond with ONLY the category name (no explanation):

Task: "${task.title}"
Description: "${task.description || ''}"

Categories to choose from: Work, Personal, Health, Finance, Learning, Hobby, Errands, Home

Category:`;

      try {
        const result = await model.generateContent(prompt);
        const category = result.response.text().trim();
        
        await Task.findByIdAndUpdate(task._id, { category });
        categorized++;
      } catch (e) {
        console.error(`Failed to categorize task ${task._id}`);
      }
    }

    res.json({ categorized, message: `${categorized} tasks categorized with AI` });
  } catch (err) {
    console.error('Categorization Error:', err);
    res.status(500).json({ message: 'Categorization failed', error: err.message });
  }
};

// ─── 6. AI DEADLINE PREDICTION ───────────────────────────────────────────────
exports.getAIDeadlinePrediction = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Task title required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Estimate a realistic deadline for this task. Respond with ONLY a number representing days from today:

Task: "${title}"
Description: "${description || ''}"

Estimate realistic completion in days (1-30):`;

    const result = await model.generateContent(prompt);
    const daysFromNow = parseInt(result.response.text().trim()) || 3;
    
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysFromNow);

    res.json({ 
      estimatedDays: daysFromNow, 
      suggestedDeadline: deadline.toISOString(),
      reasoning: `Based on task complexity, estimated ${daysFromNow} days is reasonable`
    });
  } catch (err) {
    console.error('Deadline Prediction Error:', err);
    res.status(500).json({ message: 'Deadline prediction failed', error: err.message });
  }
};
