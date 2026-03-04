import mongoose from "mongoose";

const sleepStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  totalMinutes: {
    type: Number,
    default: 0,
  },
  targetHours: {
    type: Number,
    default: 8,
  },
  targetMet: {
    type: Boolean,
    default: false,
  },
  averageQuality: {
    type: String,
    enum: ["poor", "fair", "good", "excellent", "none"],
    default: "none",
  },
  sleepScore: {
    type: Number, // 0-100
    default: 0,
  },
  entryCount: {
    type: Number,
    default: 0,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sleepStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("SleepStats", sleepStatsSchema);
