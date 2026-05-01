const Task = require('../models/Task');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Simple in-memory cache for AI responses (per session)
const aiCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getGenAI() {
  if (!global.genAI) {
    global.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  return global.genAI;
}

function getCached(key) {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  aiCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Lightweight ML Engine — pure JavaScript + Google Gemini AI
 * Features:
 *  1. Smart task ordering (priority × urgency × energy scoring)
 *  2. Recurring task detection (frequency analysis)
 *  3. Best productive hour detection
 *  4. AI-powered task analysis and recommendations (Gemini)
 *  5. Natural Language Task Entry
 *  6. Smart Task Prioritizer
 *  7. Motivational Daily Briefing
 *  8. Automatic Task Breakdown
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

    // Check cache
    const cacheKey = `analysis_${req.user._id}_${tasks.length}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Format tasks for AI analysis
    const taskSummary = tasks.map(t =>
      `${t.title} (${t.priority} priority, ${t.energyLevel} energy, deadline: ${t.deadline || 'none'})`
    ).join('\n');

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
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

    const response = { analysis, taskCount: tasks.length };
    setCache(cacheKey, response);
    res.json(response);
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

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
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

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
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

// ─── 7. NATURAL LANGUAGE TASK ENTRY ──────────────────────────────────────────
exports.parseNaturalLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text input required' });
    }

    // Check cache
    const cacheKey = `nl_${text.toLowerCase().trim()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Parse this task description into a JSON object. Respond with ONLY valid JSON (no markdown, no explanation):

Input: "${text}"

Extract and return JSON with these fields:
- title: concise task title (max 10 words)
- duration: estimated duration in minutes (number only, default 60)
- date: date in YYYY-MM-DD format (today if not specified)
- time: time in HH:MM format (24h, default 09:00 if not specified)
- priority: "urgent", "high", "medium", or "low" (default "medium")
- energyLevel: "high", "medium", or "low" (default "medium")
- category: one of "Work", "Personal", "Health", "Finance", "Learning", "Hobby", "Errands", "Home"

JSON:`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Extract JSON from response (handle if model wraps in markdown)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    // Ensure defaults
    if (!parsed.date) parsed.date = new Date().toISOString().split('T')[0];
    if (!parsed.time) parsed.time = '09:00';
    if (!parsed.duration) parsed.duration = 60;
    if (!parsed.priority) parsed.priority = 'medium';
    if (!parsed.energyLevel) parsed.energyLevel = 'medium';

    const response = { parsed, originalText: text };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Natural Language Parse Error:', err);
    res.status(500).json({ message: 'Failed to parse task', error: err.message });
  }
};

// ─── 8. SMART TASK PRIORITIZER ──────────────────────────────────────────────
exports.suggestNextTask = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user._id,
      isTemplate: false,
      status: { $in: ['pending', 'in-progress'] },
    }).limit(15);

    if (tasks.length === 0) {
      return res.json({ message: 'No pending tasks', suggestion: null });
    }

    // Check cache based on task IDs
    const taskIds = tasks.map(t => t._id.toString()).sort().join(',');
    const cacheKey = `prioritize_${req.user._id}_${taskIds}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const now = new Date();
    const hour = now.getHours();

    // Energy level based on time of day
    let timeEnergy = 'medium';
    if (hour >= 6 && hour <= 11) timeEnergy = 'high';      // Morning
    else if (hour >= 12 && hour <= 15) timeEnergy = 'high';  // Early afternoon
    else if (hour >= 16 && hour <= 19) timeEnergy = 'medium'; // Late afternoon
    else timeEnergy = 'low';                                 // Evening/night

    const taskList = tasks.map(t =>
      `- ${t.title} (Priority: ${t.priority}, Energy needed: ${t.energyLevel}, Deadline: ${t.deadline || 'none'})`
    ).join('\n');

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `You are a productivity coach. Based on the current time (${hour}:00, energy level: ${timeEnergy}), suggest which task the user should start RIGHT NOW.

Tasks:
${taskList}

Consider:
1. Current energy level (${timeEnergy}) - match tasks to energy
2. Urgency (deadlines approaching)
3. Priority level
4. Task complexity

Respond with ONLY valid JSON:
{
  "suggestedTaskId": "task_id_here",
  "reason": "brief reason (10 words max)",
  "tip": "one actionable tip for this task"
}

JSON:`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const suggestion = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    // Find the actual task to return full details
    const suggestedTask = tasks.find(t => t._id.toString() === suggestion.suggestedTaskId) ||
                          tasks.sort((a, b) => computeTaskScore(b, now) - computeTaskScore(a, now))[0];

    const response = {
      suggestion: {
        task: suggestedTask,
        reason: suggestion.reason || 'Highest priority based on ML scoring',
        tip: suggestion.tip || 'Break it into smaller steps if needed',
        currentTimeEnergy: timeEnergy
      }
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Task Prioritizer Error:', err);
    // Fallback to ML scoring
    const tasks = await Task.find({
      user: req.user._id,
      status: { $in: ['pending', 'in-progress'] },
    }).limit(5);
    const scored = tasks.map(t => ({ task: t, score: computeTaskScore(t, new Date()) }))
                        .sort((a, b) => b.score - a.score);
    res.json({
      suggestion: scored[0] ? { task: scored[0].task, reason: 'ML score', tip: 'Start now!' } : null
    });
  }
};

// ─── 9. MOTIVATIONAL DAILY BRIEFING ──────────────────────────────────────────
exports.getDailyBriefing = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [completedToday, overdue, totalPending] = await Promise.all([
      Task.countDocuments({
        user: req.user._id,
        status: 'completed',
        completedAt: { $gte: today },
      }),
      Task.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
        deadline: { $lt: new Date() },
      }),
      Task.countDocuments({
        user: req.user._id,
        status: { $in: ['pending', 'in-progress'] },
      }),
    ]);

    // Check cache (refresh every 30 min)
    const cacheKey = `briefing_${req.user._id}_${today.toISOString().split('T')[0]}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Generate a short, motivational 2-sentence greeting for a user's daily task briefing.

Stats:
- Completed today: ${completedToday} tasks
- Overdue tasks: ${overdue}
- Pending tasks: ${totalPending}

Tone: Encouraging, personal, upbeat. Mention their progress specifically.

Respond with ONLY the 2-sentence greeting (no quotes, no explanation):`;

    const result = await model.generateContent(prompt);
    const greeting = result.response.text().trim();

    const response = {
      greeting,
      stats: { completedToday, overdue, totalPending },
      motivation: completedToday > 0
        ? `You're on fire! 🔥`
        : overdue > 3
          ? `Let's tackle those overdue tasks! 💪`
          : `Ready to be productive? ✨`
    };

    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Daily Briefing Error:', err);
    res.status(500).json({ message: 'Failed to generate briefing', error: err.message });
  }
};

// ─── 10. AUTOMATIC TASK BREAKDOWN ────────────────────────────────────────────
exports.breakdownTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check cache
    const cacheKey = `breakdown_${taskId}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const model = getGenAI().getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Break down this task into 3-5 actionable sub-tasks. Respond with ONLY valid JSON array:

Task: "${task.title}"
Description: "${task.description || ''}"
Priority: ${task.priority}
Duration: ${task.duration || 60} minutes

Return JSON array of objects with fields:
- title: concise sub-task name
- duration: estimated minutes (number)
- order: number (1, 2, 3...)

JSON array:`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    const subtasks = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    // Save breakdown to task
    task.subtasks = subtasks.map((st, i) => ({
      title: st.title,
      duration: st.duration || 30,
      order: st.order || i + 1,
      completed: false,
    }));
    await task.save();

    const response = { taskId: task._id, subtasks: task.subtasks };
    setCache(cacheKey, response);
    res.json(response);
  } catch (err) {
    console.error('Task Breakdown Error:', err);
    res.status(500).json({ message: 'Failed to breakdown task', error: err.message });
  }
};
