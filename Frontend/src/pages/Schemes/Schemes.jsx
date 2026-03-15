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

    const fetchSchemes = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/schemes');
            // Map backend fields to UI keys
            const mappedData = data.map(s => ({
                ...s,
                id: s._id.slice(-6).toUpperCase(), // Short ID for display
                name: s.schemeName,
                budget: s.budget >= 10000000
                    ? `₹${(s.budget / 10000000).toFixed(2)} Cr`
                    : `₹${(s.budget / 100000).toFixed(2)} L`,
            }));
            setData(mappedData);
        } catch (error) {
            console.error("Error fetching schemes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemes();
    }, []);

    const columns = [
        { header: 'Scheme ID', key: 'id' },
        { header: 'Scheme Name', key: 'name' },
        { header: 'District Focus', key: 'district' },
        { header: 'Budget', key: 'budget' },
        { header: 'Beneficiaries', key: 'beneficiariesCount', align: 'right' },
        { header: 'Status', key: 'status', align: 'center' },
        { header: 'Details', key: 'action', align: 'center' },
    ];

    const getFilteredData = () => {
        let filtered = data;

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(term) ||
                app.district.toLowerCase().includes(term) ||
                app.id.includes(term)
            );
        }

        return filtered;
    };

    const handleActionClick = (row) => {
        alert(`Details for ${row.name}:\n${row.description}`);
    };

    const handleAddScheme = () => {
        setIsModalOpen(true);
    };

    const handleSaveScheme = async (newScheme) => {
        try {
            await api.post('/schemes', newScheme);
            fetchSchemes(); // Refresh list after saving
        } catch (error) {
            console.error("Error saving scheme:", error);
            alert("Failed to save scheme. Please try again.");
        }
    };

    return (
        <div className="schemes-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Government Schemes</h1>
                    <p className="page-subtitle">View and manage all active schemes and allocations</p>
                </div>

                {role === 'admin' && (
                    <button className="btn-primary animate-fade-in" onClick={handleAddScheme}>
                        <Plus size={18} /> New Scheme
                    </button>
                )}
            </div>

            <div className="schemes-content slideUp" style={{ animationDelay: '0.1s' }}>
                {isLoading ? (
                    <SkeletonTable rows={8} />
                ) : (
                    <StatusTable
                        columns={columns}
                        data={getFilteredData()}
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
