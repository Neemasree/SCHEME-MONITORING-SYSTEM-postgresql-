const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', dashboardController.getStats);
router.get('/analytics', dashboardController.getAnalytics);

module.exports = router;
