const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');

router.get('/', async (req, res) => {
  try {
    const schemes = await Scheme.findAll();
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create scheme
router.post('/', async (req, res) => {
  try {
    const { schemeName, description, budget, district, startDate, endDate, status } = req.body;
    const scheme = await Scheme.create({ schemeName, description, budget, district, startDate, endDate, status });
    res.status(201).json(scheme);
  } catch (error) {
    console.error('Scheme create error:', error.message, error.errors?.map(e => e.message));
    res.status(400).json({ error: error.message, details: error.errors?.map(e => ({ field: e.path, msg: e.message })) });
  }
});

module.exports = router;
