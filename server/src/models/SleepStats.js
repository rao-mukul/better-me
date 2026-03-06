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
  entryCount: {
    type: Number,
    default: 0,
  },
  // New fields for time tracking
  averageBedTime: {
    type: String, // HH:mm format (e.g., "22:30")
    default: null,
  },
  averageWakeTime: {
    type: String, // HH:mm format (e.g., "06:30")
    default: null,
  },
  bedtimeConsistency: {
    type: Number, // 0-100 (higher is better)
    default: 0,
  },
  wakeTimeConsistency: {
    type: Number, // 0-100 (higher is better)
    default: 0,
  },
  earliestBedTime: {
    type: String,
    default: null,
  },
  latestBedTime: {
    type: String,
    default: null,
  },
  earliestWakeTime: {
    type: String,
    default: null,
  },
  latestWakeTime: {
    type: String,
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

sleepStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("SleepStats", sleepStatsSchema);
