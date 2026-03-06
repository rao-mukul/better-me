import mongoose from "mongoose";

const gymLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  workoutType: {
    type: String,
    required: true,
    enum: [
      "chestFocus", // Chest & Triceps (Chest priority)
      "tricepsFocus", // Chest & Triceps (Triceps priority)
      "backFocus", // Back & Biceps (Back priority)
      "bicepsFocus", // Back & Biceps (Biceps priority)
      "legsFocus", // Legs & Shoulders (Legs priority)
      "shoulderFocus", // Legs & Shoulders (Shoulders priority)
    ],
  },
  primaryMuscle: {
    type: String,
    required: true,
    enum: ["chest", "triceps", "back", "biceps", "legs", "shoulders"],
  },
  secondaryMuscle: {
    type: String,
    required: true,
    enum: ["chest", "triceps", "back", "biceps", "legs", "shoulders"],
  },
  primaryExercises: {
    type: [String], // Array of exercise names
    required: true,
    default: [],
  },
  secondaryExercises: {
    type: [String], // Array of exercise names
    required: true,
    default: [],
  },
  duration: {
    type: Number, // minutes (optional, can be added later)
    required: false,
  },
  notes: {
    type: String,
    default: "",
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

gymLogSchema.index({ userId: 1, date: 1 });

export default mongoose.model("GymLog", gymLogSchema);
