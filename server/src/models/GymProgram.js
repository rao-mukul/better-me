import mongoose from "mongoose";

const gymProgramSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  workoutTypes: {
    // 6 different workout variations
    chestFocus: {
      primary: [String], // Chest exercises
      secondary: [String], // Triceps exercises
    },
    tricepsFocus: {
      primary: [String], // Triceps exercises
      secondary: [String], // Chest exercises
    },
    backFocus: {
      primary: [String], // Back exercises
      secondary: [String], // Biceps exercises
    },
    bicepsFocus: {
      primary: [String], // Biceps exercises
      secondary: [String], // Back exercises
    },
    legsFocus: {
      primary: [String], // Legs exercises
      secondary: [String], // Shoulder exercises
    },
    shoulderFocus: {
      primary: [String], // Shoulder exercises
      secondary: [String], // Legs exercises
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

gymProgramSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("GymProgram", gymProgramSchema);
