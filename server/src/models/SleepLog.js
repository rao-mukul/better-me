import mongoose from "mongoose";

const sleepLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  sleptAt: {
    type: Date,
    required: true,
  },
  wokeUpAt: {
    type: Date,
    required: false, // Optional until wake-up is logged
  },
  duration: {
    type: Number, // minutes
    required: false, // Calculated when wokeUpAt is set
  },
  quality: {
    type: String,
    enum: ["poor", "fair", "good", "excellent"],
    required: false, // Set when waking up
  },
  isComplete: {
    type: Boolean,
    default: false, // true when wokeUpAt is logged
  },
  notes: {
    type: String,
    default: "",
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  timezoneOffsetMinutes: {
    type: Number,
    default: null,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

sleepLogSchema.index({ userId: 1, date: 1 });
sleepLogSchema.index({ userId: 1, isComplete: 1, sleptAt: -1 });

export default mongoose.model("SleepLog", sleepLogSchema);
