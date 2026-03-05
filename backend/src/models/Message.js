import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    content: {
      type: String,
      required: false,
    },
    messageType: {
      type: String,
      enum: ['text', 'file'],
      default: 'text',
    },
    fileUrl: {
      type: String,
      default: undefined,
    },
    audioUrl: {
      type: String,
      default: undefined,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
      required: false,
    },
  },
  { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
