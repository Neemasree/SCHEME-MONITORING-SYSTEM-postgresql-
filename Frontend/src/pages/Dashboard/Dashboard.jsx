import { useState, useEffect } from 'react';
import DashboardCards from '../../components/DashboardCards/DashboardCards';
import { BarGraph, PieGraph, LineGraph } from '../../components/Charts/SchemeCharts';
import { SkeletonChart } from '../../components/Loading/Skeletons';
import api from '../../utils/api';
import './Dashboard.css';

const Dashboard = ({ role, username }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [analytics, setAnalytics] = useState({ statusData: [], schemeData: [] });

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [statsRes, analyticsRes] = await Promise.all([
                    api.get('/dashboard/stats'),
                    api.get('/dashboard/analytics')
                ]);

                setStats(statsRes.data);
                setAnalytics(analyticsRes.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

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

            <DashboardCards role={role} isLoading={isLoading} stats={stats} />

            <div className="charts-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {/* District Performance */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : (
                        <BarGraph
                            data={analytics.districtStats}
                            title="District Performance (Total Applications)"
                            dataKey="total"
                            xAxisKey="district"
                        />
                    )}
                </div>

                {/* Monthly Trends */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : (
                        <LineGraph
                            data={analytics.trendData}
                            title="Application Inflow Trend (6 Months)"
                            dataKey="applications"
                            xAxisKey="month"
                        />
                    )}
                </div>

                {/* Analytics Distribution */}
                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : (
                        <PieGraph
                            data={analytics.statusData}
                            title="Application Status Distribution"
                        />
                    )}
                </div>

                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : (
                        <PieGraph
                            data={analytics.schemeData}
                            title="Applications by Scheme Type"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
