import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  slots: [{
    startTime: String,
    endTime: String,
    isBooked: {
      type: Boolean,
      default: false
    }
  }]
});

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const therapistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'therapist'
  },
  specialties: [{
    type: String,
    enum: ['Anxiety', 'Depression', 'Trauma', 'Relationships', 'Stress', 'Addiction', 'Grief', 'Career', 'Family']
  }],
  bio: {
    type: String,
    maxlength: 1000
  },
  qualifications: [String],
  experience: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  modes: [{
    type: String,
    enum: ['In-Person', 'Video', 'Phone', 'Chat']
  }],
  availability: [availabilitySchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  sessionRate: {
    type: Number,
    required: true
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date
}, {
  timestamps: true
});

therapistSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

therapistSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

therapistSchema.methods.updateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
    return;
  }
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = sum / this.reviews.length;
  this.reviewCount = this.reviews.length;
};

export default mongoose.model('Therapist', therapistSchema);
