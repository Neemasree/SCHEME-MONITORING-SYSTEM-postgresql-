import { useState, useEffect } from 'react';
import DashboardCards from '../../components/DashboardCards/DashboardCards';
import { BarGraph, PieGraph, LineGraph } from '../../components/Charts/SchemeCharts';
import { SkeletonChart } from '../../components/Loading/Skeletons';
import { districtPerformance, applications, schemes } from '../../data/dummyData';
import './Dashboard.css';

const Dashboard = ({ role, username }) => {
    const [isLoading, setIsLoading] = useState(true);

    // Simulate network load
    useEffect(() => {
        setIsLoading(true);
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    // 1. Map Approval Rate / Status Distribution
    const statusCounts = applications.reduce((acc, app) => {
        const status = app.status.includes('Approved') ? 'Approved' :
            app.status.includes('Rejected') ? 'Rejected' : 'Pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});
    const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));

    // 2. Map Scheme Distribution
    const schemeCounts = applications.reduce((acc, app) => {
        const sName = app.scheme.replace(' Scheme', '').replace(' Fund', ''); // Shorten names for chart
        acc[sName] = (acc[sName] || 0) + 1;
        return acc;
    }, {});
    const schemeDistData = Object.keys(schemeCounts).map(key => ({ name: key, value: schemeCounts[key] }));

    // 3. Map District Performance 
    const districtData = districtPerformance.map(d => ({
        district: d.district,
        total: d.totalApplications,
        approved: d.approved
    }));

    // 4. Trend Data (Static for demo)
    const trendData = [
        { month: 'Jan', applications: 120 },
        { month: 'Feb', applications: 250 },
        { month: 'Mar', applications: 180 },
        { month: 'Apr', applications: 320 },
        { month: 'May', applications: 450 },
        { month: 'Jun', applications: 390 },
    ];

    // Role specific greetings
    const greeting = {
        admin: `Welcome back Administrator ${username}. Here's the state overview.`,
        district: `Welcome ${username}. Here are the metrics for your district.`,
        field: `Hello Officer ${username}. You have pending verifications today.`
    };

    return (
        <div className="dashboard-page">
            <div className="page-header animate-fade-in">
                <h1 className="page-title">Dashboard Overview</h1>
                <p className="page-subtitle">{greeting[role] || greeting.field}</p>
            </div>

            <DashboardCards role={role} isLoading={isLoading} />

            <div className="charts-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {/* Row 1: District Performance */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : (
                        <BarGraph
                            data={districtData}
                            title="District Performance (Total vs Approved)"
                            dataKey="total"
                            xAxisKey="district"
                        />
                    )}
                </div>

                {/* Row 2: Monthly Trends */}
                <div className="chart-span-2">
                    {isLoading ? <SkeletonChart /> : (
                        <LineGraph
                            data={trendData}
                            title="Application Inflow Trend (6 Months)"
                            dataKey="applications"
                            xAxisKey="month"
                        />
                    )}
                </div>

                {/* Row 3: Splits */}
                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : (
                        <PieGraph
                            data={statusData}
                            title="Approval Rate Distribution"
                        />
                    )}
                </div>

                <div className="chart-item">
                    {isLoading ? <SkeletonChart /> : (
                        <PieGraph
                            data={schemeDistData}
                            title="Applications by Scheme"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
