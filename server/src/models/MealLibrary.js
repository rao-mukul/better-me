import mongoose from "mongoose";

const mealLibrarySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // Normalized name for search (lowercase, no special chars)
  searchName: {
    type: String,
    lowercase: true,
    index: true,
  },
  description: {
    type: String,
    default: "",
  },
  // Gemini-generated description
  aiDescription: {
    type: String,
    default: "",
  },
  // Image data
  imageUrl: {
    type: String,
    default: "",
  },
  imageId: {
    type: String, // ImageKit file ID for deletion
    default: "",
  },
  thumbnailUrl: {
    type: String,
    default: "",
  },
  // Nutritional information
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
  // Serving information
  servingSize: {
    type: String,
    default: "",
  },
  servingUnit: {
    type: String,
    default: "",
  },
  // Metadata
  timesLogged: {
    type: Number,
    default: 0,
  },
  lastLoggedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Tags for better organization
  tags: {
    type: [String],
    default: [],
  },
  // Meal category (breakfast, lunch, dinner, snack)
  category: {
    type: String,
    enum: ["breakfast", "lunch", "dinner", "snack", "other"],
    default: "other",
  },
  // Whether this meal was AI-analyzed
  isAIAnalyzed: {
    type: Boolean,
    default: false,
  },
});

// Compound indexes for efficient search
mealLibrarySchema.index({ userId: 1, searchName: 1 });
mealLibrarySchema.index({ userId: 1, timesLogged: -1 });
mealLibrarySchema.index({ userId: 1, lastLoggedAt: -1 });

// Text index for full-text search
mealLibrarySchema.index({ name: "text", description: "text", tags: "text" });

// Pre-save middleware to update searchName and updatedAt
mealLibrarySchema.pre("save", function (next) {
  this.searchName = this.name.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("MealLibrary", mealLibrarySchema);
