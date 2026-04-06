const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// Get all notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
    });
    
    // Map ID to _id for frontend compatibility (if requested by frontend)
    const mapped = notifications.map(n => ({
      ...n.toJSON(),
      _id: n.id, // Frontend uses _id in some places
    }));
    
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
