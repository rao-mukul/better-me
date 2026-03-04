import { format, subDays } from "date-fns";
import DietLog from "../models/DietLog.js";
import DietStats from "../models/DietStats.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_CALORIE_GOAL,
  DEFAULT_PROTEIN_GOAL,
  DEFAULT_CARBS_GOAL,
  DEFAULT_FAT_GOAL,
} from "../constants/defaults.js";

const getToday = () => format(new Date(), "yyyy-MM-dd");

export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday();

    const logs = await DietLog.find({
      userId: DEFAULT_USER_ID,
      date,
    }).sort({ eatenAt: -1 });

    let stats = await DietStats.findOne({ userId: DEFAULT_USER_ID, date });

    if (!stats) {
      stats = {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        calorieGoal: DEFAULT_CALORIE_GOAL,
        proteinGoal: DEFAULT_PROTEIN_GOAL,
        carbsGoal: DEFAULT_CARBS_GOAL,
        fatGoal: DEFAULT_FAT_GOAL,
        goalMet: false,
        entryCount: 0,
      };
    }

    res.json({ logs, stats });
  } catch (err) {
    next(err);
  }
};

export const addLog = async (req, res, next) => {
  try {
    const {
      foodName,
      calories,
      protein,
      carbs,
      fat,
      servingSize,
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
        error: "Food name, calories, protein, carbs, and fat are required",
      });
    }

    if (calories < 0 || protein < 0 || carbs < 0 || fat < 0) {
      return res.status(400).json({
        error: "Nutritional values cannot be negative",
      });
    }

    const eatenAtDate = eatenAt ? new Date(eatenAt) : new Date();
    const date = format(eatenAtDate, "yyyy-MM-dd");

    const log = await DietLog.create({
      userId: DEFAULT_USER_ID,
      foodName,
      calories,
      protein,
      carbs,
      fat,
      servingSize: servingSize || "",
      eatenAt: eatenAtDate,
      date,
      notes: notes || "",
    });

    // Update or create stats
    let stats = await DietStats.findOne({ userId: DEFAULT_USER_ID, date });

    if (!stats) {
      stats = await DietStats.create({
        userId: DEFAULT_USER_ID,
        date,
        totalCalories: calories,
        totalProtein: protein,
        totalCarbs: carbs,
        totalFat: fat,
        calorieGoal: DEFAULT_CALORIE_GOAL,
        proteinGoal: DEFAULT_PROTEIN_GOAL,
        carbsGoal: DEFAULT_CARBS_GOAL,
        fatGoal: DEFAULT_FAT_GOAL,
        goalMet: calories >= DEFAULT_CALORIE_GOAL,
        entryCount: 1,
      });
    } else {
      stats.totalCalories += calories;
      stats.totalProtein += protein;
      stats.totalCarbs += carbs;
      stats.totalFat += fat;
      stats.entryCount += 1;
      stats.goalMet = stats.totalCalories >= stats.calorieGoal;
      await stats.save();
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await DietLog.findById(id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    const { date, calories, protein, carbs, fat } = log;

    await DietLog.findByIdAndDelete(id);

    // Update stats
    const stats = await DietStats.findOne({ userId: DEFAULT_USER_ID, date });

    if (stats) {
      stats.totalCalories = Math.max(0, stats.totalCalories - calories);
      stats.totalProtein = Math.max(0, stats.totalProtein - protein);
      stats.totalCarbs = Math.max(0, stats.totalCarbs - carbs);
      stats.totalFat = Math.max(0, stats.totalFat - fat);
      stats.entryCount = Math.max(0, stats.entryCount - 1);
      stats.goalMet = stats.totalCalories >= stats.calorieGoal;
      await stats.save();
    }

    res.json({ message: "Log deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getWeekData = async (req, res, next) => {
  try {
    const endDate = new Date();
    const dates = [];

    for (let i = 6; i >= 0; i--) {
      const date = format(subDays(endDate, i), "yyyy-MM-dd");
      dates.push(date);
    }

    const statsPromises = dates.map(async (date) => {
      const stats = await DietStats.findOne({
        userId: DEFAULT_USER_ID,
        date,
      });

      return {
        date,
        dayLabel: format(new Date(date), "EEE"),
        totalCalories: stats?.totalCalories || 0,
        totalProtein: stats?.totalProtein || 0,
        totalCarbs: stats?.totalCarbs || 0,
        totalFat: stats?.totalFat || 0,
        calorieGoal: stats?.calorieGoal || DEFAULT_CALORIE_GOAL,
        proteinGoal: stats?.proteinGoal || DEFAULT_PROTEIN_GOAL,
        carbsGoal: stats?.carbsGoal || DEFAULT_CARBS_GOAL,
        fatGoal: stats?.fatGoal || DEFAULT_FAT_GOAL,
        goalMet: stats?.goalMet || false,
        entryCount: stats?.entryCount || 0,
      };
    });

    const weekData = await Promise.all(statsPromises);

    res.json(weekData);
  } catch (err) {
    next(err);
  }
};

export const updateGoals = async (req, res, next) => {
  try {
    const { calorieGoal, proteinGoal, carbsGoal, fatGoal } = req.body;

    if (calorieGoal < 0 || proteinGoal < 0 || carbsGoal < 0 || fatGoal < 0) {
      return res.status(400).json({ error: "Goals cannot be negative" });
    }

    const date = getToday();

    const stats = await DietStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: {
          calorieGoal:
            calorieGoal !== undefined ? calorieGoal : DEFAULT_CALORIE_GOAL,
          proteinGoal:
            proteinGoal !== undefined ? proteinGoal : DEFAULT_PROTEIN_GOAL,
          carbsGoal: carbsGoal !== undefined ? carbsGoal : DEFAULT_CARBS_GOAL,
          fatGoal: fatGoal !== undefined ? fatGoal : DEFAULT_FAT_GOAL,
        },
        $setOnInsert: {
          userId: DEFAULT_USER_ID,
          date,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          goalMet: false,
          entryCount: 0,
        },
      },
      { upsert: true, new: true },
    );

    // Recalculate goalMet
    stats.goalMet = stats.totalCalories >= stats.calorieGoal;
    await stats.save();

    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getStreak = async (req, res, next) => {
  try {
    // Get last 90 days of stats to compute streaks
    const today = new Date();
    const stats = await DietStats.find({
      userId: DEFAULT_USER_ID,
      goalMet: true,
    })
      .sort({ date: -1 })
      .limit(90);

    if (stats.length === 0) {
      return res.json({ current: 0, longest: 0 });
    }

    const metDates = new Set(stats.map((s) => s.date));

    // Current streak: count consecutive days ending today (or yesterday)
    let current = 0;
    let checkDate = today;
    // If today hasn't been met yet, start from yesterday
    if (!metDates.has(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(today, 1);
    }
    while (metDates.has(format(checkDate, "yyyy-MM-dd"))) {
      current++;
      checkDate = subDays(checkDate, 1);
    }

    // Longest streak from available data
    let longest = 0;
    let tempStreak = 0;
    for (let i = 89; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (metDates.has(d)) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    res.json({ current, longest });
  } catch (err) {
    next(err);
  }
};
