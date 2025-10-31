import express from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('user'), bookingController.createBooking);
router.get('/user', restrictTo('user'), bookingController.getUserBookings);
router.get('/therapist', restrictTo('therapist'), bookingController.getTherapistBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', bookingController.cancelBooking);
router.patch('/:id/status', restrictTo('therapist', 'admin'), bookingController.updateBookingStatus);

export default router;