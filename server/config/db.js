import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.warn("⚠️  MONGODB_URI not set.");
    if (process.env.NODE_ENV === "production") {
      console.error("❌ MONGODB_URI is required for production deployments.");
      process.exit(1);
    }
    
    console.log("🛠️  Initializing mongodb-memory-server (Zero-Config Test DB)...");
    try {
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();
      await mongoose.connect(memoryUri);
      console.log(`✅ Default Memory Database Connected: ${memoryUri}`);
    } catch (err) {
      console.error("❌ Failed to start Memory Server:", err);
    }
    return;
  }

  // Real DB connection
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Atlas connected successfully.");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    if (process.env.NODE_ENV === "production") process.exit(1);
  }
}
