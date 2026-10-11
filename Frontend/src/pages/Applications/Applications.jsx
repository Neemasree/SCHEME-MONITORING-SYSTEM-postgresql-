import { useState, useEffect } from 'react';
import StatusTable from '../../components/Tables/StatusTable';
import ActionModal from '../../components/Modal/ActionModal';
import { SkeletonTable } from '../../components/Loading/Skeletons';
import api from '../../utils/api';
import './Applications.css';

const Applications = ({ role, searchTerm = '' }) => {
    const [data, setData] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);

    const fetchApplications = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/applications');
            const rows = Array.isArray(response.data) ? response.data : response.data.data || [];
            setData(rows.map((app) => ({
                ...app,
                _id: String(app.id),
                id: String(app.id).padStart(6, '0').toUpperCase(),
                beneficiary: app.beneficiaryName || app.beneficiary || '—',
                scheme: app.schemeId?.schemeName || app.scheme || '—',
                district: app.district || '—',
                dateApplied: app.appliedDate || app.dateApplied
                    ? new Date(app.appliedDate || app.dateApplied).toLocaleDateString()
                    : '—',
            })));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load applications.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    useEffect(() => {
        if (!selectedApp?._id || !isModalOpen) {
            setHistory([]);
            return;
        }
        let cancelled = false;
        api.get(`/applications/${selectedApp._id}/history`)
            .then(({ data: rows }) => {
                if (!cancelled) setHistory(Array.isArray(rows) ? rows : []);
            })
            .catch(() => {
                if (!cancelled) setHistory([]);
            });
        return () => { cancelled = true; };
    }, [selectedApp, isModalOpen]);

    const columns = [
        { header: 'App ID', key: 'id' },
        { header: 'Beneficiary', key: 'beneficiary' },
        { header: 'Scheme', key: 'scheme' },
        { header: 'District', key: 'district' },
        { header: 'Date', key: 'dateApplied' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Action', key: 'action', align: 'center' },
    ];

    const term = searchTerm.trim().toLowerCase();
    const filteredData = data.filter((app) => {
        const roleVisible =
            role === 'admin' ||
            role === 'district' ||
            role === 'district_officer' ||
            (role === 'field' || role === 'field_officer')
                ? true
                : false;

        if (!roleVisible) return false;

        const status = String(app.status || '').toLowerCase();
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'pending' && status.includes('pending')) ||
            (statusFilter === 'approved' && status === 'approved') ||
            (statusFilter === 'rejected' && status === 'rejected');

        const matchesSearch =
            !term ||
            String(app.beneficiary).toLowerCase().includes(term) ||
            String(app.scheme).toLowerCase().includes(term) ||
            String(app.id).toLowerCase().includes(term) ||
            String(app.district).toLowerCase().includes(term);

        return matchesStatus && matchesSearch;
    });

    const handleActionClick = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const submitDecision = async (app, action, remark) => {
        try {
            await api.put(`/applications/${app._id}/approve`, { action, remark });
            await fetchApplications();
            setIsModalOpen(false);
            setSelectedApp(null);
        } catch (requestError) {
            window.alert(requestError.response?.data?.message || `Failed to ${action} application.`);
        }
    };

    const handleApprove = (app, remark) => submitDecision(app, 'approve', remark);
    const handleReject = (app, remark) => submitDecision(app, 'reject', remark);

    return (
        <div className="applications-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Application Processing</h1>
                    <p className="page-subtitle">Track and review beneficiary applications</p>
                </div>
                <div className="status-filters">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                        aria-label="Filter applications by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}

            {isLoading ? <SkeletonTable rows={8} /> : (
                <StatusTable
                    columns={columns}
                    data={filteredData}
                    onActionClick={handleActionClick}
                    itemsPerPage={8}
                />
            )}

            {selectedApp && (
                <ActionModal
                    isOpen={isModalOpen}
                    data={selectedApp}
                    role={role}
                    history={history}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedApp(null);
                    }}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}
        </div>
    );
};

export default Applications;
