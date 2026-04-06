const express = require('express');
const router = express.Router();
const DistrictPerformance = require('../models/Performance');

router.get('/', async (req, res) => {
  try {
    const performance = await DistrictPerformance.findAll();
    res.json(performance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
