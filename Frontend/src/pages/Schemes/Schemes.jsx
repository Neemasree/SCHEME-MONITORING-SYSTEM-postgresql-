import { useState, useEffect } from 'react';
import StatusTable from '../../components/Tables/StatusTable';
import { SkeletonTable } from '../../components/Loading/Skeletons';
import { schemes } from '../../data/dummyData';
import { Plus } from 'lucide-react';
import './Schemes.css';

const Schemes = ({ role, searchTerm = '' }) => {
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Simulate network load
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setData(schemes);
            setIsLoading(false);
        }, 600);
        return () => clearTimeout(timer);
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

        // Global Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(app =>
                app.name.toLowerCase().includes(term) ||
                app.district.toLowerCase().includes(term) ||
                app.id.toString().includes(term)
            );
        }

        return filtered;
    };

    const handleActionClick = (row) => {
        alert(`Showing details for Scheme: ${row.name}`);
    };

    return (
        <div className="schemes-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Government Schemes</h1>
                    <p className="page-subtitle">View and manage all active schemes and allocations</p>
                </div>

                {role === 'admin' && (
                    <button className="btn-primary animate-fade-in">
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
        </div>
    );
};

export default Schemes;
