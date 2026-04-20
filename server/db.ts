import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in the environment variables");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log("Connected to MongoDB Atlas successfully");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  }
}

// Re-export mongoose for use in models
export { mongoose };
