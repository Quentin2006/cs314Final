import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import messagesRoutes from './routes/messages.js';
import channelsRoutes from './routes/channels.js';

export function createApp() {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }));

  app.use(cookieParser());
  app.use(express.json());

  // Serve uploaded files as static assets
  app.use('/uploads', express.static('uploads'));

  app.use('/api/auth', authRoutes);
  app.use('/api/contacts', contactsRoutes);
  app.use('/api/messages', messagesRoutes);
  app.use('/api/channel', channelsRoutes);

  return app;
}
