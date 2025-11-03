import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

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
    const { name, phone, dateOfBirth, bio, imageUrl, preferences } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
    if (bio !== undefined) updateData.bio = bio;
    if (imageUrl) updateData.imageUrl = imageUrl;
    if (preferences) updateData.preferences = preferences;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
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

// Update notification preferences
router.patch('/notifications', protect, async (req, res) => {
  try {
    const { email, sms, appointments, newsletters } = req.body;
    
    const updateData = {};
    if (email !== undefined) updateData['notificationPreferences.email'] = email;
    if (sms !== undefined) updateData['notificationPreferences.sms'] = sms;
    if (appointments !== undefined) updateData['notificationPreferences.appointments'] = appointments;
    if (newsletters !== undefined) updateData['notificationPreferences.newsletters'] = newsletters;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating notification preferences'
    });
  }
});

// Change password
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    // Check if user has a password (not Google OAuth user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google authenticated accounts'
      });
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    user.password = newPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password'
    });
  }
});

// Delete account
router.delete('/account', protect, async (req, res) => {
  try {
    const { password } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // If user has password (not Google OAuth), verify it
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide your password to delete account'
        });
      }
      
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Password is incorrect'
        });
      }
    }
    
    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

export default router;