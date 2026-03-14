import { SkeletonCard } from '../Loading/Skeletons';
import { Users, FileText, CheckCircle, Clock } from 'lucide-react';
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

const DashboardCards = ({ role, isLoading }) => {
    const iconSize = 24;

    if (isLoading) {
        return (
            <div className="dashboard-cards-grid">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        );
    }

    const adminCards = [
        { title: "Total Schemes", value: "12", icon: <FileText size={iconSize} />, colorClass: "blue-card", delay: 0 },
        { title: "Total Beneficiaries", value: "1.2M", icon: <Users size={iconSize} />, colorClass: "green-card", delay: 0.1 },
        { title: "Pending Approvals", value: "450", icon: <Clock size={iconSize} />, colorClass: "amber-card", delay: 0.2 },
        { title: "Fund Disbursed", value: "₹4.5k Cr", icon: <CheckCircle size={iconSize} />, colorClass: "purple-card", delay: 0.3 }
    ];

    const districtCards = [
        { title: "Active Schemes", value: "8", icon: <FileText size={iconSize} />, colorClass: "blue-card", delay: 0 },
        { title: "District Beneficiaries", value: "45K", icon: <Users size={iconSize} />, colorClass: "green-card", delay: 0.1 },
        { title: "To Review", value: "125", icon: <Clock size={iconSize} />, colorClass: "amber-card", delay: 0.2 },
        { title: "Approved (Month)", value: "890", icon: <CheckCircle size={iconSize} />, colorClass: "purple-card", delay: 0.3 }
    ];

    const fieldCards = [
        { title: "Assigned Cases", value: "42", icon: <FileText size={iconSize} />, colorClass: "blue-card", delay: 0 },
        { title: "Verified Today", value: "15", icon: <CheckCircle size={iconSize} />, colorClass: "green-card", delay: 0.1 },
        { title: "Pending Verification", value: "27", icon: <Clock size={iconSize} />, colorClass: "amber-card", delay: 0.2 },
        { title: "Rejections", value: "3", icon: <Users size={iconSize} />, colorClass: "red-card", delay: 0.3 }
    ];

    let cardsToDisplay = adminCards;
    if (role === 'district') cardsToDisplay = districtCards;
    if (role === 'field') cardsToDisplay = fieldCards;

    return (
        <div className="dashboard-cards-grid">
            {cardsToDisplay.map((card, index) => (
                <StatCard key={index} {...card} />
            ))}
        </div>
    );
};

export default DashboardCards;
