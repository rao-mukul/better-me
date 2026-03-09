import dns from "node:dns";
import mongoose from "mongoose";

// Use Google DNS to resolve Atlas SRV records (fixes corporate/ISP DNS issues)
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Cache the connection to reuse across serverless function invocations
let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse the connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log("Using cached MongoDB connection");
    return cachedConnection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Recommended settings for serverless
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      maxPoolSize: 10, // Maintain up to 10 socket connections
    });

    cachedConnection = conn;
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);

    // In serverless, don't exit - just throw the error
    if (process.env.VERCEL === "1") {
      throw error;
    }
    process.exit(1);
  }
};

export default connectDB;
