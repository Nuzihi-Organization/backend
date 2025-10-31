// controllers/bookingController.js (ES Modules)
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Therapist from '../models/Therapist.js';
import User from '../models/User.js';

// Create booking with atomic slot reservation
export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      therapistId,
      date,
      day,
      startTime,
      endTime,
      mode,
      therapyType,
      notes
    } = req.body;
    
    const userId = req.user.id;
    
    // Validate required fields
    if (!therapistId || !date || !day || !startTime || !endTime || !mode || !therapyType) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'All booking fields are required'
      });
    }
    
    // Find therapist
    const therapist = await Therapist.findById(therapistId).session(session);
    
    if (!therapist || !therapist.isApproved || !therapist.isActive) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Therapist not available'
      });
    }
    
    // Find the availability slot
    const dayAvailability = therapist.availability.find(a => a.day === day);
    
    if (!dayAvailability) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Therapist not available on this day'
      });
    }
    
    const slot = dayAvailability.slots.find(
      s => s.startTime === startTime && s.endTime === endTime && !s.isBooked
    );
    
    if (!slot) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Time slot not available or already booked'
      });
    }
    
    // Mark slot as booked atomically
    slot.isBooked = true;
    await therapist.save({ session });
    
    // Create booking
    const booking = await Booking.create([{
      user: userId,
      therapist: therapistId,
      date: new Date(date),
      day,
      startTime,
      endTime,
      mode,
      therapyType,
      notes,
      amount: therapist.sessionRate,
      status: 'pending'
    }], { session });
    
    // Update user bookings
    await User.findByIdAndUpdate(
      userId,
      { $push: { bookings: booking[0]._id } },
      { session }
    );
    
    await session.commitTransaction();
    
    const populatedBooking = await Booking.findById(booking[0]._id)
      .populate('therapist', 'name email imageUrl location sessionRate')
      .populate('user', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: populatedBooking
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Create booking error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating booking'
    });
  } finally {
    session.endSession();
  }
};

// Get user bookings
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    const query = { user: userId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('therapist', 'name email imageUrl location sessionRate specialties')
      .sort({ date: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

// Get therapist bookings
export const getTherapistBookings = async (req, res) => {
  try {
    const therapistId = req.user.id;
    const { status } = req.query;
    
    const query = { therapist: therapistId };
    if (status) {
      query.status = status;
    }
    
    const bookings = await Booking.find(query)
      .populate('user', 'name email imageUrl')
      .sort({ date: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('Get therapist bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bookings'
    });
  }
};

// Get booking by ID
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('therapist', 'name email imageUrl location sessionRate')
      .populate('user', 'name email imageUrl');
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check authorization
    if (
      booking.user._id.toString() !== req.user.id &&
      booking.therapist._id.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching booking'
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { cancellationReason } = req.body;
    const bookingId = req.params.id;
    
    const booking = await Booking.findById(bookingId).session(session);
    
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check authorization
    const isUser = booking.user.toString() === req.user.id;
    const isTherapist = booking.therapist.toString() === req.user.id;
    
    if (!isUser && !isTherapist && req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this booking'
      });
    }
    
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel ${booking.status} booking`
      });
    }
    
    // Free up the slot
    const therapist = await Therapist.findById(booking.therapist).session(session);
    const dayAvailability = therapist.availability.find(a => a.day === booking.day);
    
    if (dayAvailability) {
      const slot = dayAvailability.slots.find(
        s => s.startTime === booking.startTime && s.endTime === booking.endTime
      );
      if (slot) {
        slot.isBooked = false;
      }
      await therapist.save({ session });
    }
    
    // Update booking
    booking.status = 'cancelled';
    booking.cancellationReason = cancellationReason;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user.role;
    await booking.save({ session });
    
    await session.commitTransaction();
    
    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling booking'
    });
  } finally {
    session.endSession();
  }
};

// Update booking status (therapist/admin only)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, meetingLink } = req.body;
    const bookingId = req.params.id;
    
    if (!['pending', 'confirmed', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Check authorization
    if (
      booking.therapist.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }
    
    booking.status = status;
    if (meetingLink) {
      booking.meetingLink = meetingLink;
    }
    
    await booking.save();
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating booking'
    });
  }
};