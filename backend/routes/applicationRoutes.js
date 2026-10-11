const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const scope = {};
    if (req.user.role === 'district_officer') {
      const user = await User.findByPk(req.user.id, { attributes: ['district'] });
      if (!user?.district) {
        return res.status(403).json({ message: 'No district is assigned to this account' });
      }
      scope.district = user.district;
    }

    const applications = await Application.findAll({ where: scope });

    const formatted = applications.map((app) => ({
      ...app.get({ plain: true }),
      _id: String(app.id).padStart(12, '0'),
      beneficiaryName: app.beneficiary,
      appliedDate: app.dateApplied,
      schemeId: {
        schemeName: app.scheme || 'Unknown Scheme',
      },
    }));

    return res.json(formatted);
  } catch (error) {
    console.error('Fetch applications failed:', error);
    return res.status(500).json({ message: 'Unable to fetch applications' });
  }
});

router.put(
  '/:id/approve',
  allowRoles('field_officer', 'district_officer', 'admin'),
  async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    const { action, remark } = req.body || {};

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

    if (req.user.role === 'district_officer') {
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
      const status = action === 'approve' ? 'Approved' : 'Rejected';
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
        action: action === 'approve' ? 'application_approved' : 'application_rejected',
        actorId: req.user.id,
        actorRole: req.user.role,
        previousStatus,
        newStatus: status,
        remark: normalizedRemark || null,
      }, { transaction });

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
