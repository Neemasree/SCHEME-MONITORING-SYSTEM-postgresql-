import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Bell, CheckCircle, X, AlertTriangle, Info, Clock, Check } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAllNotifications = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Request with a higher limit for the main page
            const { data } = await api.get('/notifications?limit=100');
            setNotifications(data);
        } catch (requestError) {
            console.error("Error fetching all notifications:", requestError);
            setError(requestError.response?.data?.message || 'Unable to load notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllNotifications();
    }, []);

    const handleMarkRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications((current) => current.map((n) => n._id === id ? { ...n, isRead: true } : n));
        } catch (requestError) {
            console.error("Error marking notification as read:", requestError);
            setError(requestError.response?.data?.message || 'Unable to mark this notification as read.');
        }
    };

    const handleMarkAllRead = async () => {
        // Simple sequential mark as read if no bulk API exists
        const unread = notifications.filter(n => !n.isRead);
        for (const n of unread) {
            await handleMarkRead(n._id);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} className="success-text" />;
            case 'error': return <X size={20} className="danger-text" />;
            case 'warning': return <AlertTriangle size={20} className="warning-text" />;
            default: return <Info size={20} className="primary-icon" />;
        }
    };

    return (
        <div className="notifications-page">
            <div className="page-header animate-fade-in flex-between">
                <div>
                    <h1 className="page-title">Notification Hub</h1>
                    <p className="page-subtitle">Stay updated with the latest system activities</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                    <button className="btn-secondary" onClick={handleMarkAllRead}>
                        <Check size={16} /> Mark all as read
                    </button>
                )}
            </div>

            {error && (
                <div className="error-banner" role="alert">
                    <span>{error}</span>
                    <button type="button" onClick={fetchAllNotifications}>Try again</button>
                </div>
            )}

            <div className="notifications-container slideUp">
                {isLoading ? (
                    <div className="notif-loading">
                        <Bell className="animate-pulse" size={48} />
                        <p>Syncing notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="notif-grid">
                        {notifications.map((notif) => (
                            <div 
                                key={notif._id} 
                                className={`notif-card glass-card ${!notif.isRead ? 'unread' : ''}`}
                                onClick={() => !notif.isRead && handleMarkRead(notif._id)}
                                role={!notif.isRead ? 'button' : undefined}
                                tabIndex={!notif.isRead ? 0 : undefined}
                                onKeyDown={(event) => {
                                    if (!notif.isRead && (event.key === 'Enter' || event.key === ' ')) {
                                        event.preventDefault();
                                        handleMarkRead(notif._id);
                                    }
                                }}
                                aria-label={!notif.isRead ? `Mark notification as read: ${notif.title}` : undefined}
                            >
                                <div className="notif-card-icon">
                                    {getIcon(notif.type)}
                                </div>
                                <div className="notif-card-content">
                                    <div className="notif-card-header">
                                        <h3>{notif.title}</h3>
                                        <span className="notif-date">
                                            <Clock size={14} /> {new Date(notif.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="notif-message">{notif.message}</p>
                                </div>
                                {!notif.isRead && <div className="unread-pulse"></div>}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="notif-empty-state glass-card">
                        <Bell size={64} opacity={0.2} />
                        <h3>Quiet for now</h3>
                        <p>No notifications have been issued for your account yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
