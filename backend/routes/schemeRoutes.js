const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const { allowRoles } = require('../middleware/authMiddleware');

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

router.get('/', async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1, 1000000);
  const limit = parsePositiveInt(req.query.limit, 20, 100);
  const offset = (page - 1) * limit;
  const where = {};

  if (typeof req.query.status === 'string' && req.query.status.trim()) {
    where.status = req.query.status.trim();
  }
  try {
    if (['district_officer', 'field_officer'].includes(req.user.role)) {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      where.district = user.district;
    } else if (typeof req.query.district === 'string' && req.query.district.trim()) {
      where.district = req.query.district.trim();
    }

    const result = await Scheme.findAndCountAll({
      where,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    return res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    console.error('Fetch schemes failed:', error);
    return res.status(500).json({ message: 'Unable to fetch schemes' });
  }
});

router.post('/', allowRoles('admin'), async (req, res) => {
  const {
    schemeName,
    description,
    budget,
    district,
    startDate,
    endDate,
    status,
  } = req.body || {};

  if (typeof schemeName !== 'string' || schemeName.trim().length < 3 || schemeName.trim().length > 200) {
    return res.status(400).json({ message: 'Scheme name must be between 3 and 200 characters' });
  }

  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    return res.status(400).json({ message: 'End date must be on or after start date' });
  }

  try {
    const scheme = await Scheme.create({
      schemeName: schemeName.trim(),
      description: typeof description === 'string' ? description.trim() : null,
      budget: typeof budget === 'string' || typeof budget === 'number' ? String(budget) : null,
      district: typeof district === 'string' ? district.trim() : null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: status || 'Active',
    });

    return res.status(201).json(scheme);
  } catch (error) {
    console.error('Create scheme failed:', error);
    return res.status(400).json({ message: 'Unable to create scheme; check the supplied fields' });
  }
});

module.exports = router;
