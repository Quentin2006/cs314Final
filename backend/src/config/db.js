import mongoose from 'mongoose';


export const connectDB = async () => {

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");
  }
  catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // means exit with failure
  }
}
