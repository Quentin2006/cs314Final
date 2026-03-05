import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { parse as cookieParse } from 'cookie';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Channel from '../models/Channel.js';

const userSockets = new Map();

const getUserInfo = async (userId) => {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return null;

    return {
      _id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      image: user.image,
      color: user.color,
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware: verify JWT from cookie on connection
  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;
      if (!rawCookies) {
        return next(new Error('No cookies found'));
      }

      const cookies = cookieParse(rawCookies);
      const token = cookies.jwt;
      if (!token) {
        return next(new Error('No JWT token found'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch (error) {
      console.error('Socket auth error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log('User connected:', userId, 'socket:', socket.id);

    // Map userId to socketId
    userSockets.set(userId, socket.id);

    // --- Direct Message ---
    socket.on('sendMessage', async (data) => {
      try {
        const { sender, recipient, content, messageType = 'text', fileUrl, audioUrl } = data;

        if (!sender || !recipient) {
          socket.emit('error', { message: 'Missing required fields: sender or recipient' });
          return;
        }

        // For text messages, content is required; for file messages, fileUrl is required
        if (messageType === 'text' && !content) {
          socket.emit('error', { message: 'Missing content for text message' });
          return;
        }

        const messageData = {
          sender,
          recipient,
          messageType,
        };
        if (content) messageData.content = content;
        if (fileUrl) messageData.fileUrl = fileUrl;
        if (audioUrl) messageData.audioUrl = audioUrl;

        const message = await Message.create(messageData);

        const [senderInfo, recipientInfo] = await Promise.all([
          getUserInfo(sender),
          getUserInfo(recipient),
        ]);

        if (!senderInfo || !recipientInfo) {
          socket.emit('error', { message: 'Failed to fetch user information' });
          return;
        }

        const messagePayload = {
          _id: message._id.toString(),
          sender: senderInfo,
          recipient: recipientInfo,
          content: message.content,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          audioUrl: message.audioUrl,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        };

        // Emit to recipient if online
        const recipientSocketId = userSockets.get(recipient);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('receiveMessage', messagePayload);
        }

        // Emit to sender
        socket.emit('receiveMessage', messagePayload);

        const preview = content ? content.substring(0, 50) : `[${messageType}]`;
        console.log(`Message sent from ${sender} to ${recipient}: ${preview}`);
      } catch (error) {
        console.error('Error handling sendMessage:', error);
        socket.emit('error', { message: 'Failed to send message', error: error.message });
      }
    });

    // --- Channel Message ---
    socket.on('send-channel-message', async (data) => {
      try {
        const { sender, content, messageType = 'text', fileUrl, audioUrl, channelId } = data;

        if (!sender || !channelId) {
          socket.emit('error', { message: 'Missing required fields: sender or channelId' });
          return;
        }

        const messageData = {
          sender,
          messageType,
          channelId,
        };
        if (content) messageData.content = content;
        if (fileUrl) messageData.fileUrl = fileUrl;
        if (audioUrl) messageData.audioUrl = audioUrl;

        const message = await Message.create(messageData);

        const senderInfo = await getUserInfo(sender);
        if (!senderInfo) {
          socket.emit('error', { message: 'Failed to fetch sender information' });
          return;
        }

        const messagePayload = {
          _id: message._id.toString(),
          sender: senderInfo,
          content: message.content,
          messageType: message.messageType,
          fileUrl: message.fileUrl,
          audioUrl: message.audioUrl,
          channelId: message.channelId.toString(),
          createdAt: message.createdAt,
          updatedAt: message.updatedAt,
        };

        // Find channel to get all members
        const channel = await Channel.findById(channelId);
        if (!channel) {
          socket.emit('error', { message: 'Channel not found' });
          return;
        }

        // Emit to all channel members who are online (including sender)
        const allMembers = channel.members.map((m) => m.toString());
        for (const memberId of allMembers) {
          const memberSocketId = userSockets.get(memberId);
          if (memberSocketId) {
            // Note the typo matches the frontend exactly: "recieve" not "receive"
            io.to(memberSocketId).emit('recieve-channel-message', messagePayload);
          }
        }

        const preview = content ? content.substring(0, 50) : `[${messageType}]`;
        console.log(`Channel message from ${sender} in ${channelId}: ${preview}`);
      } catch (error) {
        console.error('Error handling send-channel-message:', error);
        socket.emit('error', { message: 'Failed to send channel message', error: error.message });
      }
    });

    // --- Channel Notification (new channel created) ---
    socket.on('add-channel-notify', async (channel) => {
      try {
        if (!channel || !channel.members) return;

        // Notify all members (except the creator who already has it)
        for (const memberId of channel.members) {
          const memberIdStr = typeof memberId === 'string' ? memberId : memberId.toString();
          if (memberIdStr === userId) continue; // Skip creator
          const memberSocketId = userSockets.get(memberIdStr);
          if (memberSocketId) {
            io.to(memberSocketId).emit('new-channel-added', channel);
          }
        }
      } catch (error) {
        console.error('Error handling add-channel-notify:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', userId);
      userSockets.delete(userId);
    });
  });

  return io;
};

export default setupSocket;
