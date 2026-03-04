import mongoose from "mongoose";

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sets: {
    type: Number,
    required: true,
    min: 1,
  },
  reps: {
    type: Number,
    required: true,
    min: 1,
  },
  weight: {
    type: Number, // in kg
    default: 0,
  },
  notes: {
    type: String,
    default: "",
  },
});

const gymLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  startedAt: {
    type: Date,
    required: true,
  },
  endedAt: {
    type: Date,
    required: false, // Optional until workout is completed
  },
  duration: {
    type: Number, // minutes
    required: false,
  },
  muscleGroups: {
    type: [String],
    required: false,
    default: [],
    enum: [
      "chest",
      "back",
      "shoulders",
      "arms",
      "legs",
      "core",
      "cardio",
      "full-body",
    ],
  },
  exercises: {
    type: [exerciseSchema],
    default: [],
  },
  intensity: {
    type: String,
    enum: ["light", "moderate", "intense"],
    default: "moderate",
  },
  notes: {
    type: String,
    default: "",
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  isComplete: {
    type: Boolean,
    default: false,
  },
  loggedAt: {
    type: Date,
    default: Date.now,
  },
});

gymLogSchema.index({ userId: 1, date: 1 });

export default mongoose.model("GymLog", gymLogSchema);
