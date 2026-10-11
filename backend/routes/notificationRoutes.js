const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { allowRoles } = require('../middleware/authMiddleware');

// Get notifications. User-specific visibility can be added when notifications
// gain a recipient/user foreign key; current seeded data is role-labelled.
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { role: req.user.role },
      order: [['createdAt', 'DESC']],
    });

    const mapped = notifications.map((notification) => ({
      ...notification.toJSON(),
      _id: notification.id,
    }));

    return res.json(mapped);
  } catch (error) {
    console.error('Fetch notifications failed:', error);
    return res.status(500).json({ message: 'Unable to fetch notifications' });
  }
});

// Mark a notification as read only if it belongs to the authenticated user's role.
router.put('/:id/read', async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ message: 'Invalid notification ID' });
  }

  try {
    const notification = await Notification.findOne({
      where: { id, role: req.user.role },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();
    return res.json(notification);
  } catch (error) {
    console.error('Mark notification read failed:', error);
    return res.status(500).json({ message: 'Unable to update notification' });
  }
});

// Notification creation is intentionally not exposed publicly.
// Add an authenticated admin-only route if manual notification creation is needed.

module.exports = router;
