import dotenv from 'dotenv';
import { createServer } from 'http';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { setupSocket } from './socket/socket.js';

dotenv.config();

const app = createApp();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5001;

setupSocket(httpServer);

connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log('Server is running on port', PORT);
    console.log('Socket.io is ready for connections');
  });
});
