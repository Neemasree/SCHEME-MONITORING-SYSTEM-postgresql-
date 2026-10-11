import { X, Check, XCircle, Clock, MessageSquare } from 'lucide-react';
import StatusBadge from '../Badge/StatusBadge';
import './ActionModal.css';
import { useState } from 'react';

const ActionModal = ({ isOpen, onClose, data, onApprove, onReject, role, history = [], actionError = '' }) => {
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
        if (role === 'admin' && data.status !== 'Pending Admin') return false;
        if (role === 'field' && data.status !== 'Pending Field Officer') return false;
        if (role === 'district' && data.status !== 'Pending District Officer') return false;
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
                    {actionError && <div className="login-error-alert" role="alert">{actionError}</div>}
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

                    <div className="remarks-history-section">
                        <h3 className="section-title">Audit Timeline</h3>
                        {history.length > 0 ? (
                            <ol className="remarks-list">
                                {history.map((entry) => (
                                    <li key={entry.id} className="remark-item glass-card">
                                        <div className="remark-header">
                                            <span className={`role-tag ${entry.actorRole || ''}`}>
                                                {String(entry.actorRole || 'system').replaceAll('_', ' ')}
                                            </span>
                                            <span className="remark-date">
                                                <Clock size={12} /> {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'Time unavailable'}
                                            </span>
                                        </div>
                                        <p className="remark-text">
                                            <strong>{String(entry.action || 'updated').replaceAll('_', ' ')}</strong>
                                            {entry.previousStatus ? ` — ${entry.previousStatus}` : ''}
                                            {entry.newStatus ? ` → ${entry.newStatus}` : ''}
                                        </p>
                                        {entry.remark && <p>{entry.remark}</p>}
                                    </li>
                                ))}
                            </ol>
                        ) : <p>No audit events are available yet.</p>}
                    </div>

                    {data.remarks && data.remarks.length > 0 && (
                        <div className="remarks-history-section">
                            <h3 className="section-title">Remarks History</h3>
                            <div className="remarks-list">
                                {data.remarks.map((rem, idx) => (
                                    <div key={idx} className="remark-item glass-card">
                                        <div className="remark-header">
                                            <span className={`role-tag ${rem.role}`}>{rem.role.replace('_', ' ')}</span>
                                            <span className="remark-date">
                                                <Clock size={12} /> {new Date(rem.date).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="remark-text">
                                            <MessageSquare size={14} className="quote-icon" />
                                            {rem.text}
                                        </p>
                                    </div>
                                ))}
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
