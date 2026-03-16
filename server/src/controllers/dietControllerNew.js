import { format } from "date-fns";
import DietLog from "../models/DietLog.js";
import MealLibrary from "../models/MealLibrary.js";
import { DEFAULT_USER_ID } from "../constants/defaults.js";
import { analyzeFoodImage, getNutritionalInfo } from "../config/gemini.js";
import { uploadMealImage, deleteMealImage } from "../config/imagekit.js";
import multer from "multer";

const getToday = (req) => {
  return req?.query?.date || format(new Date(), "yyyy-MM-dd");
};

const isSummaryRequest = (req) =>
  req?.query?.summary === "1" || req?.query?.summary === "true";

// Multer config for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"), false);
    }
  },
});

export const uploadMiddleware = upload.single("mealImage");

// Get today's meal logs
export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday(req);
    const summary = isSummaryRequest(req);

    if (summary) {
      const totalsAgg = await DietLog.aggregate([
        { $match: { userId: DEFAULT_USER_ID, date } },
        {
          $group: {
            _id: null,
            calories: { $sum: "$calories" },
            protein: { $sum: "$protein" },
            carbs: { $sum: "$carbs" },
            fat: { $sum: "$fat" },
            fiber: { $sum: { $ifNull: ["$fiber", 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      const totals = totalsAgg[0] || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        count: 0,
      };

      res.json({ logs: [], totals });
      return;
    }

    const logs = await DietLog.find({
      userId: DEFAULT_USER_ID,
      date,
    })
      .populate("mealId")
      .sort({ eatenAt: -1 })
      .lean();

    // Calculate daily totals
    const totals = logs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        fiber: acc.fiber + (log.fiber || 0),
        count: acc.count + 1,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, count: 0 },
    );

    res.json({ logs, totals });
  } catch (err) {
    next(err);
  }
};

// Search meals in library (autocomplete)
export const searchMeals = async (req, res, next) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    // Search by name (case-insensitive)
    const searchRegex = new RegExp(query, "i");

    const meals = await MealLibrary.find({
      userId: DEFAULT_USER_ID,
      $or: [{ name: searchRegex }, { searchName: searchRegex }],
    })
      .sort({ timesLogged: -1, lastLoggedAt: -1 })
      .limit(10)
      .select(
        "name description imageUrl thumbnailUrl calories protein carbs fat fiber servingSize category timesLogged",
      );

    res.json(meals);
  } catch (err) {
    next(err);
  }
};

// Get popular/recent meals
export const getPopularMeals = async (req, res, next) => {
  try {
    const meals = await MealLibrary.find({
      userId: DEFAULT_USER_ID,
    })
      .sort({ timesLogged: -1, lastLoggedAt: -1 })
      .limit(20)
      .select(
        "name description imageUrl thumbnailUrl calories protein carbs fat fiber servingSize category timesLogged lastLoggedAt",
      );

    res.json(meals);
  } catch (err) {
    next(err);
  }
};

// Analyze meal image with Gemini AI
export const analyzeMealImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log("Analyzing image:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Convert buffer to base64
    const imageBase64 = req.file.buffer.toString("base64");

    // Upload to ImageKit first
    const imageData = await uploadMealImage(
      req.file.buffer,
      req.file.originalname,
    );

    try {
      // Analyze with Gemini - pass the correct MIME type
      const analysis = await analyzeFoodImage(imageBase64, req.file.mimetype);

      res.json({
        analysis,
        imageData,
      });
    } catch (analysisError) {
      // If AI analysis fails, cleanup the uploaded image and propagate error
      console.error(
        "AI analysis failed, cleaning up image:",
        imageData.imageId,
      );
      try {
        await deleteMealImage(imageData.imageId);
      } catch (cleanupError) {
        console.error(
          "Failed to cleanup image after analysis error:",
          cleanupError,
        );
      }
      throw analysisError;
    }
  } catch (err) {
    console.error("Meal analysis error:", err);
    console.error("Error details:", {
      message: err.message,
      stack: err.stack,
    });
    next(err);
  }
};

// Get nutritional info for a meal (from Gemini)
export const getMealNutrition = async (req, res, next) => {
  try {
    const { name, description, portionSize, ingredients } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Meal name is required" });
    }

    const nutrition = await getNutritionalInfo(
      name,
      description || "",
      portionSize || "1 serving",
      ingredients || [],
    );

    res.json(nutrition);
  } catch (err) {
    console.error("Nutrition fetch error:", err);
    next(err);
  }
};

