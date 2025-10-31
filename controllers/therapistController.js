
import Therapist from '../models/Therapist.js';

// Get all therapists
export const getAllTherapists = async (req, res) => {
  try {
    const therapists = await Therapist.find({
      isApproved: true,
      isActive: true
    }).select('-password -reviews');
    
    res.json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (error) {
    console.error('Get therapists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching therapists'
    });
  }
};

// Filter therapists
export const filterTherapists = async (req, res) => {
  try {
    const { location, modes, types, minRating, maxRate } = req.body;
    
    const query = {
      isApproved: true,
      isActive: true
    };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (modes && modes.length > 0) {
      query.modes = { $in: modes };
    }
    
    if (types && types.length > 0) {
      query.specialties = { $in: types };
    }
    
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }
    
    if (maxRate) {
      query.sessionRate = { $lte: parseFloat(maxRate) };
    }
    
    const therapists = await Therapist.find(query).select('-password -reviews');
    
    res.json({
      success: true,
      count: therapists.length,
      data: therapists
    });
  } catch (error) {
    console.error('Filter therapists error:', error);
    res.status(500).json({
      success: false,
      message: 'Error filtering therapists'
    });
  }
};

// Get therapist by ID
export const getTherapistById = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id)
      .select('-password')
      .populate('reviews.user', 'name imageUrl');
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }
    
    res.json({
      success: true,
      data: therapist
    });
  } catch (error) {
    console.error('Get therapist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching therapist details'
    });
  }
};

// Get therapist availability
export const getTherapistAvailability = async (req, res) => {
  try {
    const therapist = await Therapist.findById(req.params.id).select('availability name');
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        therapistId: therapist._id,
        name: therapist.name,
        availability: therapist.availability
      }
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching availability'
    });
  }
};

// Add review to therapist
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const therapistId = req.params.id;
    const userId = req.user.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const therapist = await Therapist.findById(therapistId);
    
    if (!therapist) {
      return res.status(404).json({
        success: false,
        message: 'Therapist not found'
      });
    }
    
    // Check if user already reviewed
    const existingReview = therapist.reviews.find(
      review => review.user.toString() === userId
    );
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this therapist'
      });
    }
    
    therapist.reviews.push({
      user: userId,
      rating,
      comment
    });
    
    therapist.updateRating();
    await therapist.save();
    
    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      data: therapist
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding review'
    });
  }
};