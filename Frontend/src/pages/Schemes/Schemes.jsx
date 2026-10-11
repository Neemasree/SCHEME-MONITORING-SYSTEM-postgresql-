import { useState, useEffect } from 'react';
import StatusTable from '../../components/Tables/StatusTable';
import { SkeletonTable } from '../../components/Loading/Skeletons';
import api from '../../utils/api';
import { Plus } from 'lucide-react';
import SchemeModal from './SchemeModal';
import './Schemes.css';

const Schemes = ({ role, searchTerm = '' }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchSchemes = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await api.get('/schemes', { params: { limit: 100 } });
            // The API now returns { data, pagination }; accept the legacy array shape too.
            const rows = Array.isArray(response.data) ? response.data : response.data.data || [];
            setData(rows.map((scheme) => ({
                ...scheme,
                id: String(scheme.id).padStart(6, '0').toUpperCase(),
                name: scheme.schemeName || scheme.name || 'Unnamed scheme',
                district: scheme.district || '—',
                budget: scheme.budget ?? '—',
            })));
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Unable to load schemes.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes();
    }, [refreshKey]);

    const columns = [
        { header: 'Scheme ID', key: 'id' },
        { header: 'Scheme Name', key: 'name' },
        { header: 'District Focus', key: 'district' },
        { header: 'Budget', key: 'budget' },
        { header: 'Beneficiaries', key: 'beneficiariesCount', align: 'right' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Details', key: 'action', align: 'center' },
    ];

    const term = searchTerm.trim().toLowerCase();
    const filteredData = data.filter((scheme) =>
        !term ||
        String(scheme.name).toLowerCase().includes(term) ||
        String(scheme.district).toLowerCase().includes(term) ||
        String(scheme.id).toLowerCase().includes(term)
    );

    const handleActionClick = (row) => {
        window.alert(`Details for ${row.name}:\n${row.description || 'No description provided.'}`);
    };

    const handleSaveScheme = async (newScheme) => {
        try {
            await api.post('/schemes', newScheme);
            setIsModalOpen(false);
            setRefreshKey((key) => key + 1);
        } catch (requestError) {
            window.alert(requestError.response?.data?.message || 'Failed to save scheme. Please try again.');
        }
    };

    return (
        <div className="schemes-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Government Schemes</h1>
                    <p className="page-subtitle">View and manage schemes and allocations</p>
                </div>
                {role === 'admin' && (
                    <button className="btn-primary animate-fade-in" onClick={() => setIsModalOpen(true)}>
                        <Plus size={18} /> New Scheme
                    </button>
                )}
            </div>

            {error && <div className="error-banner" role="alert">{error}</div>}
            <div className="schemes-content slideUp" style={{ animationDelay: '0.1s' }}>
                {isLoading ? <SkeletonTable rows={8} /> : (
                    <StatusTable
                        columns={columns}
                        data={filteredData}
                        onActionClick={handleActionClick}
                        itemsPerPage={8}
                    />
                )}
            </div>

            <SchemeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveScheme}
            />
        </div>
    );
};

export default Schemes;
