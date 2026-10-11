import { useState, useEffect } from 'react';
import DashboardCards from '../../components/DashboardCards/DashboardCards';
import { BarGraph, PieGraph, LineGraph } from '../../components/Charts/SchemeCharts';
import { SkeletonChart } from '../../components/Loading/Skeletons';
import api from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ role, username }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState({ statusData: [], schemeData: [], districtStats: [], trendData: [] });
    const [error, setError] = useState('');
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            setError('');
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/analytics')
                ]);

                setStats(statsRes.data);
                setAnalytics(analyticsRes.data);
            } catch (requestError) {
                console.error("Error fetching dashboard data:", requestError);
                setError(requestError.response?.data?.message || 'Unable to load dashboard data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [retryCount]);

    const greeting = {
        admin: `Welcome Administrator ${username}. System metrics are live.`,
        district: `Welcome ${username}. District metrics are synchronized.`,
        field: `Hello ${username}. Local application flow is monitored.`
    };

    return (
        <div className="dashboard-page">
            <div className="page-header animate-fade-in">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">{greeting[role] || greeting.field}</p>
            </div>

            {error && (
                <div className="error-banner" role="alert">
                    <p>{error}</p>
                    <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Try again</button>
                </div>
            )}

            <DashboardCards role={role} isLoading={isLoading} stats={stats} />

            <div className="charts-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {/* District Performance */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : analytics.districtStats.length > 0 ? (
                        <BarGraph
                            data={analytics.districtStats}
                            title="District Performance (Total Applications)"
                            dataKey="total"
                            xAxisKey="district"
                        />
                    ) : <p className="empty-state" role="status">No district performance data is available yet.</p>}
                </div>

                {/* Monthly Trends */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : analytics.trendData.length > 0 ? (
                        <LineGraph
                            data={analytics.trendData}
                            title="Application Inflow Trend (All Available Months)"
                            dataKey="applications"
                            xAxisKey="month"
                        />
                    ) : <p className="empty-state" role="status">No application trend data is available yet.</p>}
                </div>

                {/* Analytics Distribution */}
                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : analytics.statusData.length > 0 ? (
                        <PieGraph
                            data={analytics.statusData}
                            title="Application Status Distribution"
                        />
                    ) : <p className="empty-state" role="status">No application status data is available yet.</p>}
                </div>

                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : analytics.schemeData.length > 0 ? (
                        <PieGraph
                            data={analytics.schemeData}
                            title="Applications by Scheme Type"
                        />
                    ) : <p className="empty-state" role="status">No scheme application data is available yet.</p>}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
