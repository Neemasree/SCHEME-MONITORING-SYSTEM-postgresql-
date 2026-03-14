import { useState, useEffect } from 'react';
import { SkeletonChart } from '../../components/Loading/Skeletons';
import { BarGraph } from '../../components/Charts/SchemeCharts';
import api from '../../utils/api';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import './Districts.css';

const Districts = ({ role }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [performance, setPerformance] = useState([]);

    useEffect(() => {
        const fetchDistricts = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/dashboard/analytics');
                setPerformance(data.districtStats || []);
            } catch (error) {
                console.error("Error fetching district data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDistricts();
    }, []);

    const getGrade = (approved, total) => {
        if (total === 0) return 'N/A';
        const rate = (approved / total) * 100;
        if (rate >= 80) return 'A';
        if (rate >= 60) return 'B';
        if (rate >= 40) return 'C';
        return 'D';
    };

    return (
        <div className="districts-page">
            <div className="page-header animate-fade-in">
                <h1 className="page-title">District Monitoring Hub</h1>
                <p className="page-subtitle">Analyze performance and application throughput across regions</p>
            </div>

            <div className="districts-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {performance.map((dist) => (
                    <div key={dist.district} className="district-card glass-card">
                        <div className="district-header">
                            <div className="district-title">
                                <MapPin size={20} className="primary-icon" />
                                <h3>{dist.district}</h3>
                            </div>
                            <span className={`rating-badge score-${getGrade(dist.approved, dist.total).toLowerCase()}`}>
                                Grade {getGrade(dist.approved, dist.total)}
                            </span>
                        </div>

                        <div className="district-stats">
                            <div className="d-stat">
                                <span className="d-label">Total Applications</span>
                                <span className="d-val">{dist.total}</span>
                            </div>
                            <div className="d-stat">
                                <span className="d-label">Approved</span>
                                <span className="d-val success-text">{dist.approved}</span>
                            </div>
                            <div className="d-stat">
                                <span className="d-label">Rejected</span>
                                <span className="d-val danger-text">{dist.rejected}</span>
                            </div>
                            <div className="d-stat">
                                <span className="d-label">Pending</span>
                                <span className="d-val warning-text">{dist.pending}</span>
                            </div>
                        </div>

                        <div className="district-footer">
                            <button className="btn-secondary btn-sm">View Details</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="districts-chart-container animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {isLoading ? (
                    <SkeletonChart />
                ) : (
                    <BarGraph
                        data={performance}
                        title="District Comparative Performance"
                        dataKey="total"
                        xAxisKey="district"
                    />
                )}
            </div>
        </div>
    );
};

export default Districts;
