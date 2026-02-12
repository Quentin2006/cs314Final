import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import contactsRoutes from './routes/contacts.js';
import messagesRoutes from './routes/messages.js';
import { setupSocket } from './socket/socket.js';

dotenv.config()

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(cors())

// middleware to parse JSON bodies
// NOTE: Middleware is code that interseps requests to do processing before sending to future methods
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/messages", messagesRoutes);

// Setup Socket.io
setupSocket(httpServer);

// connect to db then run server
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log('Server is running on port ', PORT);
    console.log('Socket.io is ready for connections');
  });
})

