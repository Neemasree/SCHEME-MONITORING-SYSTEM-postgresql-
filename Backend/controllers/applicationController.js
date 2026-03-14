import Application from '../models/Application.js';
import User from '../models/User.js';
import { createNotification } from './notificationController.js';

// @desc    Create new beneficiary application
// @route   POST /api/applications
// @access  Private (Usually Field Officer or portal)
const createApplication = async (req, res) => {
    const { beneficiaryName, schemeId, district } = req.body;

    const application = await Application.create({
        beneficiaryName,
        schemeId,
        district
    });

    if (application) {
        res.status(201).json(application);
    } else {
        res.status(400).json({ message: 'Invalid application data' });
    }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private
const getApplications = async (req, res) => {
    const applications = await Application.find({}).populate('schemeId', 'schemeName');
    res.json(applications);
};

// @desc    Update application status (Approval flow)
// @route   PUT /api/applications/:id/approve
// @access  Private
const approveApplication = async (req, res) => {
    const { remark, action } = req.body; // action: 'approve' or 'reject'
    const application = await Application.findById(req.params.id);

    if (!application) {
        res.status(404).json({ message: 'Application not found' });
        return;
    }

    if (action === 'reject') {
        application.status = 'Rejected';
    } else {
        // Approval Logic based on Role
        if (req.user.role === 'field_officer') {
            application.fieldOfficerApproval = {
                status: true,
                approvedBy: req.user._id,
                date: Date.now()
            };
            application.status = 'Pending District Officer';
        } else if (req.user.role === 'district_officer') {
            if (!application.fieldOfficerApproval.status) {
                res.status(400).json({ message: 'Field Officer approval required first' });
                return;
            }
            application.districtOfficerApproval = {
                status: true,
                approvedBy: req.user._id,
                date: Date.now()
            };
            application.status = 'Pending Admin';
        } else if (req.user.role === 'admin') {
            if (!application.districtOfficerApproval.status) {
                res.status(400).json({ message: 'District Officer approval required first' });
                return;
            }
            application.adminApproval = {
                status: true,
                approvedBy: req.user._id,
                date: Date.now()
            };
            application.status = 'Approved';
        }
    }

    if (remark) {
        application.remarks.push({
            role: req.user.role,
            text: remark
        });
    }

    const updatedApplication = await application.save();

    // Notification Logic
    if (action === 'reject') {
        // Notify someone? Maybe the system log
        await createNotification(req.user._id, 'Application Rejected', `You rejected application #${updatedApplication._id.toString().slice(-6).toUpperCase()}`, 'error');
    } else {
        // Notify next level
        let nextRole = '';
        if (req.user.role === 'field_officer') nextRole = 'district_officer';
        if (req.user.role === 'district_officer') nextRole = 'admin';

        if (nextRole) {
            const nextUsers = await User.find({ role: nextRole });
            for (const user of nextUsers) {
                await createNotification(
                    user._id,
                    'New Application for Review',
                    `Application #${updatedApplication._id.toString().slice(-6).toUpperCase()} is pending your review.`,
                    'info'
                );
            }
        } else if (req.user.role === 'admin') {
            // Final approval notification can go to the field officer who started it
            if (updatedApplication.fieldOfficerApproval?.approvedBy) {
                await createNotification(
                    updatedApplication.fieldOfficerApproval.approvedBy,
                    'Application Finalized',
                    `Your application #${updatedApplication._id.toString().slice(-6).toUpperCase()} has been fully approved.`,
                    'success'
                );
            }
        }
    }

    res.json(updatedApplication);
};

export { createApplication, getApplications, approveApplication };
