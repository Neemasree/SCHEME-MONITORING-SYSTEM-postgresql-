import { useState, useEffect } from 'react';
import { SkeletonChart } from '../../components/Loading/Skeletons';
import { BarGraph } from '../../components/Charts/SchemeCharts';
import { districtPerformance } from '../../data/dummyData';
import { MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import './Districts.css';

const Districts = ({ role }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const districtData = districtPerformance.map(d => ({
        district: d.district,
        total: d.totalApplications,
        approved: d.approved,
        rejected: d.rejected
    }));

    return (
        <div className="districts-page">
            <div className="page-header animate-fade-in">
                <h1 className="page-title">District Monitoring Hub</h1>
                <p className="page-subtitle">Analyze performance and application throughput across regions</p>
            </div>

            <div className="districts-grid animate-fade-in" style={{ animationDelay: '0.1s' }}>
                {districtPerformance.map((dist) => (
                    <div key={dist.id} className="district-card glass-card">
                        <div className="district-header">
                            <div className="district-title">
                                <MapPin size={20} className="primary-icon" />
                                <h3>{dist.district}</h3>
                            </div>
                            <span className={`rating-badge score-${(dist.rating || 'B').replace('+', 'plus').toLowerCase()}`}>
                                Grade {dist.rating || 'B'}
                            </span>
                        </div>

                        <div className="district-stats">
                            <div className="d-stat">
                                <span className="d-label">Total Applications</span>
                                <span className="d-val">{dist.totalApplications}</span>
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
                        data={districtData}
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
