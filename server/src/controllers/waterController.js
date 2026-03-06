import {
  format,
  subDays,
  parseISO,
  startOfWeek,
  addDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import IntakeLog from "../models/IntakeLog.js";
import DailyStats from "../models/DailyStats.js";
import { DEFAULT_USER_ID, DEFAULT_GOAL } from "../constants/defaults.js";

const getToday = () => format(new Date(), "yyyy-MM-dd");

export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday();
    const [logs, stats] = await Promise.all([
      IntakeLog.find({ userId: DEFAULT_USER_ID, date }).sort({ loggedAt: -1 }),
      DailyStats.findOne({ userId: DEFAULT_USER_ID, date }),
    ]);

    res.json({
      logs,
      stats: stats || {
        totalMl: 0,
        goal: DEFAULT_GOAL,
        goalMet: false,
        entryCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const addLog = async (req, res, next) => {
  try {
    const { amount, type, label } = req.body;

    if (!amount || amount < 1 || amount > 5000) {
      return res
        .status(400)
        .json({ error: "Amount must be between 1 and 5000 ml" });
    }
    if (!["glass", "bottle", "custom"].includes(type)) {
      return res
        .status(400)
        .json({ error: "Type must be glass, bottle, or custom" });
    }

    const date = getToday();

    const log = await IntakeLog.create({
      userId: DEFAULT_USER_ID,
      amount,
      type,
      label: label || `${type} (${amount}ml)`,
      date,
    });

    // Atomic upsert - concurrency safe
    const stats = await DailyStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $inc: { totalMl: amount, entryCount: 1 },
        $set: { updatedAt: new Date() },
        $setOnInsert: { goal: DEFAULT_GOAL },
      },
      { upsert: true, new: true },
    );

    // Update goalMet based on new total
    if (stats.totalMl >= stats.goal && !stats.goalMet) {
      stats.goalMet = true;
      await stats.save();
    }

    res.status(201).json({ log, stats });
  } catch (err) {
    next(err);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await IntakeLog.findById(id);

    if (!log) {
      return res.status(404).json({ error: "Log not found" });
    }

    await IntakeLog.deleteOne({ _id: id });

    const stats = await DailyStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date: log.date },
      {
        $inc: { totalMl: -log.amount, entryCount: -1 },
        $set: { updatedAt: new Date() },
      },
      { new: true },
    );

    // Recalculate goalMet
    if (stats) {
      stats.goalMet = stats.totalMl >= stats.goal;
      await stats.save();
    }

    res.json({
      stats: stats || {
        totalMl: 0,
        goal: DEFAULT_GOAL,
        goalMet: false,
        entryCount: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getWeekData = async (req, res, next) => {
  try {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "yyyy-MM-dd"),
    );

    const stats = await DailyStats.find({
      userId: DEFAULT_USER_ID,
      date: { $in: dates },
    }).sort({ date: 1 });

    // Fill in missing days with zeros
    const statsMap = new Map(stats.map((s) => [s.date, s]));
    const weekData = dates.map((date) => {
      const existing = statsMap.get(date);
      return {
        date,
        dayLabel: format(parseISO(date), "EEE"),
        totalMl: existing?.totalMl || 0,
        goal: existing?.goal || DEFAULT_GOAL,
        goalMet: existing?.goalMet || false,
        entryCount: existing?.entryCount || 0,
      };
    });

    res.json(weekData);
  } catch (err) {
    next(err);
  }
};

export const getMonthData = async (req, res, next) => {
  try {
    const { year, month } = req.query;

    let targetDate;
    if (year && month) {
      targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    } else {
      targetDate = new Date();
    }

    const startOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0,
    );

    const startDate = format(startOfMonth, "yyyy-MM-dd");
    const endDate = format(endOfMonth, "yyyy-MM-dd");

    const stats = await DailyStats.find({
      userId: DEFAULT_USER_ID,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Create map of all days in month
    const daysInMonth = endOfMonth.getDate();
    const statsMap = new Map(stats.map((s) => [s.date, s]));

    const monthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = format(
        new Date(targetDate.getFullYear(), targetDate.getMonth(), i + 1),
        "yyyy-MM-dd",
      );
      const existing = statsMap.get(date);
      return {
        date,
        day: i + 1,
        totalMl: existing?.totalMl || 0,
        goal: existing?.goal || DEFAULT_GOAL,
        goalMet: existing?.goalMet || false,
        entryCount: existing?.entryCount || 0,
      };
    });

    res.json({
      year: targetDate.getFullYear(),
      month: targetDate.getMonth() + 1,
      monthName: format(targetDate, "MMMM yyyy"),
      data: monthData,
    });
  } catch (err) {
    next(err);
  }
};

export const getStreak = async (req, res, next) => {
  try {
    // Get last 90 days of stats to compute streaks
    const today = new Date();
    const stats = await DailyStats.find({
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

export const updateGoal = async (req, res, next) => {
  try {
    const { goal } = req.body;

    if (!goal || goal < 500 || goal > 10000) {
      return res
        .status(400)
        .json({ error: "Goal must be between 500 and 10000 ml" });
    }

    const date = getToday();

    const stats = await DailyStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: { goal, updatedAt: new Date() },
        $setOnInsert: { totalMl: 0, entryCount: 0 },
      },
      { upsert: true, new: true },
    );

    stats.goalMet = stats.totalMl >= stats.goal;
    await stats.save();

    res.json({ goal: stats.goal, stats });
  } catch (err) {
    next(err);
  }
};
