const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const { sequelize } = require('../config/db');

const sendServerError = (res, label, error) => {
  console.error(`${label} failed:`, error);
  return res.status(500).json({ message: `Unable to load ${label.toLowerCase()}` });
};

exports.getStats = async (_req, res) => {
  try {
    const [totalSchemes, totalApplications, approvedApplications, rejectedApplications, pendingApplications] = await Promise.all([
      Scheme.count(),
      Application.count(),
      Application.count({ where: { status: 'Approved' } }),
      Application.count({ where: { status: 'Rejected' } }),
      Application.count({ where: { status: { [Op.in]: ['Pending Field Officer', 'Pending District Officer', 'Pending Admin'] } } }),
    ]);

    return res.json({ totalSchemes, totalApplications, approvedApplications, rejectedApplications, pendingApplications });
  } catch (error) {
    return sendServerError(res, 'Dashboard statistics', error);
  }
};

exports.getAnalytics = async (req, res) => {
  const { startDate, endDate, district } = req.query || {};
  const where = {};
  const isDate = (value) => typeof value === 'string' && /^\\d{4}-\\d{2}-\\d{2}$/.test(value);

  if (startDate && !isDate(startDate)) return res.status(400).json({ message: 'startDate must use YYYY-MM-DD format' });
  if (endDate && !isDate(endDate)) return res.status(400).json({ message: 'endDate must use YYYY-MM-DD format' });
  if (isDate(startDate)) where.dateApplied = { ...(where.dateApplied || {}), [Op.gte]: startDate };
  if (isDate(endDate)) where.dateApplied = { ...(where.dateApplied || {}), [Op.lte]: endDate };
  if (startDate && endDate && startDate > endDate) return res.status(400).json({ message: 'startDate must be on or before endDate' });
  if (typeof district === 'string' && district.trim()) where.district = district.trim();

  try {
    const [districtRows, statusRows, schemeRows, trendRows] = await Promise.all([
      Application.findAll({
        where,
        attributes: [
          'district',
          [fn('COUNT', col('id')), 'total'],
          [fn('SUM', literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), 'approved'],
          [fn('SUM', literal(`CASE WHEN status IN ('Pending Field Officer', 'Pending District Officer', 'Pending Admin') THEN 1 ELSE 0 END`)), 'pending'],
          [fn('SUM', literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), 'rejected'],
        ],
        group: ['district'],
        raw: true,
      }),
      Application.findAll({ where, attributes: ['status', [fn('COUNT', col('id')), 'value']], group: ['status'], raw: true }),
      Application.findAll({ where, attributes: ['scheme', [fn('COUNT', col('id')), 'value']], group: ['scheme'], raw: true }),
      sequelize.query(
        `SELECT TO_CHAR("dateApplied", 'YYYY-MM') AS month, COUNT(id)::int AS applications
         FROM "Applications"
         WHERE (:startDate IS NULL OR "dateApplied" >= CAST(:startDate AS DATE))
           AND (:endDate IS NULL OR "dateApplied" <= CAST(:endDate AS DATE))
           AND (:district IS NULL OR district = :district)
         GROUP BY TO_CHAR("dateApplied", 'YYYY-MM')
         ORDER BY month`,
        {
          replacements: { startDate: isDate(startDate) ? startDate : null, endDate: isDate(endDate) ? endDate : null, district: typeof district === 'string' && district.trim() ? district.trim() : null },
          type: QueryTypes.SELECT,
        }
      ),
    ]);

    const response = {
      districtStats: districtRows.map((row) => ({ district: row.district, total: Number(row.total), approved: Number(row.approved || 0), pending: Number(row.pending || 0), rejected: Number(row.rejected || 0) })),
      statusData: statusRows.map((row) => ({ name: row.status, value: Number(row.value) })),
      schemeData: schemeRows.map((row) => ({ name: row.scheme || 'Unknown Scheme', value: Number(row.value) })),
      trendData: trendRows.map((row) => ({ month: row.month, applications: Number(row.applications) })),
    };

    if (req.user?.role === 'district_officer') {
      const User = require('../models/User');
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) return res.status(403).json({ message: 'No district is assigned to this account' });
      where.district = user.district;
      const [scopedDistricts, scopedStatuses, scopedSchemes, scopedTrend] = await Promise.all([
        Application.findAll({
          where,
          attributes: ['district', [fn('COUNT', col('id')), 'total'],
            [fn('SUM', literal(`CASE WHEN status = 'Approved' THEN 1 ELSE 0 END`)), 'approved'],
            [fn('SUM', literal(`CASE WHEN status IN ('Pending Field Officer', 'Pending District Officer', 'Pending Admin') THEN 1 ELSE 0 END`)), 'pending'],
            [fn('SUM', literal(`CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END`)), 'rejected']],
          group: ['district'], raw: true,
        }),
        Application.findAll({ where, attributes: ['status', [fn('COUNT', col('id')), 'value']], group: ['status'], raw: true }),
        Application.findAll({ where, attributes: ['scheme', [fn('COUNT', col('id')), 'value']], group: ['scheme'], raw: true }),
        sequelize.query(
          \`SELECT TO_CHAR(\"dateApplied\", 'YYYY-MM') AS month, COUNT(id)::int AS applications FROM \"Applications\"
           WHERE (:startDate IS NULL OR \"dateApplied\" >= CAST(:startDate AS DATE))
             AND (:endDate IS NULL OR \"dateApplied\" <= CAST(:endDate AS DATE)) AND district = :district
           GROUP BY TO_CHAR(\"dateApplied\", 'YYYY-MM') ORDER BY month\`,
          { replacements: { startDate: isDate(startDate) ? startDate : null, endDate: isDate(endDate) ? endDate : null, district: user.district }, type: QueryTypes.SELECT }
        ),
      ]);
      response.districtStats = scopedDistricts.map((row) => ({ district: row.district, total: Number(row.total), approved: Number(row.approved || 0), pending: Number(row.pending || 0), rejected: Number(row.rejected || 0) }));
      response.statusData = scopedStatuses.map((row) => ({ name: row.status, value: Number(row.value) }));
      response.schemeData = scopedSchemes.map((row) => ({ name: row.scheme || 'Unknown Scheme', value: Number(row.value) }));
      response.trendData = scopedTrend.map((row) => ({ month: row.month, applications: Number(row.applications) }));
    }

    return res.json(response);
  } catch (error) {
    return sendServerError(res, 'Dashboard analytics', error);
  }
};