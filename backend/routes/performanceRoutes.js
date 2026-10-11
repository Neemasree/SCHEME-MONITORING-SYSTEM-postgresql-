const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');
const User = require('../models/User');
const { fn, col, literal } = require('sequelize');

// Return live application-based district metrics, not stale manually seeded ratings.
router.get('/', authenticate, allowRoles('admin', 'district_officer', 'field_officer'), async (req, res) => {
  try {
    const where = {};
    if (['district_officer', 'field_officer'].includes(req.user.role)) {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      where.district = user.district;
    }

    const rows = await Application.findAll({
      where,
      attributes: [
        'district',
        [fn('COUNT', col('id')), 'totalApplications'],
        [fn('SUM', literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), 'approved'],
        [fn('SUM', literal(`CASE WHEN status IN ('Pending Field Officer', 'Pending District Officer', 'Pending Admin') THEN 1 ELSE 0 END`)), 'pending'],
        [fn('SUM', literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), 'rejected'],
      ],
      group: ['district'],
      raw: true,
      order: [[col('district'), 'ASC']],
    });

    return res.json(rows.map((row) => {
      const total = Number(row.totalApplications || 0);
      const approved = Number(row.approved || 0);
      const rate = total > 0 ? (approved / total) * 100 : 0;
      const rating = total === 0 ? 'N/A' : rate >= 80 ? 'A' : rate >= 60 ? 'B' : rate >= 40 ? 'C' : 'D';
      return {
        district: row.district,
        totalApplications: total,
        approved,
        pending: Number(row.pending || 0),
        rejected: Number(row.rejected || 0),
        approvalRate: Number(rate.toFixed(2)),
        rating,
      };
    }));
  } catch (error) {
    console.error('Fetch district performance failed:', error);
    return res.status(500).json({ message: 'Unable to load district performance' });
  }
});

module.exports = router;
