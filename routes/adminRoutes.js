
import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import Therapist from '../models/Therapist.js';
import Booking from '../models/Booking.js';

const router = express.Router();

// Protect all admin routes
router.use(protect);
router.use(restrictTo('admin'));

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalTherapists = await Therapist.countDocuments();
    const pendingApprovals = await Therapist.countDocuments({ isApproved: false });
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['pending', 'confirmed'] } 
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTherapists,
        pendingApprovals,
        totalBookings,
        activeBookings,
        revenue: 0 // Calculate based on completed bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
});

// Get all therapists with filter
router.get('/therapists', async (req, res) => {
  try {
    const { filter } = req.query;
    let query = {};
    
    if (filter === 'pending') query.isApproved = false;
    if (filter === 'approved') query.isApproved = true;
    if (filter === 'rejected') query.isRejected = true;
    
    const therapists = await Therapist.find(query).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: therapists
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching therapists' });
  }
});

// Approve therapist
router.patch('/therapists/:id/approve', async (req, res) => {
  try {
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { isApproved: true, isActive: true },
      { new: true }
    );
    
    if (!therapist) {
      return res.status(404).json({ success: false, message: 'Therapist not found' });
    }
    
    res.json({
      success: true,
      message: 'Therapist approved successfully',
      data: therapist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error approving therapist' });
  }
});

// Reject therapist
router.patch('/therapists/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { 
        isApproved: false, 
        isRejected: true, 
        rejectionReason: reason 
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Therapist rejected',
      data: therapist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error rejecting therapist' });
  }
});

// Deactivate therapist
router.patch('/therapists/:id/deactivate', async (req, res) => {
  try {
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Therapist deactivated',
      data: therapist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deactivating therapist' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// Deactivate user
router.patch('/users/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'User deactivated',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deactivating user' });
  }
});

// Activate user
router.patch('/users/:id/activate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'User activated',
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error activating user' });
  }
});

// Get all bookings
router.get('/bookings', async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('therapist', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    // analytics logic here
    res.json({
      success: true,
      data: {
        userGrowth: [],
        bookingTrends: [],
        topTherapists: [],
        revenueData: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching analytics' });
  }
});

// Save settings
router.post('/settings', async (req, res) => {
  try {
    // Save settings to database or config file
    res.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving settings' });
  }
});

export default router;


