const router = require('express').Router();
const ctrl   = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/overview',          ctrl.getOverview);
router.get('/by-category',       ctrl.getByCategory);
router.get('/weekly-trend',      ctrl.getWeeklyTrend);
router.get('/daily-heatmap',     ctrl.getDailyHeatmap);
router.get('/priority-breakdown',ctrl.getPriorityBreakdown);

module.exports = router;
