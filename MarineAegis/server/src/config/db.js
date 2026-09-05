import mongoose from "mongoose";

export async function connectDatabase(uri) {
  if (!uri) {
    console.warn("MONGODB_URI is not set. API is running without database access.");
    return false;
  }

  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected");
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}
