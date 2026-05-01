const router = require('express').Router();
const ctrl   = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

router.use(protect);

// Existing routes
router.get('/suggestions',        ctrl.getSmartSuggestions);
router.get('/recurring',          ctrl.detectRecurring);
router.get('/productive-hours',   ctrl.getProductiveHours);
router.get('/ai-analysis',        ctrl.getAIAnalysis);
router.post('/ai-categorize',     ctrl.getAITaskCategorization);
router.post('/ai-deadline',      ctrl.getAIDeadlinePrediction);

// New AI features
router.post('/parse-task',       ctrl.parseNaturalLanguage);     // Natural Language Entry
router.get('/suggest-next',      ctrl.suggestNextTask);          // Smart Prioritizer
router.get('/daily-briefing',    ctrl.getDailyBriefing);         // Motivational Briefing
router.post('/breakdown/:taskId', ctrl.breakdownTask);           // Task Breakdown

module.exports = router;
