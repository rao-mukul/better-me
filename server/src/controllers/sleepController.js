import { format, subDays, parseISO, differenceInMinutes } from "date-fns";
import SleepLog from "../models/SleepLog.js";
import SleepStats from "../models/SleepStats.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_SLEEP_TARGET,
  SLEEP_QUALITY_SCORES,
} from "../constants/defaults.js";

const getToday = () => format(new Date(), "yyyy-MM-dd");

// Calculate sleep score (0-100) based on duration and quality
const calculateSleepScore = (minutes, targetHours, quality) => {
  const targetMinutes = targetHours * 60;
  const durationScore = Math.min((minutes / targetMinutes) * 70, 70); // Max 70 points for duration
  const qualityScore = SLEEP_QUALITY_SCORES[quality] * 30; // Max ~37 points for quality
  return Math.round(Math.min(durationScore + qualityScore, 100));
};

// Helper to determine the date for a sleep log (use wake-up date)
const getSleepDate = (wokeUpAt) => format(new Date(wokeUpAt), "yyyy-MM-dd");

export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday();

    // Get completed logs for today
    const completedLogs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    }).sort({ wokeUpAt: -1 });

    // Check for active (incomplete) sleep log
    const activeSleepLog = await SleepLog.findOne({
      userId: DEFAULT_USER_ID,
      isComplete: false,
    }).sort({ sleptAt: -1 });

    const stats = await SleepStats.findOne({ userId: DEFAULT_USER_ID, date });

    res.json({
      logs: completedLogs,
      activeSleepLog: activeSleepLog || null,
      stats: stats || {
        totalMinutes: 0,
        targetHours: DEFAULT_SLEEP_TARGET,
        targetMet: false,
        entryCount: 0,
        averageQuality: "none",
        sleepScore: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const startSleep = async (req, res, next) => {
  try {
    const { sleptAt, notes } = req.body;

    if (!sleptAt) {
      return res.status(400).json({ error: "Sleep time is required" });
    }

    // Check if there's already an active sleep log
    const existingActiveSleep = await SleepLog.findOne({
      userId: DEFAULT_USER_ID,
      isComplete: false,
    });

    if (existingActiveSleep) {
      return res.status(400).json({
        error: "You already have an active sleep log. Complete it first.",
      });
    }

    const sleptAtDate = new Date(sleptAt);

    const log = await SleepLog.create({
      userId: DEFAULT_USER_ID,
      sleptAt: sleptAtDate,
      notes: notes || "",
      date: format(sleptAtDate, "yyyy-MM-dd"), // Temporary date, will update when completing
      isComplete: false,
    });

    res.status(201).json({ log });
  } catch (err) {
    next(err);
  }
};

export const completeSleep = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { wokeUpAt, quality, notes } = req.body;

    if (!wokeUpAt) {
      return res.status(400).json({ error: "Wake time is required" });
    }

    if (!["poor", "fair", "good", "excellent"].includes(quality)) {
      return res
        .status(400)
        .json({ error: "Quality must be poor, fair, good, or excellent" });
    }

    const log = await SleepLog.findById(id);

    if (!log) {
      return res.status(404).json({ error: "Sleep log not found" });
    }

    if (log.isComplete) {
      return res.status(400).json({ error: "Sleep log already completed" });
    }

    const wokeUpAtDate = new Date(wokeUpAt);

    if (wokeUpAtDate <= log.sleptAt) {
      return res
        .status(400)
        .json({ error: "Wake time must be after sleep time" });
    }

    const duration = differenceInMinutes(wokeUpAtDate, log.sleptAt);

    if (duration < 1 || duration > 1440) {
      return res.status(400).json({
        error: "Sleep duration must be between 1 minute and 24 hours",
      });
    }

    // Update log with completion data
    const date = getSleepDate(wokeUpAt);
    log.wokeUpAt = wokeUpAtDate;
    log.duration = duration;
    log.quality = quality;
    log.date = date; // Update to wake-up date
    log.isComplete = true;
    if (notes) log.notes = notes;
    await log.save();

    // Fetch current stats to calculate new average
    let stats = await SleepStats.findOne({ userId: DEFAULT_USER_ID, date });

    const targetHours = stats?.targetHours || DEFAULT_SLEEP_TARGET;
    const newTotalMinutes = (stats?.totalMinutes || 0) + duration;
    const newEntryCount = (stats?.entryCount || 0) + 1;

    // Calculate average quality from all completed logs for this date
    const completedLogs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    });
    const qualityValues = completedLogs.map((l) => l.quality);
    const qualityScoreSum = qualityValues.reduce(
      (sum, q) => sum + SLEEP_QUALITY_SCORES[q],
      0,
    );
    const avgQualityScore = qualityScoreSum / qualityValues.length;

    // Map average score back to quality category
    let averageQuality = "fair";
    if (avgQualityScore >= 1.125) averageQuality = "excellent";
    else if (avgQualityScore >= 0.875) averageQuality = "good";
    else if (avgQualityScore >= 0.625) averageQuality = "fair";
    else averageQuality = "poor";

    const sleepScore = calculateSleepScore(
      newTotalMinutes,
      targetHours,
      averageQuality,
    );
    const targetMet = newTotalMinutes / 60 >= targetHours;

    // Atomic upsert
    stats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: {
          totalMinutes: newTotalMinutes,
          entryCount: newEntryCount,
          averageQuality,
          sleepScore,
          targetMet,
          updatedAt: new Date(),
        },
        $setOnInsert: { targetHours: DEFAULT_SLEEP_TARGET },
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ log, stats });
  } catch (err) {
    next(err);
  }
};

