import mongoose from "mongoose";

const gymExerciseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  muscleGroup: {
    type: String,
    required: true,
    enum: ["chest", "triceps", "back", "biceps", "legs", "shoulders"],
  },
  isCustom: {
    type: Boolean,
    default: false, // true if user-created, false if predefined
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

gymExerciseSchema.index({ userId: 1, muscleGroup: 1 });
gymExerciseSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model("GymExercise", gymExerciseSchema);
