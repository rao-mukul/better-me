import mongoose from "mongoose";

const resetHistorySchema = new mongoose.Schema({
  resetAt: {
    type: Date,
    required: true,
  },
  daysClean: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    default: "",
  },
});

const cleanTimerSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  habitName: {
    type: String,
    required: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
    enum: ["health", "addiction", "lifestyle", "personal", "other"],
    default: "other",
  },
  icon: {
    type: String,
    default: "target", // lucide icon name
  },
  color: {
    type: String,
    enum: ["blue", "green", "purple", "orange", "red", "pink"],
    default: "green",
  },
  notes: {
    type: String,
    default: "",
  },
  resetHistory: {
    type: [resetHistorySchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

cleanTimerSchema.index({ userId: 1, isActive: 1 });

export default mongoose.model("CleanTimer", cleanTimerSchema);
