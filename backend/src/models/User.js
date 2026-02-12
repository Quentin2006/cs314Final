import mongoose from 'mongoose';


// 1 - make schema
// 2 - create model off schema
const userSchema = new mongoose.Schema(
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
    },
    password: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    color: {
      type: String,
    },
  },
  { timestamps: true } // createdAt and updatedAt feild
)


const User = mongoose.model('User', userSchema);

export default User;

