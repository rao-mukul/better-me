import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import waterRoutes from "./routes/water.js";
import errorHandler from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/water", waterRoutes);

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
