const router = require('express').Router();
const ctrl   = require('../controllers/templateController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get ('/',          ctrl.getTemplates);
router.post('/',          ctrl.createTemplate);
router.put ('/:id',       ctrl.updateTemplate);
router.delete('/:id',     ctrl.deleteTemplate);
router.post('/:id/apply', ctrl.applyTemplate);

module.exports = router;
