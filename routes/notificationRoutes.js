import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get user notifications
router.get('/', protect, async (req, res) => {
  try {
    // Import Notification model
    const Notification = (await import('../models/Notification.js')).default;
    
    const notifications = await Notification.find({ 
      user: req.user.id,
      read: false 
    })
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching notifications'
    });
  }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const Notification = (await import('../models/Notification.js')).default;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating notification'
    });
  }
});

export default router;