import { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import StatusBadge from '../Badge/StatusBadge';
import './StatusTable.css';

const StatusTable = ({ columns, data, onActionClick, itemsPerPage = 5 }) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    if (!data || data.length === 0) {
        return (
            <div className="glass-card table-empty-state">
                <p>No data available to display.</p>
            </div>
        );
    }

    return (
        <div className="table-container glass-card">
            <div className="table-responsive">
                <table className="custom-table">
                    <thead>
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className={col.align || 'left'}>
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((row, rowIndex) => (
                            <tr key={rowIndex} className="table-row animate-fade-in" style={{ animationDelay: `${rowIndex * 0.05}s` }}>
                                {columns.map((col, colIndex) => {

                                    // Handle custom renders
                                    if (col.key === 'status') {
                                        return (
                                            <td key={colIndex} data-label={col.header}>
                                                <StatusBadge status={row[col.key]} />
                                            </td>
                                        );
                                    }

                                    if (col.key === 'action') {
                                        return (
                                            <td key={colIndex} className="center" data-label={col.header}>
                                                <button
                                                    className="action-btn"
                                                    onClick={() => onActionClick(row)}
                                                    title="View / Actions"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={colIndex} className={col.align || 'left'} data-label={col.header}>
                                            {row[col.key]}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="table-pagination">
                    <span className="pagination-info">
                        Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.length)} of {data.length} entries
                    </span>
                    <div className="pagination-controls">
                        <button
                            className="pagination-btn"
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="page-indicator">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            className="pagination-btn"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusTable;
