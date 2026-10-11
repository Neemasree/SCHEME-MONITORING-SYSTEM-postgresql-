const { Op, fn, col, literal, QueryTypes } = require('sequelize');
const Scheme = require('../models/Scheme');
const Application = require('../models/Application');
const User = require('../models/User');
const { sequelize } = require('../config/db');

const sendServerError = (res, label, error) => {
  console.error(`${label} failed:`, error);
  return res.status(500).json({ message: `Unable to load ${label.toLowerCase()}` });
};

const isDate = (value) =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const getDistrictScope = async (req) => {
  if (!['district_officer', 'field_officer'].includes(req.user?.role)) {
    return { district: null };
  }

  const user = await User.findByPk(req.user.id, { attributes: ['district'] });
  if (!user?.district) {
    const error = new Error('No district is assigned to this account');
    error.status = 403;
    throw error;
  }

  return { district: user.district };
};

exports.getStats = async (req, res) => {
  try {
    const { district } = await getDistrictScope(req);
    const applicationWhere = district ? { district } : {};
    const schemeWhere = district ? { district } : {};

    const [
      totalSchemes,
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
    ] = await Promise.all([
      Scheme.count({ where: schemeWhere }),
      Application.count({ where: applicationWhere }),
      Application.count({ where: { ...applicationWhere, status: 'Approved' } }),
      Application.count({ where: { ...applicationWhere, status: 'Rejected' } }),
      Application.count({
        where: {
          ...applicationWhere,
          status: { [Op.in]: ['Pending Field Officer', 'Pending District Officer', 'Pending Admin'] },
        },
      }),
    ]);

    return res.json({
      totalSchemes,
      totalApplications,
      approvedApplications,
      rejectedApplications,
      pendingApplications,
    });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ message: error.message });
    return sendServerError(res, 'Dashboard statistics', error);
  }
};

exports.getAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query || {};

  if (startDate && !isDate(startDate)) {
    return res.status(400).json({ message: 'startDate must use YYYY-MM-DD format' });
  }
  if (endDate && !isDate(endDate)) {
    return res.status(400).json({ message: 'endDate must use YYYY-MM-DD format' });
  }
  if (startDate && endDate && startDate > endDate) {
    return res.status(400).json({ message: 'startDate must be on or before endDate' });
  }

  try {
    // Resolve authorization scope before issuing any analytics query. Never run
    // an unscoped query and then replace its result for district/field users.
    const scope = await getDistrictScope(req);
    const district = scope.district || (
      req.user?.role === 'admin' && typeof req.query?.district === 'string'
        ? req.query.district.trim()
        : null
    );

    const where = {};
    if (startDate) where.dateApplied = { ...(where.dateApplied || {}), [Op.gte]: startDate };
    if (endDate) where.dateApplied = { ...(where.dateApplied || {}), [Op.lte]: endDate };
    if (district) where.district = district;

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
      Application.findAll({
        where,
        attributes: ['status', [fn('COUNT', col('id')), 'value']],
        group: ['status'],
        raw: true,
      }),
      Application.findAll({
        where,
        attributes: ['scheme', [fn('COUNT', col('id')), 'value']],
        group: ['scheme'],
        raw: true,
      }),
      sequelize.query(
        `SELECT TO_CHAR("dateApplied", 'YYYY-MM') AS month, COUNT(id)::int AS applications
         FROM "Applications"
         WHERE (:startDate IS NULL OR "dateApplied" >= CAST(:startDate AS DATE))
           AND (:endDate IS NULL OR "dateApplied" <= CAST(:endDate AS DATE))
           AND (:district IS NULL OR district = :district)
         GROUP BY TO_CHAR("dateApplied", 'YYYY-MM')
         ORDER BY month`,
        {
          replacements: {
            startDate: startDate || null,
            endDate: endDate || null,
            district,
          },
          type: QueryTypes.SELECT,
        },
      ),
    ]);

    return res.json({
      districtStats: districtRows.map((row) => ({
        district: row.district,
        total: Number(row.total),
        approved: Number(row.approved || 0),
        pending: Number(row.pending || 0),
        rejected: Number(row.rejected || 0),
      })),
      statusData: statusRows.map((row) => ({ name: row.status, value: Number(row.value) })),
      schemeData: schemeRows.map((row) => ({ name: row.scheme || 'Unknown Scheme', value: Number(row.value) })),
      trendData: trendRows.map((row) => ({ month: row.month, applications: Number(row.applications) })),
    });
  } catch (error) {
    if (error.status === 403) return res.status(403).json({ message: error.message });
    return sendServerError(res, 'Dashboard analytics', error);
  }
};
