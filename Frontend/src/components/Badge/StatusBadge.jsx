import './StatusBadge.css';

const StatusBadge = ({ status }) => {
    // Map statuses to specific color themes based on the design system

    const getBadgeStyle = (statusName) => {
        const s = statusName.toLowerCase();

        if (s.includes('approved') || s === 'active') {
            return 'badge-success';
        }

        if (s.includes('rejected') || s === 'inactive') {
            return 'badge-danger';
        }

        if (s.includes('pending')) {
            return 'badge-warning';
        }

        return 'badge-default';
    };

    return (
        <span className={`status-badge ${getBadgeStyle(status)}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
