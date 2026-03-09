import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import waterRoutes from "./routes/water.js";
import sleepRoutes from "./routes/sleep.js";
import gymRoutes from "./routes/gym.js";
import cleanTimerRoutes from "./routes/cleanTimer.js";
import dietRoutes from "./routes/diet.js";
import errorHandler from "./middleware/errorHandler.js";

// Validate required environment variables
function validateEnv() {
  const warnings = [];

  if (
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY.includes("your_")
  ) {
    warnings.push(
      "⚠️  GEMINI_API_KEY not configured - AI meal analysis will not work",
    );
  }

  if (
    !process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.IMAGEKIT_PUBLIC_KEY.includes("your_")
  ) {
    warnings.push(
      "⚠️  ImageKit keys not configured - Image upload will not work",
    );
  }

  if (warnings.length > 0) {
    console.warn("\n⚠️  Configuration Warnings:");
    warnings.forEach((w) => console.warn(w));
    console.warn("\n💡 See .env file to configure API keys\n");
  } else {
    console.log("✅ All API keys configured");
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration to handle multiple origins including Vercel preview URLs
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or Postman)
      if (!origin) return callback(null, true);

      // Check if origin is in allowed list or matches Vercel preview pattern
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

// Serverless DB connection middleware - MUST be before routes
if (process.env.VERCEL === "1") {
  app.use(async (req, res, next) => {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  });
}

app.use("/api/water", waterRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/gym", gymRoutes);
app.use("/api/clean-timer", cleanTimerRoutes);
app.use("/api/diet", dietRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

// Validate environment variables
validateEnv();

// Initialize DB connection for local development
if (process.env.VERCEL !== "1") {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Export for Vercel serverless functions
export default app;
