import { X, Check, XCircle } from 'lucide-react';
import StatusBadge from '../Badge/StatusBadge';
import './ActionModal.css';
import { useState } from 'react';

const ActionModal = ({ isOpen, onClose, data, onApprove, onReject, role }) => {
    const [remarks, setRemarks] = useState('');

    if (!isOpen || !data) return null;

    const handleBackdropClick = (e) => {
        if (e.target.classList.contains('modal-backdrop')) {
            onClose();
        }
    };

    const submitAction = (actionType) => {
        if (actionType === 'approve') onApprove(data, remarks);
        if (actionType === 'reject') onReject(data, remarks);
        setRemarks('');
    };

    // Determine if action buttons should be shown based on role and current status
    const canAct = () => {
        if (role === 'admin' && data.status.includes('Approved')) return false; // Admin final approval, simplified
        if (role === 'field' && !data.status.includes('Field Officer')) return false;
        if (role === 'district' && !data.status.includes('District Officer')) return false;
        if (data.status === 'Approved' || data.status === 'Rejected') return false;
        return true;
    };

    const showActions = canAct();

    // Role-specific button labels
    const approveLabel = role === 'admin' ? 'Final Approve & Disburse' : 'Approve & Forward';
    const rejectLabel = 'Reject Application';

    return (
        <div className="modal-backdrop fadeIn" onClick={handleBackdropClick}>
            <div className="modal-content glass-card slideUp">
                <div className="modal-header">
                    <h2 className="modal-title">Application Details</h2>
                    <button className="close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="details-grid">
                        <div className="detail-group">
                            <span className="detail-label">Application ID</span>
                            <span className="detail-value">#{data.id}</span>
                        </div>
                        <div className="detail-group">
                            <span className="detail-label">Current Status</span>
                            <div className="detail-value">
                                <StatusBadge status={data.status} />
                            </div>
                        </div>
                        <div className="detail-group">
                            <span className="detail-label">Beneficiary Name</span>
                            <span className="detail-value">{data.beneficiary}</span>
                        </div>
                        <div className="detail-group">
                            <span className="detail-label">Date Applied</span>
                            <span className="detail-value">{data.dateApplied}</span>
                        </div>
                        <div className="detail-group full-width">
                            <span className="detail-label">Scheme Name</span>
                            <span className="detail-value font-medium">{data.scheme}</span>
                        </div>
                        <div className="detail-group">
                            <span className="detail-label">District</span>
                            <span className="detail-value">{data.district}</span>
                        </div>
                    </div>

                    {showActions && (
                        <div className="action-section">
                            <h3 className="section-title">Officer Verification</h3>
                            <div className="input-group">
                                <label htmlFor="remarks">Remarks / Notes (Required for rejection)</label>
                                <textarea
                                    id="remarks"
                                    className="remarks-input"
                                    placeholder="Enter your verification remarks here..."
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    rows={3}
                                ></textarea>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>
                        Close
                    </button>

                    {showActions && (
                        <div className="action-buttons">
                            <button
                                className="btn btn-danger"
                                onClick={() => submitAction('reject')}
                                disabled={!remarks.trim()}
                            >
                                <XCircle size={16} /> {rejectLabel}
                            </button>
                            <button
                                className="btn btn-success"
                                onClick={() => submitAction('approve')}
                            >
                                <Check size={16} /> {approveLabel}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActionModal;
