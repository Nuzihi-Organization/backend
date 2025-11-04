import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import setupChatSocket from './socket/chatSocket.js';
import authRoutes from './routes/authRoutes.js';
import therapistRoutes from './routes/therapistRoutes.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import adminAuthRoutes from './routes/adminAuthRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import peerSpacesRoutes from './routes/peerSpaces.js';
import RoomHistory from './models/RoomHistory.js';
import notificationRoutes from './routes/notificationRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// actual origins
const allowedOrigins = [
  "http://localhost:5173",
  "https://zhq5zx35-5173.uks1.devtunnels.ms",
  "https://nuzihi-web.netlify.app",
  "https://www.nuzihi.org"
];

//  CORS for Express 
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware 
app.use(express.json({ limit: '50mb' })); // For JSON payloads (base64 images)
app.use(express.urlencoded({ 
  extended: true, 
  limit: '50mb' // For form data
}));

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: false //  Set to false for Render compatibility
  },
  //  Start with polling for Render
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  
  // Longer timeouts for Render's environment
  pingTimeout: 60000,
  pingInterval: 25000,
  
  // compatible settings for Render
  allowEIO3: true, // Support older clients
  path: '/socket.io/',
  serveClient: false,
  
  // Handle connection state
  connectTimeout: 45000
});

// MongoDB connection 
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 
  'mongodb+srv://jassymande:xHTJCw7y5KRKCJuZ@nuzihi.qd9fjiv.mongodb.net/?retryWrites=true&w=majority&appName=Nuzihi';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// Socket setup
setupChatSocket(io);

// Socket.IO connection handler
io.on('connection', (socket) => {
  const transport = socket.conn.transport.name; // 'polling' or 'websocket'
  console.log('✅ User connected:', socket.id, 'via', transport);

  // Monitor transport upgrades
  socket.conn.on('upgrade', () => {
    const upgradedTransport = socket.conn.transport.name;
    console.log('🔄 Transport upgraded to:', upgradedTransport);
  });

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
        activeCount: 1
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

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'AfyaNafsi API Server Running', 
    version: '1.0.0',
    socketConnected: io.engine.clientsCount
  });
});

// Socket.IO health check
app.get('/socket-test', (req, res) => {
  res.json({
    socketIO: 'Socket.IO is attached',
    path: '/socket.io/',
    clients: io.engine?.clientsCount || 0,
    test: 'Try connecting to wss://backend-xptt.onrender.com/socket.io/'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/auth/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/peer-spaces', peerSpacesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
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

// server calls
server.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Socket.IO attached to server`);
  console.log(`✅ Socket.IO path: /socket.io/`);
  console.log(`✅ Allowed origins:`, allowedOrigins);
  console.log(`🔗 Test Socket.IO at: https://backend-xptt.onrender.com/socket.io/`);
  console.log('='.repeat(50));
});