import { useState, useRef, useEffect } from 'react';
import { Bell, Search, User, CheckCircle, FileText, X, AlertTriangle, Info } from 'lucide-react';
import api from '../../utils/api';
import './Navbar.css';

const Navbar = ({ role, username = 'Official User', onSearchItem }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [notifications, setNotifications] = useState([]);
    const notifRef = useRef(null);

    // Fetch Notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const { data } = await api.get('/notifications');
                setNotifications(data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        fetchNotifications();
        // Polling for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

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

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

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

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="success-text" />;
            case 'error': return <X size={16} className="danger-text" />;
            case 'warning': return <AlertTriangle size={16} className="warning-text" />;
            default: return <Info size={16} className="primary-icon" />;
        }
    };

    // Map roles to readable labels and colors
    const roleDisplay = {
        admin: { label: 'System Admin', color: 'admin-badge' },
        district: { label: 'District Officer', color: 'district-badge' },
        field: { label: 'Field Officer', color: 'field-badge' }
    };

    const currentRole = roleDisplay[role] || roleDisplay.field;
    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                                {notifications.length > 0 ? notifications.map(notif => (
                                    <div
                                        key={notif._id}
                                        className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
                                        onClick={() => handleMarkRead(notif._id)}
                                    >
                                        <div className="notif-icon-circle">{getIcon(notif.type)}</div>
                                        <div className="notif-content">
                                            <p className="notif-title">{notif.title}</p>
                                            <p className="notif-desc">{notif.message}</p>
                                            <span className="notif-time">{new Date(notif.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        {!notif.isRead && <div className="unread-dot"></div>}
                                    </div>
                                )) : (
                                    <div className="notif-empty">No new notifications</div>
                                )}
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