// Save meal to library
export const saveMealToLibrary = async (req, res, next) => {
  try {
    const {
      name,
      description,
      aiDescription,
      imageUrl,
      imageId,
      thumbnailUrl,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      servingSize,
      servingUnit,
      category,
      tags,
      isAIAnalyzed,
    } = req.body;

    if (
      !name ||
      calories === undefined ||
      protein === undefined ||
      carbs === undefined ||
      fat === undefined
    ) {
      return res.status(400).json({
        error: "Name and nutritional values are required",
      });
    }

    // Normalize category to valid enum values
    const normalizeCategory = (cat) => {
      if (!cat) return "other";
      const normalized = cat.toLowerCase().trim();
      // Extract first valid category if multiple (e.g., "breakfast/snack" -> "breakfast")
      if (normalized.includes("breakfast")) return "breakfast";
      if (normalized.includes("lunch")) return "lunch";
      if (normalized.includes("dinner")) return "dinner";
      if (normalized.includes("snack")) return "snack";
      return "other";
    };

    const validCategory = normalizeCategory(category);

    // Check if meal already exists
    const existingMeal = await MealLibrary.findOne({
      userId: DEFAULT_USER_ID,
      searchName: name.toLowerCase().replace(/[^a-z0-9\s]/g, ""),
    });

    if (existingMeal) {
      // Update existing meal
      existingMeal.description = description || existingMeal.description;
      existingMeal.aiDescription = aiDescription || existingMeal.aiDescription;
      existingMeal.calories = calories;
      existingMeal.protein = protein;
      existingMeal.carbs = carbs;
      existingMeal.fat = fat;
      existingMeal.fiber = fiber ?? existingMeal.fiber;
      existingMeal.servingSize = servingSize || existingMeal.servingSize;
      existingMeal.servingUnit = servingUnit || existingMeal.servingUnit;
      existingMeal.category = validCategory;
      existingMeal.tags = tags || existingMeal.tags;
      existingMeal.isAIAnalyzed = isAIAnalyzed || existingMeal.isAIAnalyzed;

      // Update image if new one provided AND it's different
      if (imageUrl && imageUrl !== existingMeal.imageUrl) {
        // Delete old image if exists
        if (existingMeal.imageId) {
          try {
            await deleteMealImage(existingMeal.imageId);
            console.log(`Deleted old image: ${existingMeal.imageId}`);
          } catch (err) {
            console.error("Failed to delete old image:", err);
          }
        }
        existingMeal.imageUrl = imageUrl;
        existingMeal.imageId = imageId;
        existingMeal.thumbnailUrl = thumbnailUrl;
      } else if (imageId && imageId !== existingMeal.imageId) {
        // If a new image was uploaded but we're keeping the old one, delete the new one
        try {
          await deleteMealImage(imageId);
          console.log(`Deleted duplicate image: ${imageId}`);
        } catch (err) {
          console.error("Failed to delete duplicate image:", err);
        }
      }

      await existingMeal.save();
      return res.json(existingMeal);
    }

    // Create new meal
    const meal = await MealLibrary.create({
      userId: DEFAULT_USER_ID,
      name,
      description: description || "",
      aiDescription: aiDescription || "",
      imageUrl: imageUrl || "",
      imageId: imageId || "",
      thumbnailUrl: thumbnailUrl || "",
      calories,
      protein,
      carbs,
      fat,
      fiber: fiber ?? 0,
      servingSize: servingSize || "",
      servingUnit: servingUnit || "",
      category: validCategory,
      tags: tags || [],
      isAIAnalyzed: isAIAnalyzed || false,
    });

    res.status(201).json(meal);
  } catch (err) {
    console.error("Save meal to library error:", err);
    next(err);
  }
};

