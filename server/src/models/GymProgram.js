import mongoose from "mongoose";

const gymProgramSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  workoutTypes: {
    // 6 workout configurations
    chestTriceps: {
      primary: [String], // Exercises (chest + triceps) - chest focus
      secondary: [String], // Not used
    },
    tricepsChest: {
      primary: [String], // Exercises (triceps + chest) - triceps focus
      secondary: [String], // Not used
    },
    backBiceps: {
      primary: [String], // Exercises (back + biceps) - back focus
      secondary: [String], // Not used
    },
    bicepsBack: {
      primary: [String], // Exercises (biceps + back) - biceps focus
      secondary: [String], // Not used
    },
    legsShoulders: {
      primary: [String], // Exercises (legs + shoulders) - legs focus
      secondary: [String], // Not used
    },
    shouldersLegs: {
      primary: [String], // Exercises (shoulders + legs) - shoulders focus
      secondary: [String], // Not used
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
