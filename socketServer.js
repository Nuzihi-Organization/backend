import express from'express';
import http from'http';
import { Server } from 'socket.io';
import cors from'cors';
import mongoose from'mongoose';
import peerSpacesRoutes from'./routes/peerSpaces.js';
import dotenv from'dotenv';

const app = express();
const server = http.createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://zhq5zx35-5173.uks1.devtunnels.ms/"], // Your React app URLs
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "https://zhq5zx35-5173.uks1.devtunnels.ms/"],
  credentials: true
}));
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.send('Socket.IO Server is running');
});

// MongoDB connection (if needed)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://jassymande:xHTJCw7y5KRKCJuZ@nuzihi.qd9fjiv.mongodb.net/?retryWrites=true&w=majority&appName=Nuzihi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id);

  // Test event
  socket.emit('welcome', { message: 'Welcome to Peer Spaces!' });

  // Join room
  socket.on('join-room', async ({ roomId, pseudonym }) => {
    try {
      socket.join(roomId);
      console.log(`${pseudonym} joined room ${roomId}`);
      
      // Notify room
      io.to(roomId).emit('user-joined', { 
        pseudonym, 
        activeCount: 1 // You'll calculate this from your DB
      });

      // Send test messages
      socket.emit('load-messages', [
        {
          _id: '1',
          pseudonym: 'SystemBot',
          text: 'Welcome to the room! Feel free to share your thoughts.',
          createdAt: new Date(),
          reactions: {}
        }
      ]);

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  });

  // Send message
  socket.on('send-message', async ({ roomId, pseudonym, text }) => {
    try {
      const message = {
        _id: Date.now().toString(),
        roomId,
        pseudonym,
        text,
        createdAt: new Date(),
        reactions: {}
      };

      io.to(roomId).emit('new-message', message);
      console.log('Message sent:', message);

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ roomId, pseudonym, isTyping }) => {
    socket.to(roomId).emit('user-typing', { pseudonym, isTyping });
  });

  // Add reaction
  socket.on('add-reaction', ({ messageId, reactionType }) => {
    console.log('Reaction added:', messageId, reactionType);
    // You'll update your DB here
  });

  // Leave room
  socket.on('leave-room', ({ roomId, pseudonym }) => {
    socket.leave(roomId);
    io.to(roomId).emit('user-left', { 
      pseudonym, 
      activeCount: 0 
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('❌ User disconnected:', socket.id);
  });
});

//  API routes
// app.use('/api/auth', authRoutes);
app.use('/api/peer-spaces', peerSpacesRoutes);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 Socket.IO server ready`);
});