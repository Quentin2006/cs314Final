import express from 'express';
import { createChannel, getUserChannels, getChannelMessages, deleteChannel } from '../controllers/channels.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/create-channel', verifyToken, createChannel);
router.get('/get-user-channels', verifyToken, getUserChannels);
router.get('/get-channel-messages/:channelId', verifyToken, getChannelMessages);
router.delete('/delete-channel/:channelId', verifyToken, deleteChannel);

export default router;
