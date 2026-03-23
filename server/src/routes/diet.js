import express from "express";

const router = express.Router();

let dietControllerPromise = null;

const loadDietController = () => {
  if (!dietControllerPromise) {
    dietControllerPromise = import("../controllers/dietControllerNew.js");
  }
  return dietControllerPromise;
};

const withDietHandler = (handlerName) => async (req, res, next) => {
  try {
    const controller = await loadDietController();
    return controller[handlerName](req, res, next);
  } catch (err) {
    return next(err);
  }
};

const withDietUpload = async (req, res, next) => {
  try {
    const controller = await loadDietController();
    return controller.uploadMiddleware(req, res, next);
  } catch (err) {
    return next(err);
  }
};

// Today's logs
router.get("/today", withDietHandler("getTodayData"));

// Month data for calendar
router.get("/month", withDietHandler("getMonthData"));

// Meal library
router.get("/meals/search", withDietHandler("searchMeals"));
router.get("/meals/popular", withDietHandler("getPopularMeals"));
router.delete("/meals/:id", withDietHandler("deleteMealFromLibrary"));

// AI-powered meal analysis
router.post(
  "/analyze-image",
  withDietUpload,
  withDietHandler("analyzeMealImage"),
);

// Image cleanup
router.post("/cleanup-image", withDietHandler("cleanupImage"));

// Save meal to library (after AI analysis or manual entry)
router.post("/meals", withDietHandler("saveMealToLibrary"));

// Log a meal
router.post("/log", withDietHandler("logMeal"));
router.delete("/log/:id", withDietHandler("deleteLog"));

export default router;
