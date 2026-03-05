import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';

export async function searchContacts(req, res) {
  try {
    const { searchTerm } = req.body;

    if (!searchTerm) {
      return res.status(400).json({ message: 'Search term is required' });
    }

    const userId = req.userId;
    const searchRegex = new RegExp(searchTerm, 'i');

    const contacts = await User.find({
      _id: { $ne: userId },
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
      ],
    }).select('_id firstName lastName email');

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error in searchContacts:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function getAllContacts(req, res) {
  try {
    const userId = req.userId;

    const users = await User.find({ _id: { $ne: userId } }).select('_id firstName lastName');

    const contacts = users.map((u) => ({
      label: `${u.firstName} ${u.lastName}`.trim() || u._id.toString(),
      value: u._id.toString(),
    }));

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error in getAllContacts:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function getContactsForList(req, res) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(400).json({ message: 'User ID not found' });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const contacts = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userObjectId }, { recipient: userObjectId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$sender', userObjectId] },
              then: '$recipient',
              else: '$sender',
            },
          },
          lastMessageTime: { $first: '$createdAt' },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'contactInfo',
        },
      },
      {
        $unwind: '$contactInfo',
      },
      {
        $project: {
          _id: '$contactInfo._id',
          firstName: '$contactInfo.firstName',
          lastName: '$contactInfo.lastName',
          email: '$contactInfo.email',
          image: '$contactInfo.image',
          color: '$contactInfo.color',
          lastMessageTime: 1,
        },
      },
    ]);

    return res.status(200).json({ contacts });
  } catch (error) {
    console.error('Error in getContactsForList:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function deleteDM(req, res) {
  try {
    const { dmId } = req.params;
    const userId = req.userId;

    if (!dmId) {
      return res.status(400).json({ message: 'Missing or invalid dmId' });
    }

    await Message.deleteMany({
      $or: [
        { sender: userId, recipient: dmId },
        { sender: dmId, recipient: userId },
      ],
    });

    return res.status(200).json({ message: 'DM deleted successfully' });
  } catch (error) {
    console.error('Error in deleteDM:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
