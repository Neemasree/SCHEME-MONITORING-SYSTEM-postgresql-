const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Scheme = require('../models/Scheme');
const Notification = require('../models/Notification');
const { allowRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { applicationSchema, approvalSchema } = require('../validation/schemas');

const parsePositiveInt = (value, fallback, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const notifyWorkflowRecipients = async (application, status, transaction) => {
  let recipients = [];
  let title = 'Application update';
  let message = `Application #${application.id} is now ${status}.`;
  let type = 'info';

  if (status === 'Pending Field Officer') {
    recipients = await User.findAll({
      where: { role: 'field_officer', district: application.district, isActive: true },
      attributes: ['id', 'role'],
      transaction,
    });
    title = 'New application to verify';
  } else if (status === 'Pending District Officer') {
    recipients = await User.findAll({
      where: { role: 'district_officer', district: application.district, isActive: true },
      attributes: ['id', 'role'],
      transaction,
    });
    title = 'Application forwarded for district review';
  } else if (status === 'Pending Admin') {
    recipients = await User.findAll({
      where: { role: 'admin', isActive: true },
      attributes: ['id', 'role'],
      transaction,
    });
    title = 'Application awaiting final approval';
  } else if (['Approved', 'Rejected'].includes(status) && application.beneficiaryUserId) {
    const beneficiary = await User.findByPk(application.beneficiaryUserId, {
      attributes: ['id', 'role', 'isActive'],
      transaction,
    });
    if (beneficiary?.isActive) recipients = [beneficiary];
    title = status === 'Approved' ? 'Application approved' : 'Application rejected';
    type = status === 'Approved' ? 'success' : 'error';
  }

  if (recipients.length === 0) return;
  await Notification.bulkCreate(recipients.map((recipient) => ({
    userId: recipient.id,
    role: recipient.role,
    title,
    message,
    type,
    isRead: false,
  })), { transaction });
};

router.get('/', async (req, res) => {
  try {
    const scope = {};
    if (req.user.role === 'beneficiary') {
      scope.beneficiaryUserId = req.user.id;
    } else if (['district_officer', 'field_officer'].includes(req.user.role)) {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      scope.district = user.district;
    }

    const page = parsePositiveInt(req.query.page, 1, 1000000);
    const limit = parsePositiveInt(req.query.limit, 20, 100);
    const result = await Application.findAndCountAll({
      where: scope,
      limit,
      offset: (page - 1) * limit,
      order: [['dateApplied', 'DESC'], ['id', 'DESC']],
    });

    const formatted = result.rows.map((app) => ({
      ...app.get({ plain: true }),
      _id: String(app.id).padStart(12, '0'),
      beneficiaryName: app.beneficiary,
      appliedDate: app.dateApplied,
      schemeId: {
        schemeName: app.scheme || 'Unknown Scheme',
      },
    }));

    return res.json({
      data: formatted,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch (error) {
    console.error('Fetch applications failed:', error);
    return res.status(500).json({ message: 'Unable to fetch applications' });
  }
});

router.post('/', allowRoles('beneficiary'), validate(applicationSchema), async (req, res) => {
  const schemeId = Number.parseInt(req.body?.schemeId, 10);
  if (!Number.isInteger(schemeId) || schemeId <= 0) {
    return res.status(400).json({ message: 'A valid scheme is required' });
  }

  try {
    const scheme = await Scheme.findByPk(schemeId);
    if (!scheme || scheme.status !== 'Active') {
      return res.status(404).json({ message: 'Active scheme not found' });
    }
    if (!scheme.district?.trim()) {
      return res.status(400).json({ message: 'This scheme does not have a district configured' });
    }

    const transaction = await Application.sequelize.transaction();
    try {
      const application = await Application.create({
        beneficiaryUserId: req.user.id,
        beneficiary: req.user.name,
        scheme: scheme.schemeName,
        district: scheme.district,
        status: 'Pending Field Officer',
        dateApplied: new Date().toISOString().slice(0, 10),
        remarks: [],
      }, { transaction });

      await AuditLog.create({
        entityType: 'application',
        entityId: application.id,
        action: 'application_submitted',
        actorId: req.user.id,
        actorRole: req.user.role,
        previousStatus: null,
        newStatus: application.status,
        remark: null,
      }, { transaction });
      await notifyWorkflowRecipients(application, application.status, transaction);

      await transaction.commit();
      return res.status(201).json({ message: 'Application submitted successfully', application });
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create application failed:', error);
    return res.status(500).json({ message: 'Unable to submit application' });
  }
});

router.get('/:id/history', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid application ID' });
  }

  try {
    const where = { id };
    if (req.user.role === 'beneficiary') where.beneficiaryUserId = req.user.id;
    if (['district_officer', 'field_officer'].includes(req.user.role)) {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      where.district = user.district;
    }

    const application = await Application.findOne({ where, attributes: ['id'] });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const history = await AuditLog.findAll({
      where: { entityType: 'application', entityId: id },
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
    });
    return res.json(history);
  } catch (error) {
    console.error('Fetch application history failed:', error);
    return res.status(500).json({ message: 'Unable to fetch application history' });
  }
});

router.put(
  '/:id/approve',
  allowRoles('field_officer', 'district_officer', 'admin'),
  validate(approvalSchema),
  async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const { action, remark } = req.body || {};
    const allowedRolesByStatus = {
      'Pending Field Officer': ['field_officer'],
      'Pending District Officer': ['district_officer'],
      'Pending Admin': ['admin'],
    };

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be approve or reject' });
    }

    if (remark !== undefined && (typeof remark !== 'string' || remark.length > 2000)) {
      return res.status(400).json({ message: 'Remark must be a string of at most 2000 characters' });
    }

    if (action === 'reject' && !remark?.trim()) {
      return res.status(400).json({ message: 'A reason is required when rejecting an application' });
    }

    if (['district_officer', 'field_officer'].includes(req.user.role)) {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      const visibleApplication = await Application.findOne({ where: { id, district: user.district } });
      if (!visibleApplication) {
        return res.status(404).json({ message: 'Application not found' });
      }
    }

    const transaction = await Application.sequelize.transaction();
    try {
      const application = await Application.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!application) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Application not found' });
      }

      if (['Approved', 'Rejected'].includes(application.status)) {
        await transaction.rollback();
        return res.status(409).json({ message: 'This application has already reached a final status' });
      }

      const previousStatus = application.status;
      if (req.user.role !== 'admin' && req.user.role !== 'district_officer' && req.user.role !== 'field_officer') {
        await transaction.rollback();
        return res.status(403).json({ message: 'You do not have permission to review applications' });
      }
      const authorizedRoles = allowedRolesByStatus[previousStatus];
      if (!authorizedRoles || !authorizedRoles.includes(req.user.role)) {
        await transaction.rollback();
        return res.status(409).json({ message: 'Your role cannot act on an application in its current status' });
      }

      let status;
      if (action === 'reject') {
        status = 'Rejected';
      } else if (previousStatus === 'Pending Field Officer') {
        status = 'Pending District Officer';
      } else if (previousStatus === 'Pending District Officer') {
        status = 'Pending Admin';
      } else {
        status = 'Approved';
      }
      const currentRemarks = Array.isArray(application.remarks) ? application.remarks : [];
      const normalizedRemark = typeof remark === 'string' ? remark.trim() : '';
      const auditRemark = {
        userId: req.user.id,
        role: req.user.role,
        date: new Date().toISOString(),
        text: normalizedRemark,
      };

      application.status = status;
      application.remarks = [...currentRemarks, auditRemark];
      application.changed('remarks', true);

      await application.save({ transaction });
      await AuditLog.create({
        entityType: 'application',
        entityId: application.id,
        action: action === 'reject' ? 'application_rejected' : status === 'Approved' ? 'application_approved' : 'application_forwarded',
        actorId: req.user.id,
        actorRole: req.user.role,
        previousStatus,
        newStatus: status,
        remark: normalizedRemark || null,
      }, { transaction });
      await notifyWorkflowRecipients(application, status, transaction);

      await transaction.commit();
      return res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
    } catch (error) {
      if (!transaction.finished) await transaction.rollback();
      console.error('Update application failed:', error);
      return res.status(500).json({ message: 'Unable to update this application' });
    }
  }
);

module.exports = router;
