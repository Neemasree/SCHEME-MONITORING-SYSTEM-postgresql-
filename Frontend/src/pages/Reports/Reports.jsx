import { useState, useEffect } from 'react';
import { Download, FileText, Calendar, Filter, PieChart } from 'lucide-react';
import { PieGraph } from '../../components/Charts/SchemeCharts';
import api from '../../utils/api';
import './Reports.css';

const Reports = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [analytics, setAnalytics] = useState({ schemeData: [], statusData: [], districtStats: [], trendData: [] });

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                const { data } = await api.get('/dashboard/analytics');
                setAnalytics(data);
            } catch (error) {
                console.error("Error fetching report analytics:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, []);

    const handleDownload = (title, format) => {
        alert(`Requesting ${title} in ${format} format from the server...`);
    };

    const reportTypes = [
        { title: "Monthly Application Summary", desc: "Detailed breakdown of all applications processed this month.", icon: <Calendar size={24} /> },
        { title: "Fund Disbursement Log", desc: "Financial ledger of all approved outgoing subventions.", icon: <FileText size={24} /> },
        { title: "District Performance Audit", desc: "Comparative analysis of district officer approval efficiency.", icon: <PieChart size={24} /> },
    ];

    const totalSubmissions = analytics.trendData.reduce((acc, curr) => acc + curr.applications, 0);

    return (
        <div className="reports-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Reports & Analytics</h1>
                    <p className="page-subtitle">Generate exportable documents and view high-level analytics</p>
                </div>

                <div className="date-filter glass-card">
                    <Filter size={16} />
                    <span>Last 6 Months</span>
                </div>
            </div>

            <div className="reports-content slideUp" style={{ animationDelay: '0.1s' }}>

                <div className="reports-grid">
                    {reportTypes.map((report, idx) => (
                        <div key={idx} className="report-card glass-card">
                            <div className="report-icon">
                                {report.icon}
                            </div>
                            <div className="report-info">
                                <h3>{report.title}</h3>
                                <p>{report.desc}</p>
                            </div>
                            <div className="report-actions">
                                <button className="btn-secondary" onClick={() => handleDownload(report.title, 'PDF')}>
                                    <Download size={16} className="mr-2" /> PDF
                                </button>
                                <button className="btn-secondary" onClick={() => handleDownload(report.title, 'CSV')}>
                                    <Download size={16} className="mr-2" /> CSV
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="analytics-section glass-card">
                    <div className="analytics-header">
                        <h3>Data Visualization Hub</h3>
                        <p>Live snapshots of system demographics</p>
                    </div>

                    <div className="chart-row">
                        <div className="chart-box">
                            <PieGraph data={analytics.schemeData} title="Application Scheme Targets" />
                        </div>
                        <div className="analytics-stats">
                            <div className="stat-row">
                                <span className="s-label">Total Submissions (Current Period)</span>
                                <span className="s-val">{totalSubmissions}</span>
                            </div>
                            <div className="stat-row">
                                <span className="s-label">Average Processing Time</span>
                                <span className="s-val text-primary">3.5 Days</span>
                            </div>
                            <div className="stat-row">
                                <span className="s-label">Active Schemes monitored</span>
                                <span className="s-val text-primary">{analytics.schemeData.length}</span>
                            </div>
                            <div className="stat-row">
                                <span className="s-label">System Health</span>
                                <span className="s-val text-success">99.9%</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Reports;
