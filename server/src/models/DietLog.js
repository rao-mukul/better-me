import mongoose from "mongoose";

const dietLogSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
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
  servingSize: {
    type: String,
    default: "",
  },
  eatenAt: {
    type: Date,
    required: true,
  },
  date: {
    type: String, // yyyy-MM-dd format
    required: true,
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

export default mongoose.model("DietLog", dietLogSchema);
