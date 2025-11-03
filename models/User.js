import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
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
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  bio: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    default: 'user',
    enum: ['user', 'therapist', 'admin']
  },
  preferences: {
    therapyTypes: [String],
    preferredModes: [String],
    location: String
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    },
    appointments: {
      type: Boolean,
      default: true
    },
    newsletters: {
      type: Boolean,
      default: true
    }
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  bookings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  }],
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Check if profile is complete before saving
userSchema.pre('save', async function(next) {
  // Hash password if modified
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  // Check profile completion (all required fields except bio)
  this.profileCompleted = !!(
    this.name &&
    this.email &&
    this.phone &&
    this.dateOfBirth &&
    this.preferences?.location
  );

  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

export default mongoose.model('User', userSchema);