import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  subHours,
} from "date-fns";
import CleanTimer from "../models/CleanTimer.js";
import { DEFAULT_USER_ID } from "../constants/defaults.js";
import { DAY_START_HOUR } from "../utils/dayBoundary.js";

const toLogicalClock = (date) => subHours(new Date(date), DAY_START_HOUR);

export const getAllTimers = async (req, res, next) => {
  try {
    const timers = await CleanTimer.find({
      userId: DEFAULT_USER_ID,
      isActive: true,
    }).sort({ startedAt: 1 }); // Oldest first

    res.json({ timers });
  } catch (err) {
    next(err);
  }
};

export const createTimer = async (req, res, next) => {
  try {
    const { habitName, category, icon, color, notes, startedAt } = req.body;

    if (!habitName || habitName.trim().length === 0) {
      return res.status(400).json({ error: "Habit name is required" });
    }

    const timer = await CleanTimer.create({
      userId: DEFAULT_USER_ID,
      habitName: habitName.trim(),
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      category: category || "other",
      icon: icon || "target",
      color: color || "green",
      notes: notes || "",
      isActive: true,
    });

    res.status(201).json(timer);
  } catch (err) {
    next(err);
  }
};

export const resetTimer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const timer = await CleanTimer.findById(id);

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    if (!timer.isActive) {
      return res.status(400).json({ error: "Timer is already inactive" });
    }

    // Calculate how many days clean
    const now = new Date();
    const daysClean = differenceInDays(
      toLogicalClock(now),
      toLogicalClock(timer.startedAt),
    );

    // Add to reset history if they were clean for at least a day
    if (daysClean >= 1) {
      timer.resetHistory.push({
        resetAt: now,
        daysClean,
        reason: reason || "",
      });
    }

    // Reset the startedAt time
    timer.startedAt = now;
    await timer.save();

    res.json(timer);
  } catch (err) {
    next(err);
  }
};

export const updateTimer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { habitName, category, icon, color, notes } = req.body;

    const timer = await CleanTimer.findById(id);

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    if (habitName !== undefined) timer.habitName = habitName.trim();
    if (category !== undefined) timer.category = category;
    if (icon !== undefined) timer.icon = icon;
    if (color !== undefined) timer.color = color;
    if (notes !== undefined) timer.notes = notes;

    await timer.save();

    res.json(timer);
  } catch (err) {
    next(err);
  }
};

export const deleteTimer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await CleanTimer.findById(id);

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    // Mark as inactive instead of deleting (for history preservation)
    timer.isActive = false;
    await timer.save();

    res.json({ message: "Timer deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getTimerStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const timer = await CleanTimer.findById(id);

    if (!timer) {
      return res.status(404).json({ error: "Timer not found" });
    }

    const now = new Date();
    const totalDays = differenceInDays(
      toLogicalClock(now),
      toLogicalClock(timer.startedAt),
    );
    const totalHours = differenceInHours(now, timer.startedAt);
    const totalMinutes = differenceInMinutes(now, timer.startedAt);

    // Calculate best streak from history
    const bestStreak =
      timer.resetHistory.length > 0
        ? Math.max(...timer.resetHistory.map((r) => r.daysClean))
        : totalDays;

    // Count total resets
    const totalResets = timer.resetHistory.length;

    res.json({
      timer,
      stats: {
        currentDays: totalDays,
        currentHours: totalHours,
        currentMinutes: totalMinutes,
        bestStreak,
        totalResets,
        averageStreak:
          totalResets > 0
            ? Math.round(
                timer.resetHistory.reduce((sum, r) => sum + r.daysClean, 0) /
                  totalResets,
              )
            : totalDays,
      },
    });
  } catch (err) {
    next(err);
  }
};
