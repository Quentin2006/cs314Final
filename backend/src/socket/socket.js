import { Server } from 'socket.io';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Store user socket mappings (userId -> socketId)
const userSockets = new Map();

/**
 * Get user info by ID
 * @param {string} userId - The user ID
 * @returns {Object|null} - User object with id, firstName, lastName, email, image, color
 */
const getUserInfo = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return null;
    
    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      color: user.color
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

/**
 * Setup Socket.io server with event handlers
 * @param {http.Server} httpServer - The HTTP server instance
 * @returns {Server} - The Socket.io server instance
 */
export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV !== 'production' ? "http://localhost:5173" : undefined,
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    /**
     * Event: sendMessage
     * Emitted By: The client
     * Listened By: The server
     * Payload: { sender, recipient, content, messageType? }
     * Action: Save message to DB, emit receiveMessage to both sender and recipient
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { sender, recipient, content, messageType = 'text' } = data;

        // Validate required fields
        if (!sender || !recipient || !content) {
          socket.emit('error', { message: 'Missing required fields: sender, recipient, or content' });
          return;
        }

        // Save message to database
        const message = await Message.create({
          sender,
          recipient,
          content,
          messageType
        });

        // Fetch sender and recipient info
        const [senderInfo, recipientInfo] = await Promise.all([
          getUserInfo(sender),
          getUserInfo(recipient)
        ]);

        if (!senderInfo || !recipientInfo) {
          socket.emit('error', { message: 'Failed to fetch user information' });
          return;
        }

        // Prepare the message payload for receiveMessage event
        const messagePayload = {
          id: message._id.toString(),
          sender: senderInfo,
          recipient: recipientInfo,
          content: message.content,
          messageType: message.messageType,
          timestamp: message.createdAt
        };

        // Emit receiveMessage event to recipient (if online)
        const recipientSocketId = userSockets.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receiveMessage', messagePayload);
        }

        // Emit receiveMessage event to sender
        socket.emit('receiveMessage', messagePayload);

        console.log(`Message sent from ${sender} to ${recipient}: ${content.substring(0, 50)}...`);

      } catch (error) {
        console.error('Error handling sendMessage:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    /**
     * Event: userConnected
     * Emitted By: The client when user logs in/connects
     * Payload: { userId }
     * Action: Map userId to socket.id for targeted messaging
     */
    socket.on('userConnected', (data) => {
      const { userId } = data;
      if (userId) {
        userSockets.set(userId, socket.id);
        socket.userId = userId;
        console.log(`User ${userId} mapped to socket ${socket.id}`);
      }
    });

    /**
     * Handle disconnection
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from socket mapping
      if (socket.userId) {
        userSockets.delete(socket.userId);
        console.log(`User ${socket.userId} removed from socket mapping`);
      }
    });
  });

  return io;
};

export default setupSocket;
