import mongoose from'mongoose';

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  category: String,
  icon: String,
  color: String,
  borderColor: String,
  mood: String,
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  activeUsers: [{ socketId: String, pseudonym: String, joinedAt: Date }],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export default mongoose.model('Room', roomSchema);