import Notification from '../models/Notification.js';

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(notifications);
    } catch (error) {
        console.error('❌ Error in getNotifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (notification) {
        if (notification.userId.toString() !== req.user._id.toString()) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }
        notification.isRead = true;
        await notification.save();
        res.json({ message: 'Notification marked as read' });
    } else {
        res.status(404).json({ message: 'Notification not found' });
    }
};

// @desc    Create notification (Internal utility)
const createNotification = async (userId, title, message, type = 'info') => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

export { getNotifications, markAsRead, createNotification };
