import mongoose from'mongoose';

const roomHistorySchema = new mongoose.Schema({
  pseudonym: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  lastVisited: { type: Date, default: Date.now },
  lastMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  unreadCount: { type: Number, default: 0 },
  isFavorite: { type: Boolean, default: false },
  notificationEnabled: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Compound index for user queries
roomHistorySchema.index({ pseudonym: 1, lastVisited: -1 });
roomHistorySchema.index({ pseudonym: 1, roomId: 1 }, { unique: true });

export default mongoose.model('RoomHistory', roomHistorySchema);