export const deleteSleepLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await SleepLog.findById(id);

    if (!log) {
      return res.status(404).json({ error: "Sleep log not found" });
    }

    // If log is not complete, just delete it (no stats to update)
    if (!log.isComplete) {
      await SleepLog.deleteOne({ _id: id });
      return res.json({ message: "Incomplete sleep log deleted" });
    }

    await SleepLog.deleteOne({ _id: id });

    // Recalculate stats for completed logs only
    const remainingLogs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date: log.date,
      isComplete: true,
    });

    if (remainingLogs.length === 0) {
      // No logs left, reset stats
      const stats = await SleepStats.findOneAndUpdate(
        { userId: DEFAULT_USER_ID, date: log.date },
        {
          $set: {
            totalMinutes: 0,
            entryCount: 0,
            averageQuality: "none",
            sleepScore: 0,
            targetMet: false,
            updatedAt: new Date(),
          },
        },
        { new: true },
      );

      return res.json({
        stats: stats || {
          totalMinutes: 0,
          targetHours: DEFAULT_SLEEP_TARGET,
          targetMet: false,
          entryCount: 0,
          averageQuality: "none",
          sleepScore: 0,
        },
      });
    }

    // Recalculate from remaining completed logs
    const totalMinutes = remainingLogs.reduce((sum, l) => sum + l.duration, 0);
    const qualityScoreSum = remainingLogs.reduce(
      (sum, l) => sum + SLEEP_QUALITY_SCORES[l.quality],
      0,
    );
    const avgQualityScore = qualityScoreSum / remainingLogs.length;

    let averageQuality = "fair";
    if (avgQualityScore >= 1.125) averageQuality = "excellent";
    else if (avgQualityScore >= 0.875) averageQuality = "good";
    else if (avgQualityScore >= 0.625) averageQuality = "fair";
    else averageQuality = "poor";

    const stats = await SleepStats.findOne({
      userId: DEFAULT_USER_ID,
      date: log.date,
    });
    const targetHours = stats?.targetHours || DEFAULT_SLEEP_TARGET;
    const sleepScore = calculateSleepScore(
      totalMinutes,
      targetHours,
      averageQuality,
    );
    const targetMet = totalMinutes / 60 >= targetHours;

    const updatedStats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date: log.date },
      {
        $set: {
          totalMinutes,
          entryCount: remainingLogs.length,
          averageQuality,
          sleepScore,
          targetMet,
          updatedAt: new Date(),
        },
      },
      { new: true },
    );

    res.json({ stats: updatedStats });
  } catch (err) {
    next(err);
  }
};

export const getWeekData = async (req, res, next) => {
  try {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(subDays(today, 6 - i), "yyyy-MM-dd"),
    );

    const stats = await SleepStats.find({
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
        totalMinutes: existing?.totalMinutes || 0,
        totalHours: existing ? (existing.totalMinutes / 60).toFixed(1) : 0,
        targetHours: existing?.targetHours || DEFAULT_SLEEP_TARGET,
        targetMet: existing?.targetMet || false,
        averageQuality: existing?.averageQuality || "none",
        sleepScore: existing?.sleepScore || 0,
        entryCount: existing?.entryCount || 0,
      };
    });

    res.json(weekData);
  } catch (err) {
    next(err);
  }
};

export const getStreak = async (req, res, next) => {
  try {
    // Get last 90 days of stats to compute streaks
    const today = new Date();
    const stats = await SleepStats.find({
      userId: DEFAULT_USER_ID,
      targetMet: true,
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

export const updateTarget = async (req, res, next) => {
  try {
    const { targetHours } = req.body;

    if (!targetHours || targetHours < 1 || targetHours > 24) {
      return res
        .status(400)
        .json({ error: "Target must be between 1 and 24 hours" });
    }

    const date = getToday();

    const stats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: { targetHours, updatedAt: new Date() },
        $setOnInsert: {
          totalMinutes: 0,
          entryCount: 0,
          averageQuality: "none",
          sleepScore: 0,
        },
      },
      { upsert: true, new: true },
    );

    stats.targetMet = stats.totalMinutes / 60 >= stats.targetHours;

    // Recalculate sleep score with new target
    if (stats.entryCount > 0) {
      stats.sleepScore = calculateSleepScore(
        stats.totalMinutes,
        targetHours,
        stats.averageQuality,
      );
    }

    await stats.save();

    res.json({ targetHours: stats.targetHours, stats });
  } catch (err) {
    next(err);
  }
};
