import { SkeletonCard } from '../Loading/Skeletons';
import { Users, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import './DashboardCards.css';

const StatCard = ({ title, value, icon, colorClass, delay = 0 }) => (
    <div
        className={`stat-card glass-card animate-fade-in ${colorClass}`}
        style={{ animationDelay: `${delay}s` }}
    >
        <div className="stat-content">
            <h3 className="stat-title">{title}</h3>
            <p className="stat-value">{value}</p>
        </div>
        <div className="stat-icon-wrapper">
            {icon}
        </div>
    </div>
);

const DashboardCards = ({ role, isLoading, stats }) => {
    const iconSize = 24;

    if (isLoading || !stats) {
        return (
            <div className="dashboard-cards-grid" aria-label="Loading dashboard statistics" aria-busy="true">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    // Keep the card values aligned with the fields returned by GET /dashboard/stats.
    const {
        totalSchemes = 0,
        totalApplications = 0,
        pendingApplications = 0,
        approvedApplications = 0,
        rejectedApplications = 0,
    } = stats;

    const adminCards = [
        { title: "Total Schemes", value: totalSchemes, icon: <FileText size={iconSize} aria-hidden="true" />, colorClass: "blue-card", delay: 0 },
        { title: "Total Applications", value: totalApplications, icon: <Users size={iconSize} aria-hidden="true" />, colorClass: "green-card", delay: 0.1 },
        { title: "Pending Approvals", value: pendingApplications, icon: <Clock size={iconSize} aria-hidden="true" />, colorClass: "amber-card", delay: 0.2 },
        { title: "Approved Applications", value: approvedApplications, icon: <CheckCircle size={iconSize} aria-hidden="true" />, colorClass: "purple-card", delay: 0.3 }
    ];

    const districtCards = [
        { title: "Active Schemes", value: totalSchemes, icon: <FileText size={iconSize} aria-hidden="true" />, colorClass: "blue-card", delay: 0 },
        { title: "Applications", value: totalApplications, icon: <Users size={iconSize} aria-hidden="true" />, colorClass: "green-card", delay: 0.1 },
        { title: "To Review", value: pendingApplications, icon: <Clock size={iconSize} aria-hidden="true" />, colorClass: "amber-card", delay: 0.2 },
        { title: "Approved Cases", value: approvedApplications, icon: <CheckCircle size={iconSize} aria-hidden="true" />, colorClass: "purple-card", delay: 0.3 }
    ];

    const fieldCards = [
        { title: "Applications", value: totalApplications, icon: <FileText size={iconSize} aria-hidden="true" />, colorClass: "blue-card", delay: 0 },
        { title: "Total Approved", value: approvedApplications, icon: <CheckCircle size={iconSize} aria-hidden="true" />, colorClass: "green-card", delay: 0.1 },
        { title: "To Verify", value: pendingApplications, icon: <Clock size={iconSize} aria-hidden="true" />, colorClass: "amber-card", delay: 0.2 },
        { title: "Rejections", value: rejectedApplications, icon: <XCircle size={iconSize} aria-hidden="true" />, colorClass: "red-card", delay: 0.3 }
    ];

    let cardsToDisplay = adminCards;
    if (role === 'district') cardsToDisplay = districtCards;
    if (role === 'field') cardsToDisplay = fieldCards;

    return (
        <div className="dashboard-cards-grid">
            {cardsToDisplay.map((card) => (
                <StatCard key={card.title} {...card} />
            ))}
        </div>
    );
};

export default DashboardCards;
