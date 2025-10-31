
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from'http';
import { Server } from 'socket.io';
import setupChatSocket from './socket/chatSocket.js';
import authRoutes from './routes/authRoutes.js';
import therapistRoutes from './routes/therapistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import peerSpacesRoutes from'./routes/peerSpaces.js';
import RoomHistory from './models/RoomHistory.js';



dotenv.config();

const app = express();

const server = http.createServer(app);


const allowedOrigins = [
  "*",
  "http://localhost:5173",
  "https://zhq5zx35-5173.uks1.devtunnels.ms",
  "https://nuzihi-web.netlify.app/",
  "https://www.nuzihi.org"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Your React app URLs
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());



// Socket setup
setupChatSocket(io);

// MongoDB connection (if needed)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://jassymande:xHTJCw7y5KRKCJuZ@nuzihi.qd9fjiv.mongodb.net/?retryWrites=true&w=majority&appName=Nuzihi', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ MongoDB connected');
}).catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'AfyaNafsi API Server Running', version: '1.0.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/peer-spaces', peerSpacesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('Socket.IO Server is running');
});