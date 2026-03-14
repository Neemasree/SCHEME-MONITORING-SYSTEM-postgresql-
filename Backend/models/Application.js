import mongoose from 'mongoose';

const applicationSchema = mongoose.Schema({
    beneficiaryName: {
        type: String,
        required: true
    },
    schemeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Scheme'
    },
    district: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending Field Officer', 'Pending District Officer', 'Pending Admin', 'Approved', 'Rejected'],
        default: 'Pending Field Officer'
    },
    fieldOfficerApproval: {
        status: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date }
    },
    districtOfficerApproval: {
        status: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date }
    },
    adminApproval: {
        status: { type: Boolean, default: false },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date }
    },
    remarks: [{
        role: String,
        text: String,
        date: { type: Date, default: Date.now }
    }],
    appliedDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Application = mongoose.model('Application', applicationSchema, 'gvt');

export default Application;