// Log a meal (from library or new)
export const logMeal = async (req, res, next) => {
  try {
    const {
      mealId, // If logging from library
      foodName,
      calories,
      protein,
      carbs,
      fat,
      fiber,
      servingSize,
      category,
      eatenAt,
      notes,
    } = req.body;

    if (
      !foodName ||
      calories === undefined ||
      protein === undefined ||
      carbs === undefined ||
      fat === undefined
    ) {
      return res.status(400).json({
        error: "Meal name and nutritional values are required",
      });
    }

    // Normalize category to valid enum values
    const normalizeCategory = (cat) => {
      if (!cat) return "other";
      const normalized = cat.toLowerCase().trim();
      if (normalized.includes("breakfast")) return "breakfast";
      if (normalized.includes("lunch")) return "lunch";
      if (normalized.includes("dinner")) return "dinner";
      if (normalized.includes("snack")) return "snack";
      return "other";
    };

    const eatenAtDate = eatenAt ? new Date(eatenAt) : new Date();
    const date = format(eatenAtDate, "yyyy-MM-dd");

    // Create log entry
    const log = await DietLog.create({
      userId: DEFAULT_USER_ID,
      mealId: mealId || null,
      foodName,
      calories,
      protein,
      carbs,
      fat,
      fiber: fiber ?? 0,
      servingSize: servingSize || "",
      category: normalizeCategory(category),
      eatenAt: eatenAtDate,
      date,
      notes: notes || "",
    });

    // If mealId exists, update meal library stats
    if (mealId) {
      await MealLibrary.findByIdAndUpdate(mealId, {
        $inc: { timesLogged: 1 },
        $set: { lastLoggedAt: new Date() },
      });
    }

    const populatedLog = await DietLog.findById(log._id).populate("mealId");

    res.status(201).json(populatedLog);
  } catch (err) {
    next(err);
  }
};

// Delete a meal log
export const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await DietLog.findOne({
      _id: id,
      userId: DEFAULT_USER_ID,
    });

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    // If it was from library, decrement times logged
    if (log.mealId) {
      await MealLibrary.findByIdAndUpdate(log.mealId, {
        $inc: { timesLogged: -1 },
      });
    }

    await log.deleteOne();

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Delete a meal from library
export const deleteMealFromLibrary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meal = await MealLibrary.findOne({
      _id: id,
      userId: DEFAULT_USER_ID,
    });

    if (!meal) {
      return res.status(404).json({ error: "Meal not found" });
    }

    // Delete image from ImageKit if exists
    if (meal.imageId) {
      try {
        await deleteMealImage(meal.imageId);
        console.log(`Deleted image from ImageKit: ${meal.imageId}`);
      } catch (err) {
        console.error("Failed to delete image from ImageKit:", err);
        // Continue with meal deletion even if image deletion fails
      }
    }

    // Delete all logs referencing this meal
    await DietLog.deleteMany({ mealId: meal._id });

    await meal.deleteOne();

    res.json({ message: "Meal deleted from library" });
  } catch (err) {
    next(err);
  }
};

// Cleanup orphaned image (when user abandons form)
export const cleanupImage = async (req, res, next) => {
  try {
    const { imageId } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: "Image ID is required" });
    }

    try {
      await deleteMealImage(imageId);
      console.log(`Cleaned up orphaned image: ${imageId}`);
      res.json({ message: "Image deleted successfully" });
    } catch (err) {
      console.error("Failed to delete image:", err);
      // Return success anyway - image might already be deleted
      res.json({ message: "Image cleanup attempted" });
    }
  } catch (err) {
    next(err);
  }
};

// Get month data for calendar view
export const getMonthData = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const userId = DEFAULT_USER_ID;

    if (!year || !month) {
      return res.status(400).json({ error: "Year and month are required" });
    }

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    const daysInMonth = endDate.getDate();

    const monthName = startDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Get all logs for the month
    const logs = await DietLog.find({
      userId,
      date: {
        $gte: format(startDate, "yyyy-MM-dd"),
        $lte: format(endDate, "yyyy-MM-dd"),
      },
    });

    // Group by day
    const dayData = {};
    logs.forEach((log) => {
      const day = parseInt(log.date.split("-")[2]);
      if (!dayData[day]) {
        dayData[day] = {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          count: 0,
        };
      }
      dayData[day].calories += log.calories;
      dayData[day].protein += log.protein;
      dayData[day].carbs += log.carbs;
      dayData[day].fat += log.fat;
      dayData[day].count += 1;
    });

    // Create array for all days in month
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      return {
        day,
        calories: dayData[day]?.calories || 0,
        protein: dayData[day]?.protein || 0,
        carbs: dayData[day]?.carbs || 0,
        fat: dayData[day]?.fat || 0,
        count: dayData[day]?.count || 0,
      };
    });

    res.json({ data, monthName });
  } catch (err) {
    next(err);
  }
};

export default {
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
};
