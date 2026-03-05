import mongoose from 'mongoose';
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';

export async function createChannel(req, res) {
  try {
    const userId = req.userId;
    const { name, members } = req.body;

    if (!name || !members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Channel name and at least one member are required' });
    }

    // The admin (creator) is always added to members
    const allMembers = [...new Set([...members, userId])];

    const channel = await Channel.create({
      name,
      members: allMembers,
      admin: userId,
    });

    return res.status(201).json({ channel });
  } catch (error) {
    console.error('Error in createChannel:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function getUserChannels(req, res) {
  try {
    const userId = req.userId;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const channels = await Channel.find({
      $or: [
        { admin: userObjectId },
        { members: userObjectId },
      ],
    }).sort({ updatedAt: -1 });

    // Return admin as string (not populated) so frontend can compare with userInfo.id
    const channelsData = channels.map((ch) => ({
      ...ch.toObject(),
      admin: ch.admin.toString(),
    }));

    return res.status(200).json({ channels: channelsData });
  } catch (error) {
    console.error('Error in getUserChannels:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function getChannelMessages(req, res) {
  try {
    const { channelId } = req.params;

    if (!channelId) {
      return res.status(400).json({ message: 'Channel ID is required' });
    }

    const messages = await Message.find({ channelId })
      .populate('sender', '_id firstName lastName image color')
      .sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Error in getChannelMessages:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function deleteChannel(req, res) {
  try {
    const { channelId } = req.params;
    const userId = req.userId;

    if (!channelId) {
      return res.status(400).json({ message: 'Channel ID is required' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Only admin can delete
    if (channel.admin.toString() !== userId) {
      return res.status(403).json({ message: 'Only the channel admin can delete this channel' });
    }

    // Delete channel messages
    await Message.deleteMany({ channelId });

    // Delete the channel
    await Channel.findByIdAndDelete(channelId);

    return res.status(200).json({ message: 'Channel deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteChannel:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
