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

    const fetchApplications = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/applications');
            const mappedData = data.map(app => ({
                ...app,
                _id: String(app.id), // For any action references
                id: String(app.id).padStart(6, '0').toUpperCase(),
                beneficiary: app.beneficiary,
                scheme: app.scheme,
                dateApplied: new Date(app.dateApplied).toLocaleDateString()
            }));
            setData(mappedData);
        } catch (error) {
            console.error("Error fetching applications:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const columns = [
        { header: 'App ID', key: 'id' },
        { header: 'Beneficiary', key: 'beneficiary' },
        { header: 'Scheme', key: 'scheme' },
        { header: 'District', key: 'district' },
        { header: 'Date', key: 'dateApplied' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Action', key: 'action', align: 'center' },
    ];

    const getFilteredData = () => {
        let filtered = data;

        // Role Base Filtering (Frontend view safety)
        if (role === 'district' || role === 'district_officer') {
            filtered = filtered.filter(app =>
                app.status.includes('District Officer') ||
                app.status === 'Pending Admin' ||
                app.status === 'Approved' ||
                app.status === 'Rejected'
            );
        } else if (role === 'field' || role === 'field_officer') {
            filtered = filtered.filter(app => app.status.includes('Field Officer'));
        }

        // Dropdown Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => {
                const s = app.status.toLowerCase();
                if (statusFilter === 'pending') return s.includes('pending');
                if (statusFilter === 'approved') return s === 'approved';
                if (statusFilter === 'rejected') return s === 'rejected';
                return true;
            });
        }

        // Global Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                app.beneficiary.toLowerCase().includes(term) ||
                app.scheme.toLowerCase().includes(term) ||
                app.id.includes(term) ||
                app.district.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    const handleActionClick = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const handleApprove = async (app, remark) => {
        try {
            await api.put(`/applications/${app._id}/approve`, {
                action: 'approve',
                remark,
                role // Passed from user context via props
            });
            fetchApplications(); // Refresh list
            setIsModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to approve application");
        }
    };

    const handleReject = async (app, remark) => {
        try {
            await api.put(`/applications/${app._id}/approve`, {
                action: 'reject',
                remark,
                role // Passed from user context via props
            });
            fetchApplications(); // Refresh list
            setIsModalOpen(false);
        } catch (error) {
            alert(error.response?.data?.message || "Failed to reject application");
        }
    };

    return (
        <div className="applications-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Application Processing</h1>
                    <p className="page-subtitle">Track, verify, and approve beneficiary applications</p>
                </div>

                <div className="status-filters">
                    <select
                        className="filter-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <div className="applications-content slideUp" style={{ animationDelay: '0.1s' }}>
                {isLoading ? (
                    <SkeletonTable rows={10} />
                ) : (
                    <StatusTable
                        columns={columns}
                        data={getFilteredData()}
                        onActionClick={handleActionClick}
                        itemsPerPage={10}
                    />
                )}
            </div>

            <ActionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                data={selectedApp}
                role={role}
                onApprove={handleApprove}
                onReject={handleReject}
            />
        </div>
    );
};

export default Applications;
