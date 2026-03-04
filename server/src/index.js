import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import waterRoutes from "./routes/water.js";
import sleepRoutes from "./routes/sleep.js";
import gymRoutes from "./routes/gym.js";
import errorHandler from "./middleware/errorHandler.js";

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

app.use("/api/water", waterRoutes);
app.use("/api/sleep", sleepRoutes);
app.use("/api/gym", gymRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

// Initialize DB connection
connectDB();

// Only start server if not running in Vercel (serverless environment)
if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless functions
export default app;
