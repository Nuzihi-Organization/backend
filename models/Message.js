import mongoose from'mongoose';

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  pseudonym: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, required: true },
  reactions: {
    heart: { type: Number, default: 0 },
    hug: { type: Number, default: 0 },
    wave: { type: Number, default: 0 },
    star: { type: Number, default: 0 }
  },
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for faster queries
messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ roomId: 1, isDeleted: 1 });

export default mongoose.model('Message', messageSchema);