import Room from'../models/Room.js';
import Message from '../models/Message.js';
import RoomHistory from'../models/RoomHistory.js';

const setupChatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room with history tracking
    socket.on('join-room', async ({ roomId, pseudonym, userId = null }) => {
      try {
        socket.join(roomId);
        
        // Update or create room history
        const history = await RoomHistory.findOneAndUpdate(
          { pseudonym, roomId },
          {
            lastVisited: new Date(),
            unreadCount: 0,
            userId
          },
          { upsert: true, new: true }
        );

        // Get last message ID from history
        const lastMessageId = history.lastMessageId;

        // Update room active users
        await Room.findByIdAndUpdate(roomId, {
          $addToSet: { 
            activeUsers: { 
              socketId: socket.id, 
              pseudonym, 
              joinedAt: new Date() 
            } 
          }
        });

        const room = await Room.findById(roomId);
        
        // Notify room
        io.to(roomId).emit('user-joined', { 
          pseudonym, 
          activeCount: room.activeUsers.length 
        });

        // Load messages (all messages or from last visit)
        let query = { 
          roomId, 
          isDeleted: false 
        };

        // If returning user, get messages after last visit
        if (lastMessageId) {
          const lastMessage = await Message.findById(lastMessageId);
          if (lastMessage) {
            query.createdAt = { $gte: lastMessage.createdAt };
          }
        }

        const messages = await Message.find(query)
          .sort({ createdAt: -1 })
          .limit(100)
          .lean();
        
        socket.emit('load-messages', {
          messages: messages.reverse(),
          isRejoining: !!lastMessageId,
          lastMessageId
        });

      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Send message with history update
    socket.on('send-message', async ({ roomId, pseudonym, text, userId = null }) => {
      try {
        const message = await Message.create({
          roomId,
          pseudonym,
          userId,
          text,
          createdAt: new Date()
        });

        // Update sender's history
        await RoomHistory.findOneAndUpdate(
          { pseudonym, roomId },
          {
            lastMessageId: message._id,
            lastVisited: new Date()
          }
        );

        // Increment unread count for other users in this room
        await RoomHistory.updateMany(
          { 
            roomId, 
            pseudonym: { $ne: pseudonym } 
          },
          { 
            $inc: { unreadCount: 1 } 
          }
        );

        io.to(roomId).emit('new-message', message);

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark-as-read', async ({ roomId, pseudonym }) => {
      try {
        await RoomHistory.findOneAndUpdate(
          { pseudonym, roomId },
          { 
            unreadCount: 0,
            lastVisited: new Date()
          }
        );
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });

    // Get room history for user
    socket.on('get-history', async ({ pseudonym }) => {
      try {
        const history = await RoomHistory.find({ pseudonym })
          .sort({ lastVisited: -1 })
          .populate('roomId')
          .limit(20)
          .lean();

        socket.emit('history-loaded', history);
      } catch (error) {
        console.error('Get history error:', error);
        socket.emit('error', { message: 'Failed to load history' });
      }
    });

    // Toggle favorite
    socket.on('toggle-favorite', async ({ pseudonym, roomId, isFavorite }) => {
      try {
        await RoomHistory.findOneAndUpdate(
          { pseudonym, roomId },
          { isFavorite },
          { upsert: true }
        );
        
        socket.emit('favorite-updated', { roomId, isFavorite });
      } catch (error) {
        console.error('Toggle favorite error:', error);
      }
    });

    // Add reaction
    socket.on('add-reaction', async ({ messageId, reactionType }) => {
      try {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { $inc: { [`reactions.${reactionType}`]: 1 } },
          { new: true }
        );

        io.to(message.roomId.toString()).emit('reaction-added', {
          messageId,
          reactions: message.reactions
        });

      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId, pseudonym, isTyping }) => {
      socket.to(roomId).emit('user-typing', { pseudonym, isTyping });
    });

    // Leave room
    socket.on('leave-room', async ({ roomId, pseudonym }) => {
      try {
        socket.leave(roomId);
        
        // Get last message in room
        const lastMessage = await Message.findOne({ roomId })
          .sort({ createdAt: -1 })
          .lean();

        // Update history on leave
        await RoomHistory.findOneAndUpdate(
          { pseudonym, roomId },
          {
            lastVisited: new Date(),
            lastMessageId: lastMessage?._id
          }
        );

        await Room.findByIdAndUpdate(roomId, {
          $pull: { activeUsers: { socketId: socket.id } }
        });

        const room = await Room.findById(roomId);
        
        io.to(roomId).emit('user-left', { 
          pseudonym, 
          activeCount: room.activeUsers.length 
        });

      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      try {
        const rooms = await Room.find({ 
          'activeUsers.socketId': socket.id 
        });

        for (const room of rooms) {
          const user = room.activeUsers.find(u => u.socketId === socket.id);
          
          await Room.findByIdAndUpdate(room._id, {
            $pull: { activeUsers: { socketId: socket.id } }
          });

          if (user) {
            // Update history on disconnect
            const lastMessage = await Message.findOne({ roomId: room._id })
              .sort({ createdAt: -1 })
              .lean();

            await RoomHistory.findOneAndUpdate(
              { pseudonym: user.pseudonym, roomId: room._id },
              {
                lastVisited: new Date(),
                lastMessageId: lastMessage?._id
              }
            );

            io.to(room._id.toString()).emit('user-left', { 
              pseudonym: user.pseudonym,
              activeCount: room.activeUsers.length - 1
            });
          }
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

export default setupChatSocket;