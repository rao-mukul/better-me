import mongoose from "mongoose";

const dietStatsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  totalCalories: {
    type: Number,
    default: 0,
  },
  totalProtein: {
    type: Number, // grams
    default: 0,
  },
  totalCarbs: {
    type: Number, // grams
    default: 0,
  },
  totalFat: {
    type: Number, // grams
    default: 0,
  },
  calorieGoal: {
    type: Number,
    default: 2000,
  },
  proteinGoal: {
    type: Number, // grams
    default: 150,
  },
  carbsGoal: {
    type: Number, // grams
    default: 200,
  },
  fatGoal: {
    type: Number, // grams
    default: 65,
  },
  goalMet: {
    type: Boolean,
    default: false,
  },
  entryCount: {
    type: Number,
    default: 0,
  },
});

dietStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DietStats", dietStatsSchema);
