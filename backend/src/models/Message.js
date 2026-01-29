import mongoose from 'mongoose';


// 1 - make schema
// 2 - create model off schema
const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: Number,
      required: true,
    },
    recipient: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    }
  },
  { timestamps: true } // createdAt and updatedAt feild
)


const Message = mongoose.model('Message', messageSchema);

export default Message;

