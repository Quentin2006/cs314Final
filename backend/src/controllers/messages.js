import Message from '../models/Message.js';

export async function getAllMessages(req, res) {
  try {
    const userId = req.userId;
    const { id: contactId } = req.body;

    if (!userId || !contactId) {
      return res.status(400).json({ message: 'Missing one or both user IDs' });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: contactId },
        { sender: contactId, recipient: userId },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('Error in getAllMessages:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}

export async function uploadFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const filePath = `uploads/files/${req.file.filename}`;
    return res.status(200).json({ filePath });
  } catch (error) {
    console.error('Error in uploadFile:', error.message);
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
}
