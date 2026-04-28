const router = require('express').Router();
const ctrl   = require('../controllers/mlController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/suggestions',       ctrl.getSmartSuggestions);
router.get('/recurring',         ctrl.detectRecurring);
router.get('/productive-hours',  ctrl.getProductiveHours);
router.get('/ai-analysis',       ctrl.getAIAnalysis);
router.post('/ai-categorize',    ctrl.getAITaskCategorization);
router.post('/ai-deadline',      ctrl.getAIDeadlinePrediction);

module.exports = router;
