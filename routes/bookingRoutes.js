import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Get user's bookings
router.get('/user', protect, async (req, res) => {
  try {
    const bookings = await bookings.find({ user: req.user.id })
      .populate('therapist', 'name specialization imageUrl')
      .sort({ sessionDate: -1 });
    
    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
});


// Get single booking
router.get('/:id', protect, async (req, res) => {
  try {
    const Booking = (await import('../models/Booking.js')).default;
    
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.id
    }).populate('therapist', 'name specialization imageUrl email phone');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching booking'
    });
  }
});

router.post('/', restrictTo('user'), bookingController.createBooking);
router.get('/user', restrictTo('user'), bookingController.getUserBookings);
router.get('/therapist', restrictTo('therapist'), bookingController.getTherapistBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/status', restrictTo('therapist', 'admin'), bookingController.updateBookingStatus);

export default router;