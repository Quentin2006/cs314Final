import Message from '../models/Message.js';

export async function getAllMessages(_, res) {
  try {
    const { id } = req.body;

    if (!id) {
      res.status(400).json({ message: "Contact ID is required" });
      return;
    }

    const messages = await Message.find({
      $or: [
        { sender: id },
        { recipient: id }
      ]
    }).sort({ createdAt: -1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getAllMessages controller: ", error.message);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}
