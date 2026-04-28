const router = require('express').Router();
const ctrl   = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get ('/',           ctrl.getTasks);
router.get ('/today',      ctrl.getTodayTasks);
router.get ('/:id',        ctrl.getTask);
router.post('/',           ctrl.createTask);
router.put ('/:id',        ctrl.updateTask);
router.delete('/:id',      ctrl.deleteTask);
router.patch('/:id/complete', ctrl.completeTask);

module.exports = router;
