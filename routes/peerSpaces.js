import express from'express';

const router = express.Router();

import Room from'../models/Room.js';
import Message from'../models/Message.js';
import UserSession from'../models/UserSession.js';
import RoomHistory from'../models/RoomHistory.js';

// Get all rooms
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true })
      .select('-__v')
      .lean();

    // Add active count
    const roomsWithCount = rooms.map(room => ({
      ...room,
      members: room.members?.length || 0,
      activeNow: room.activeUsers?.length || 0
    }));

    res.json({ rooms: roomsWithCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch rooms' });
  }
});

// Get room messages
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const messages = await Message.find({ 
      roomId: req.params.roomId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Create session
router.post('/sessions', async (req, res) => {
  try {
    const { pseudonym, userId } = req.body;

    const existing = await UserSession.findOne({ pseudonym });
    if (existing) {
      return res.status(400).json({ error: 'Pseudonym already taken' });
    }

    const session = await UserSession.create({
      pseudonym,
      userId,
      sessionId: req.sessionID
    });

    res.json({ session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Check pseudonym availability
router.get('/check-pseudonym/:pseudonym', async (req, res) => {
  try {
    const existing = await UserSession.findOne({ 
      pseudonym: req.params.pseudonym 
    });

    res.json({ isAvailable: !existing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check pseudonym' });
  }
});

// Get user's room history
router.get('/history/:pseudonym', async (req, res) => {
  try {
    const history = await RoomHistory.find({ 
      pseudonym: req.params.pseudonym 
    })
      .sort({ lastVisited: -1 })
      .populate('roomId')
      .populate('lastMessageId')
      .limit(20)
      .lean();

    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Clear history
router.delete('/history/:pseudonym/:roomId', async (req, res) => {
  try {
    await RoomHistory.findOneAndDelete({
      pseudonym: req.params.pseudonym,
      roomId: req.params.roomId
    });

    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;









