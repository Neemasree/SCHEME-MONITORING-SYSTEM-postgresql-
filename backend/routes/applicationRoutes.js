const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const { allowRoles } = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const applications = await Application.findAll();

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

// Temporary role gate for the existing decision endpoint.
// A follow-up workflow change must enforce allowed status transitions and use
// a dedicated audit table before the application is considered production-ready.
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

    try {
      const application = await Application.findByPk(id);
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }

      // Prevent terminal applications from being silently re-decided.
      if (['Approved', 'Rejected'].includes(application.status)) {
        return res.status(409).json({ message: 'This application has already reached a final status' });
      }

      // Keep the current project workflow's simplified status model. Replace
      // with explicit field -> district -> admin transitions as a planned upgrade.
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      const currentRemarks = Array.isArray(application.remarks) ? application.remarks : [];
      const newRemark = {
        userId: req.user.id,
        role: req.user.role,
        date: new Date().toISOString(),
        text: typeof remark === 'string' ? remark.trim() : '',
      };

      application.status = status;
      application.remarks = [...currentRemarks, newRemark];
      application.changed('remarks', true);

      await application.save();
      return res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
    } catch (error) {
      console.error('Update application failed:', error);
      return res.status(500).json({ message: 'Unable to update this application' });
    }
  }
);

module.exports = router;
