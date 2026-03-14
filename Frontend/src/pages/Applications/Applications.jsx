import { useState, useEffect } from 'react';
import StatusTable from '../../components/Tables/StatusTable';
import ActionModal from '../../components/Modal/ActionModal';
import { SkeletonTable } from '../../components/Loading/Skeletons';
import { applications } from '../../data/dummyData';
import './Applications.css';

const Applications = ({ role, searchTerm = '' }) => {
    const [data, setData] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    // Simulate network load
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setData(applications);
            setIsLoading(false);
        }, 800);
        return () => clearTimeout(timer);
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

        // 1. Role Base Filtering
        if (role === 'district') {
            filtered = filtered.filter(app =>
                app.status.includes('District Officer') ||
                app.status === 'Approved' ||
                app.status === 'Rejected'
            );
        } else if (role === 'field') {
            filtered = filtered.filter(app => app.status.includes('Field Officer'));
        }

        // 2. Dropdown Status Filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(app => {
                const s = app.status.toLowerCase();
                if (statusFilter === 'pending') return s.includes('pending');
                if (statusFilter === 'approved') return s === 'approved';
                if (statusFilter === 'rejected') return s === 'rejected';
                return true;
            });
        }

        // 3. Global Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                app.beneficiary.toLowerCase().includes(term) ||
                app.scheme.toLowerCase().includes(term) ||
                app.id.toString().includes(term) ||
                app.district.toLowerCase().includes(term)
            );
        }

        return filtered;
    };

    const handleActionClick = (app) => {
        setSelectedApp(app);
        setIsModalOpen(true);
    };

    const handleApprove = (app, remarks) => {
        let newStatus = '';

        if (role === 'field') newStatus = 'Pending District Officer';
        if (role === 'district') newStatus = 'Pending Admin Approval';
        if (role === 'admin') newStatus = 'Approved';

        updateApplicationStatus(app.id, newStatus);
        setIsModalOpen(false);
    };

    const handleReject = (app, remarks) => {
        updateApplicationStatus(app.id, 'Rejected');
        setIsModalOpen(false);
    };

    const updateApplicationStatus = (id, newStatus) => {
        setData(prevData =>
            prevData.map(item =>
                item.id === id ? { ...item, status: newStatus } : item
            )
        );
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
