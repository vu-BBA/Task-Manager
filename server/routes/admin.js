const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get ('/stats',                ctrl.getStats);
router.get ('/users',                ctrl.getUsers);
router.patch('/users/:id/toggle',    ctrl.toggleUser);
router.delete('/users/:id',          ctrl.deleteUser);
router.post('/templates',            ctrl.createGlobalTemplate);

module.exports = router;
