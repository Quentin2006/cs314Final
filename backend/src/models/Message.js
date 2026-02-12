import mongoose from 'mongoose';


// 1 - make schema
// 2 - create model off schema
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
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image'],
      default: 'text'
    }
  },
  { timestamps: true } // createdAt and updatedAt feild
)


const Message = mongoose.model('Message', messageSchema);

export default Message;

