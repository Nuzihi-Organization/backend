import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  therapist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  mode: {
    type: String,
    required: true,
    enum: ['In-Person', 'Video', 'Phone', 'Chat']
  },
  therapyType: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  meetingLink: {
    type: String,
    default: ''
  },
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: {
    type: String,
    enum: ['user', 'therapist', 'admin']
  }
}, {
  timestamps: true
});

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ therapist: 1, date: 1 });
bookingSchema.index({ status: 1 });
bookingSchema.index(
  { therapist: 1, date: 1, startTime: 1 },
  { unique: true }
);

export default mongoose.model('Booking', bookingSchema);
