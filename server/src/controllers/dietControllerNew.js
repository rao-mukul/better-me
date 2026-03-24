import { format } from "date-fns";
import DietLog from "../models/DietLog.js";
import MealLibrary from "../models/MealLibrary.js";
import { DEFAULT_USER_ID } from "../constants/defaults.js";
import { analyzeFoodImage } from "../config/gemini.js";
import { uploadMealImage, deleteMealImage } from "../config/imagekit.js";
import multer from "multer";
import { getRequestDayKey, getLogicalDayKey } from "../utils/dayBoundary.js";

const getToday = (req) => {
  return getRequestDayKey(req);
};

const isSummaryRequest = (req) =>
  req?.query?.summary === "1" || req?.query?.summary === "true";

const minutesToTime = (minutes) => {
  const safeMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
  const mins = String(safeMinutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const computeMealTimingInsights = (logs = [], previousMealLog = null) => {
  if (!logs.length) {
    return {
      mealCount: 0,
      firstMealTime: null,
      lastMealTime: null,
      averageGapMinutes: null,
      shortestGapMinutes: null,
      longestGapMinutes: null,
      feedingWindowMinutes: null,
      overnightGapMinutes: null,
    };
  }

  const sortedLogs = [...logs].sort(
    (a, b) => new Date(a.eatenAt) - new Date(b.eatenAt),
  );

  const getMinutesOfDay = (dateStr) => {
    const d = new Date(dateStr);
    return d.getHours() * 60 + d.getMinutes();
  };

  const mealTimesMinutes = sortedLogs.map((log) => getMinutesOfDay(log.eatenAt));

  const firstAfter4 = sortedLogs.find((l) => getMinutesOfDay(l.eatenAt) >= 4 * 60);
  const firstMealMinutes = firstAfter4 ? getMinutesOfDay(firstAfter4.eatenAt) : mealTimesMinutes[0];
  const lastMealMinutes = mealTimesMinutes[mealTimesMinutes.length - 1];

  const gaps = [];
  for (let i = 1; i < sortedLogs.length; i++) {
    const prev = new Date(sortedLogs[i - 1].eatenAt);
    const curr = new Date(sortedLogs[i].eatenAt);
    const gap = Math.max(0, Math.round((curr - prev) / 60000));
    gaps.push(gap);
  }

  const averageGapMinutes =
    gaps.length > 0
      ? Math.round(gaps.reduce((sum, g) => sum + g, 0) / gaps.length)
      : null;

  const firstMealEatenAt = new Date(sortedLogs[0].eatenAt);
  const lastMealEatenAt = new Date(sortedLogs[sortedLogs.length - 1].eatenAt);
  const feedingWindowMinutes =
    sortedLogs.length > 1
      ? Math.max(0, Math.round((lastMealEatenAt - firstMealEatenAt) / 60000))
      : 0;

  const trueFirstMealEatenAt = firstAfter4 ? new Date(firstAfter4.eatenAt) : firstMealEatenAt;
  
  let overnightGapMinutes = null;
  if (previousMealLog?.eatenAt) {
    const prevEatenAt = new Date(previousMealLog.eatenAt);
    overnightGapMinutes = Math.max(0, Math.round((trueFirstMealEatenAt - prevEatenAt) / 60000));
  }

  return {
    mealCount: sortedLogs.length,
    firstMealTime: trueFirstMealEatenAt.toISOString(),
    lastMealTime: lastMealEatenAt.toISOString(),
    averageGapMinutes,
    shortestGapMinutes: gaps.length ? Math.min(...gaps) : null,
    longestGapMinutes: gaps.length ? Math.max(...gaps) : null,
    feedingWindowMinutes,
    overnightGapMinutes,
  };
};

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

    const logs = await DietLog.find({
      userId: DEFAULT_USER_ID,
      date,
    })
      .populate("mealId")
      .sort({ eatenAt: -1 })
      .lean();

    let previousMealLog = null;
    if (logs && logs.length > 0) {
      const earliestLog = logs[logs.length - 1]; // sorted by eatenAt: -1
      previousMealLog = await DietLog.findOne({
        userId: DEFAULT_USER_ID,
        eatenAt: { $lt: earliestLog.eatenAt }
      }).sort({ eatenAt: -1 }).lean();
    }

    const totals = {
      count: logs.length,
    };

    const timing = computeMealTimingInsights(logs, previousMealLog);

    if (summary) {
      res.json({ logs: [], totals, timing });
      return;
    }

    res.json({ logs, totals, timing });
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
        "name description imageUrl thumbnailUrl calories protein carbs fat fiber servingSize timesLogged",
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
        "name description imageUrl thumbnailUrl calories protein carbs fat fiber servingSize timesLogged lastLoggedAt",
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
      tags,
      isAIAnalyzed,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: "Meal name is required",
      });
    }

    const safeCalories = Number.isFinite(Number(calories))
      ? Number(calories)
      : 0;
    const safeProtein = Number.isFinite(Number(protein)) ? Number(protein) : 0;
    const safeCarbs = Number.isFinite(Number(carbs)) ? Number(carbs) : 0;
    const safeFat = Number.isFinite(Number(fat)) ? Number(fat) : 0;
    const safeFiber = Number.isFinite(Number(fiber)) ? Number(fiber) : 0;

    // Check if meal already exists
    const existingMeal = await MealLibrary.findOne({
      userId: DEFAULT_USER_ID,
      searchName: name.toLowerCase().replace(/[^a-z0-9\s]/g, ""),
    });

    if (existingMeal) {
      // Update existing meal
      existingMeal.description = description || existingMeal.description;
      existingMeal.aiDescription = aiDescription || existingMeal.aiDescription;
      existingMeal.calories = safeCalories;
      existingMeal.protein = safeProtein;
      existingMeal.carbs = safeCarbs;
      existingMeal.fat = safeFat;
      existingMeal.fiber = safeFiber;
      existingMeal.servingSize = servingSize || existingMeal.servingSize;
      existingMeal.servingUnit = servingUnit || existingMeal.servingUnit;
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
      calories: safeCalories,
      protein: safeProtein,
      carbs: safeCarbs,
      fat: safeFat,
      fiber: safeFiber,
      servingSize: servingSize || "",
      servingUnit: servingUnit || "",
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
      eatenAt,
      notes,
    } = req.body;

    if (!foodName) {
      return res.status(400).json({
        error: "Meal name is required",
      });
    }

    const safeCalories = Number.isFinite(Number(calories))
      ? Number(calories)
      : 0;
    const safeProtein = Number.isFinite(Number(protein)) ? Number(protein) : 0;
    const safeCarbs = Number.isFinite(Number(carbs)) ? Number(carbs) : 0;
    const safeFat = Number.isFinite(Number(fat)) ? Number(fat) : 0;
    const safeFiber = Number.isFinite(Number(fiber)) ? Number(fiber) : 0;

    const eatenAtDate = eatenAt ? new Date(eatenAt) : new Date();
    const date = getLogicalDayKey(eatenAtDate);

    // Create log entry
    const log = await DietLog.create({
      userId: DEFAULT_USER_ID,
      mealId: mealId || null,
      foodName,
      calories: safeCalories,
      protein: safeProtein,
      carbs: safeCarbs,
      fat: safeFat,
      fiber: safeFiber,
      servingSize: servingSize || "",
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
    }).sort({ eatenAt: 1 }).lean();

    let previousMonthLastLog = null;
    if (logs.length > 0) {
      previousMonthLastLog = await DietLog.findOne({
        userId,
        eatenAt: { $lt: logs[0].eatenAt }
      }).sort({ eatenAt: -1 }).lean();
    }

    // Group by day
    const dayData = {};
    for (const log of logs) {
      const day = parseInt(log.date.split("-")[2]);
      if (!dayData[day]) {
        dayData[day] = { count: 0, logs: [], previousMealLog: null };
      }
      dayData[day].count += 1;
      dayData[day].logs.push(log);
    }

    let lastSeenLog = previousMonthLastLog;
    const sortedDays = Object.keys(dayData).map(Number).sort((a, b) => a - b);
    for (const day of sortedDays) {
      dayData[day].previousMealLog = lastSeenLog;
      if (dayData[day].logs.length > 0) {
        lastSeenLog = dayData[day].logs[dayData[day].logs.length - 1];
      }
    }

    // Create array for all days in month
    const data = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const timing = computeMealTimingInsights(
        dayData[day]?.logs || [], 
        dayData[day]?.previousMealLog || null
      );
      return {
        day,
        count: dayData[day]?.count || 0,
        firstMealTime: timing.firstMealTime,
        lastMealTime: timing.lastMealTime,
        averageGapMinutes: timing.averageGapMinutes,
        feedingWindowMinutes: timing.feedingWindowMinutes,
        overnightGapMinutes: timing.overnightGapMinutes,
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
  saveMealToLibrary,
  logMeal,
  deleteLog,
  deleteMealFromLibrary,
  cleanupImage,
  getMonthData,
  uploadMiddleware,
};
