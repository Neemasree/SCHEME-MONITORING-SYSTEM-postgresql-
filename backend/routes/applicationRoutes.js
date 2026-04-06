const express = require('express');
const router = express.Router();
const Application = require('../models/Application');

router.get('/', async (req, res) => {
  try {
    const applications = await Application.findAll();
    
    // Formatting to match the expectations of the Frontend (Applications.jsx, Dashboard.jsx)
    const formatted = applications.map(app => ({
      ...app.get({ plain: true }),
      _id: app.id.toString().padStart(12, '0'), // Mock MongoDB style ID
      beneficiaryName: app.beneficiary,
      appliedDate: app.dateApplied,
      schemeId: {
        schemeName: app.scheme || 'Unknown Scheme'
      }
    }));
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update application status
router.put('/:id/approve', async (req, res) => {
  try {
    const { action, remark } = req.body;
    let status = action === 'approve' ? 'Approved' : 'Rejected';
    
    // Find application by ID
    // Frontend is likely passing _id as the URL parameter.
    // We'll need to parse it back to a base-10 ID if we use simple number IDs.
    const idStr = req.params.id;
    const appId = parseInt(idStr, 10);
    
    // Alternatively, if it's the mock ID we created above:
    const application = await Application.findByPk(appId);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    application.status = status;
    
    // Log remark if provided
    if (remark) {
      const newRemark = {
        role: req.body.role || 'system', // Ideally from auth middleware wrapper
        date: new Date().toISOString(),
        text: remark
      };
      
      const currentRemarks = application.remarks || [];
      application.remarks = [...currentRemarks, newRemark];
      application.changed('remarks', true); // Force Sequelize to track JSON change
    }
    
    await application.save();
    
    res.json({ message: `Application ${status.toLowerCase()} successfully`, application });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
