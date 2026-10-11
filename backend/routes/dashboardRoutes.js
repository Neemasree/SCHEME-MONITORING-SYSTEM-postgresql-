const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/stats', allowRoles('admin', 'district_officer', 'field_officer'), dashboardController.getStats);
router.get('/analytics', allowRoles('admin', 'district_officer', 'field_officer'), dashboardController.getAnalytics);

module.exports = router;
