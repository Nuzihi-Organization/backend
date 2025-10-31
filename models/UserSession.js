import mongoose from'mongoose';

const userSessionSchema = new mongoose.Schema({
  pseudonym: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional
  sessionId: String,
  activeRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.model('UserSession', userSessionSchema);