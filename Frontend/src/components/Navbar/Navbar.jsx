import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, CheckCircle, FileText, X } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ role, username = 'Official User', onSearchItem }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const notifRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (onSearchItem) {
            onSearchItem(value);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        if (onSearchItem) {
            onSearchItem('');
        }
    };

    // Map roles to readable labels and colors
    const roleDisplay = {
        admin: { label: 'System Admin', color: 'admin-badge' },
        district: { label: 'District Officer', color: 'district-badge' },
        field: { label: 'Field Officer', color: 'field-badge' }
    };

    const currentRole = roleDisplay[role] || roleDisplay.field;

    // Dummy notifications based on role
    const getDummyNotifications = () => {
        if (role === 'admin') {
            return [
                { id: 1, title: 'New Scheme Draft', desc: 'Central housing draft needs review', time: '10m ago', icon: <FileText size={16} />, unread: true },
                { id: 2, title: 'Funds Depleted', desc: 'Coimbatore district needs fund allocation', time: '1h ago', icon: <Bell size={16} />, unread: true },
            ];
        }
        if (role === 'district') {
            return [
                { id: 1, title: 'Application Escalated', desc: 'Field officer flagged ID #105', time: '5m ago', icon: <Bell size={16} />, unread: true },
                { id: 2, title: 'Batch Approved', desc: 'Admin approved 45 applications', time: '2h ago', icon: <CheckCircle size={16} />, unread: false },
            ];
        }
        return [
            { id: 1, title: 'New Assignment', desc: 'Verify Ravi Kumar for Farmer Subsidy', time: 'Just now', icon: <User size={16} />, unread: true },
            { id: 2, title: 'Application Rejected', desc: 'Admin rejected ID #89 missing docs', time: '1d ago', icon: <X size={16} />, unread: false },
        ];
    };

    const notifications = getDummyNotifications();
    const unreadCount = notifications.filter(n => n.unread).length;

    return (
        <header className="navbar glass-card">
            <div className="navbar-left">
                <div className="search-bar glass-card">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search schemes, beneficiaries, IDs..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    {searchTerm && (
                        <button className="clear-search-btn" onClick={handleClearSearch}>
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="navbar-right">
                <div className="notification-wrapper" ref={notifRef}>
                    <button
                        className="icon-btn notification-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notifications-dropdown glass-card animate-fade-in">
                            <div className="notif-header">
                                <h4>Notifications</h4>
                                <button className="mark-read-btn">Mark all as read</button>
                            </div>
                            <div className="notif-list">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`notif-item ${notif.unread ? 'unread' : ''}`}>
                                        <div className="notif-icon-circle">{notif.icon}</div>
                                        <div className="notif-content">
                                            <p className="notif-title">{notif.title}</p>
                                            <p className="notif-desc">{notif.desc}</p>
                                            <span className="notif-time">{notif.time}</span>
                                        </div>
                                        {notif.unread && <div className="unread-dot"></div>}
                                    </div>
                                ))}
                            </div>
                            <div className="notif-footer">
                                <button className="view-all-btn">View All Notifications</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="user-profile">
                    <div className="user-info">
                        <span className="username">{username}</span>
                        <span className={`role-badge ${currentRole.color}`}>
                            {currentRole.label}
                        </span>
                    </div>
                    <div className="avatar">
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
