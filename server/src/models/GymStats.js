import mongoose from "mongoose";

const gymStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  totalWorkouts: {
    type: Number,
    default: 0,
  },
  totalMinutes: {
    type: Number,
    default: 0,
  },
  muscleGroupsWorked: {
    type: [String],
    default: [],
  },
  totalExercises: {
    type: Number,
    default: 0,
  },
  averageIntensity: {
    type: String,
    enum: ["light", "moderate", "intense", "none"],
    default: "none",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

gymStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("GymStats", gymStatsSchema);
