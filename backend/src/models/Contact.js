import mongoose from 'mongoose';


// 1 - make schema
// 2 - create model off schema
const contactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    }
  },
  { timestamps: true } // createdAt and updatedAt feild
)


const Contact = mongoose.model('Contact', contactSchema);

export default Contact;

