import mongoose from "mongoose";

const dietLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  // Reference to meal in library (if exists)
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MealLibrary",
    default: null,
  },
  // Meal data (denormalized for quick access)
  foodName: {
    type: String,
    required: true,
  },
  calories: {
    type: Number,
    required: true,
    min: 0,
  },
  protein: {
    type: Number, // grams
    required: true,
    min: 0,
  },
  carbs: {
    type: Number, // grams
    required: true,
    min: 0,
  },
  fat: {
    type: Number, // grams
    required: true,
    min: 0,
  },
  fiber: {
    type: Number, // grams
    default: 0,
    min: 0,
  },
  servingSize: {
    type: String,
    default: "",
  },
  // Log metadata
  eatenAt: {
    type: Date,
    required: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
  },
  category: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack", "other"],
    default: "other",
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

dietLogSchema.index({ userId: 1, date: 1 });
dietLogSchema.index({ userId: 1, mealId: 1 });

export default mongoose.model("DietLog", dietLogSchema);
