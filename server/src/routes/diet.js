import express from "express";
import {
  getTodayData,
  searchMeals,
  getPopularMeals,
  analyzeMealImage,
  getMealNutrition,
  saveMealToLibrary,
  logMeal,
  deleteLog,
  deleteMealFromLibrary,
  cleanupImage,
  getMonthData,
  uploadMiddleware,
} from "../controllers/dietControllerNew.js";

const router = express.Router();

// Today's logs
router.get("/today", getTodayData);

// Month data for calendar
router.get("/month", getMonthData);

// Meal library
router.get("/meals/search", searchMeals);
router.get("/meals/popular", getPopularMeals);
router.delete("/meals/:id", deleteMealFromLibrary);

// AI-powered meal analysis
router.post("/analyze-image", uploadMiddleware, analyzeMealImage);
router.post("/get-nutrition", getMealNutrition);

// Image cleanup
router.post("/cleanup-image", cleanupImage);

// Save meal to library (after AI analysis or manual entry)
router.post("/meals", saveMealToLibrary);

// Log a meal
router.post("/log", logMeal);
router.delete("/log/:id", deleteLog);

export default router;
