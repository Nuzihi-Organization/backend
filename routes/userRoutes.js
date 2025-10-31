import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import User from '../models/User.js';

const router = express.Router();

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// Update user profile
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, preferences },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// Update user preferences
router.patch('/preferences', protect, restrictTo('user'), async (req, res) => {
  try {
    const { therapyTypes, preferredModes, location } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        preferences: {
          therapyTypes,
          preferredModes,
          location
        }
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

export default router;