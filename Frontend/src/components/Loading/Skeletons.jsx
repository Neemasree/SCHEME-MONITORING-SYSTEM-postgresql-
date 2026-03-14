import './Skeletons.css';

export const SkeletonCard = () => (
    <div className="skeleton-card glass-card">
        <div className="skeleton-content">
            <div className="skeleton-title pulse"></div>
            <div className="skeleton-value pulse"></div>
        </div>
        <div className="skeleton-icon pulse"></div>
    </div>
);

export const SkeletonChart = () => (
    <div className="skeleton-chart glass-card">
        <div className="skeleton-title pulse" style={{ width: '40%', marginBottom: '24px' }}></div>
        <div className="skeleton-chart-body pulse"></div>
    </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
    <div className="skeleton-table-container glass-card">
        <div className="skeleton-table-header">
            <div className="skeleton-th pulse" style={{ width: '10%' }}></div>
            <div className="skeleton-th pulse" style={{ width: '25%' }}></div>
            <div className="skeleton-th pulse" style={{ width: '20%' }}></div>
            <div className="skeleton-th pulse" style={{ width: '15%' }}></div>
            <div className="skeleton-th pulse" style={{ width: '20%' }}></div>
        </div>
        <div className="skeleton-table-body">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="skeleton-tr">
                    <div className="skeleton-td pulse" style={{ width: '8%' }}></div>
                    <div className="skeleton-td pulse" style={{ width: '30%' }}></div>
                    <div className="skeleton-td pulse" style={{ width: '25%' }}></div>
                    <div className="skeleton-td pulse" style={{ width: '15%' }}></div>
                    <div className="skeleton-td pulse" style={{ width: '10%' }}></div>
                </div>
            ))}
        </div>
    </div>
);
