import { format, subDays, parseISO, startOfWeek, addDays } from "date-fns";
import SleepLog from "../models/SleepLog.js";
import SleepStats from "../models/SleepStats.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_SLEEP_TARGET,
  SLEEP_QUALITY_SCORES,
} from "../constants/defaults.js";
import { DAY_START_HOUR, getRequestDayKey } from "../utils/dayBoundary.js";

const getToday = (req) => {
  return getRequestDayKey(req);
};

const isSummaryRequest = (req) =>
  req?.query?.summary === "1" || req?.query?.summary === "true";

const applyTimezoneOffset = (date, timezoneOffsetMinutes) => {
  if (!Number.isFinite(timezoneOffsetMinutes)) return date;
  return new Date(date.getTime() - timezoneOffsetMinutes * 60000);
};

// Helper to determine the date for a sleep log (use wake-up date)
// Use timezone offset from client to keep dates aligned with user's local day
const getSleepDate = (value, timezoneOffsetMinutes) => {
  const date = applyTimezoneOffset(new Date(value), timezoneOffsetMinutes);
  const logicalDate = new Date(date.getTime() - DAY_START_HOUR * 60 * 60000);
  const year = logicalDate.getUTCFullYear();
  const month = String(logicalDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(logicalDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to format time as HH:mm using user's local offset when provided
const formatTime = (date, timezoneOffsetMinutes) => {
  const shifted = applyTimezoneOffset(date, timezoneOffsetMinutes);
  const hours = shifted.getUTCHours().toString().padStart(2, "0");
  const minutes = shifted.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// Helper to convert time string (HH:mm) to minutes since midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
};

// Helper to calculate average time and consistency
const calculateTimeMetrics = (times) => {
  if (times.length === 0)
    return { average: null, consistency: 0, earliest: null, latest: null };

  // Convert times to minutes since midnight for averaging
  const minutesArray = times.map(timeToMinutes);

  // Calculate average
  const avgMinutes = Math.round(
    minutesArray.reduce((a, b) => a + b, 0) / minutesArray.length,
  );
  const avgHours = Math.floor(avgMinutes / 60)
    .toString()
    .padStart(2, "0");
  const avgMins = (avgMinutes % 60).toString().padStart(2, "0");
  const average = `${avgHours}:${avgMins}`;

  // Calculate consistency (0-100) based on standard deviation
  // Lower deviation = higher consistency
  const mean = minutesArray.reduce((a, b) => a + b, 0) / minutesArray.length;
  const squareDiffs = minutesArray.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff =
    squareDiffs.reduce((a, b) => a + b, 0) / minutesArray.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Convert std dev to consistency score (0-100)
  // 0 minutes deviation = 100, 120 minutes (2 hours) = 0
  const consistency = Math.max(
    0,
    Math.min(100, Math.round(100 - (stdDev / 120) * 100)),
  );

  // Find earliest and latest
  const sortedTimes = [...times].sort(
    (a, b) => timeToMinutes(a) - timeToMinutes(b),
  );
  const earliest = sortedTimes[0];
  const latest = sortedTimes[sortedTimes.length - 1];

  return { average, consistency, earliest, latest };
};

const shiftTimeString = (timeStr, timezoneOffsetMinutes) => {
  if (!timeStr || !Number.isFinite(timezoneOffsetMinutes)) return timeStr;
  const minutes = timeToMinutes(timeStr);
  const shifted = (minutes - timezoneOffsetMinutes + 1440) % 1440;
  return minutesToTime(shifted);
};

const normalizeTimeForClient = (
  timeStr,
  statsTimezoneOffsetMinutes,
  requestTimezoneOffsetMinutes,
) => {
  if (!timeStr) return timeStr;
  if (Number.isFinite(statsTimezoneOffsetMinutes)) return timeStr;
  return shiftTimeString(timeStr, requestTimezoneOffsetMinutes);
};

export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday(req);
    const requestTimezoneOffsetMinutes = Number(req?.query?.tzOffset);
    const summary = isSummaryRequest(req);

    const [completedLogs, stats] = await Promise.all([
      summary
        ? Promise.resolve([])
        : SleepLog.find({
            userId: DEFAULT_USER_ID,
            date,
            isComplete: true,
          })
            .sort({ wokeUpAt: -1 })
            .lean(),
      SleepStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
    ]);

    const statsObj = stats?.toObject ? stats.toObject() : stats;
    const responseStats = statsObj
      ? {
          ...statsObj,
          averageBedTime: normalizeTimeForClient(
            statsObj.averageBedTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          averageWakeTime: normalizeTimeForClient(
            statsObj.averageWakeTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          earliestBedTime: normalizeTimeForClient(
            statsObj.earliestBedTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          latestBedTime: normalizeTimeForClient(
            statsObj.latestBedTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          earliestWakeTime: normalizeTimeForClient(
            statsObj.earliestWakeTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          latestWakeTime: normalizeTimeForClient(
            statsObj.latestWakeTime,
            statsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
        }
      : null;

    res.json({
      logs: completedLogs,
      stats: responseStats || {
        totalMinutes: 0,
        targetHours: DEFAULT_SLEEP_TARGET,
        targetMet: false,
        entryCount: 0,
        averageQuality: "none",
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getWeekLogs = async (req, res, next) => {
  try {
    const todayKey = getToday(req);
    const today = parseISO(`${todayKey}T04:00:00Z`);

    // Get the date 7 days ago
    const sevenDaysAgo = subDays(today, 6); // Including today makes it 7 days

    // Format dates using UTC to avoid timezone issues
    const startYear = sevenDaysAgo.getUTCFullYear();
    const startMonth = String(sevenDaysAgo.getUTCMonth() + 1).padStart(2, "0");
    const startDay = String(sevenDaysAgo.getUTCDate()).padStart(2, "0");
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const endYear = today.getUTCFullYear();
    const endMonth = String(today.getUTCMonth() + 1).padStart(2, "0");
    const endDay = String(today.getUTCDate()).padStart(2, "0");
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    // Get all completed logs for the last 7 days
    const logs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date: { $gte: startDate, $lte: endDate },
      isComplete: true,
    }).sort({ wokeUpAt: -1 }); // Sort by wake time, most recent first

    res.json({
      logs,
      startDate,
      endDate,
    });
  } catch (err) {
    next(err);
  }
};

// Morning-first endpoint: log wake-up time and quality.
export const logCompleteSleep = async (req, res, next) => {
  try {
    const { wokeUpAt, quality, notes } = req.body;
    const timezoneOffsetMinutes = Number(req.body.timezoneOffsetMinutes);
    const hasTimezoneOffset = Number.isFinite(timezoneOffsetMinutes);

    if (!wokeUpAt) {
      return res.status(400).json({ error: "Wake time is required" });
    }

    if (!["poor", "fair", "good", "excellent"].includes(quality)) {
      return res
        .status(400)
        .json({ error: "Quality must be poor, fair, good, or excellent" });
    }

    const wokeUpAtDate = new Date(wokeUpAt);
    const date = getSleepDate(wokeUpAt, timezoneOffsetMinutes); // Use wake-up date

    const existingLogForDate = await SleepLog.findOne({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    }).lean();

    if (existingLogForDate) {
      return res.status(409).json({
        error: "Wake-up already logged for this date",
      });
    }

    // Create completed log directly
    const log = await SleepLog.create({
      userId: DEFAULT_USER_ID,
      sleptAt: wokeUpAtDate,
      wokeUpAt: wokeUpAtDate,
      duration: 0,
      quality,
      notes: notes || "",
      date,
      timezoneOffsetMinutes: hasTimezoneOffset ? timezoneOffsetMinutes : null,
      isComplete: true,
    });

    // Get all completed logs for this date to recalculate stats
    const completedLogs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    });

    // Calculate aggregate stats
    const totalMinutes = completedLogs.reduce((sum, l) => sum + l.duration, 0);
    const qualityScoreSum = completedLogs.reduce(
      (sum, l) => sum + SLEEP_QUALITY_SCORES[l.quality],
      0,
    );
    const avgQualityScore = qualityScoreSum / completedLogs.length;

    let averageQuality = "fair";
    if (avgQualityScore >= 1.125) averageQuality = "excellent";
    else if (avgQualityScore >= 0.875) averageQuality = "good";
    else if (avgQualityScore >= 0.625) averageQuality = "fair";
    else averageQuality = "poor";

    // Calculate time metrics
    const bedTimes = completedLogs
      .filter((l) => l.duration > 0)
      .map((l) => formatTime(new Date(l.sleptAt), l.timezoneOffsetMinutes));
    const wakeTimes = completedLogs.map((l) =>
      formatTime(new Date(l.wokeUpAt), l.timezoneOffsetMinutes),
    );

    const bedTimeMetrics = calculateTimeMetrics(bedTimes);
    const wakeTimeMetrics = calculateTimeMetrics(wakeTimes);

    // Get or create stats for this date
    const existingStats = await SleepStats.findOne({
      userId: DEFAULT_USER_ID,
      date,
    });
    const targetHours = existingStats?.targetHours || DEFAULT_SLEEP_TARGET;
    const targetMet = totalMinutes / 60 >= targetHours;

    // Update stats
    const statsTimezoneOffsetMinutes =
      completedLogs.find((l) => Number.isFinite(l.timezoneOffsetMinutes))
        ?.timezoneOffsetMinutes ??
      (hasTimezoneOffset ? timezoneOffsetMinutes : null);

    const statsUpdate = {
      totalMinutes,
      entryCount: completedLogs.length,
      averageQuality,
      targetMet,
      averageBedTime: bedTimeMetrics.average,
      bedtimeConsistency: bedTimeMetrics.consistency,
      earliestBedTime: bedTimeMetrics.earliest,
      latestBedTime: bedTimeMetrics.latest,
      averageWakeTime: wakeTimeMetrics.average,
      wakeTimeConsistency: wakeTimeMetrics.consistency,
      earliestWakeTime: wakeTimeMetrics.earliest,
      latestWakeTime: wakeTimeMetrics.latest,
      updatedAt: new Date(),
    };

    if (Number.isFinite(statsTimezoneOffsetMinutes)) {
      statsUpdate.timezoneOffsetMinutes = statsTimezoneOffsetMinutes;
    }

    const stats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: statsUpdate,
        $setOnInsert: { targetHours: DEFAULT_SLEEP_TARGET },
      },
      { upsert: true, new: true },
    );

    res.status(201).json({ log, stats });
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

    await SleepLog.deleteOne({ _id: id });

    // Recalculate stats for remaining logs on the same date.
    const remainingLogs = await SleepLog.find({
      userId: DEFAULT_USER_ID,
      date: log.date,
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
            targetMet: false,
            averageBedTime: null,
            bedtimeConsistency: 0,
            earliestBedTime: null,
            latestBedTime: null,
            averageWakeTime: null,
            wakeTimeConsistency: 0,
            earliestWakeTime: null,
            latestWakeTime: null,
            timezoneOffsetMinutes: null,
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
    const targetMet = totalMinutes / 60 >= targetHours;

    // Calculate time metrics from remaining logs
    const bedTimes = remainingLogs
      .filter((l) => l.duration > 0)
      .map((l) => formatTime(new Date(l.sleptAt), l.timezoneOffsetMinutes));
    const wakeTimes = remainingLogs.map((l) =>
      formatTime(new Date(l.wokeUpAt), l.timezoneOffsetMinutes),
    );

    const bedTimeMetrics = calculateTimeMetrics(bedTimes);
    const wakeTimeMetrics = calculateTimeMetrics(wakeTimes);

    const statsTimezoneOffsetMinutes =
      remainingLogs.find((l) => Number.isFinite(l.timezoneOffsetMinutes))
        ?.timezoneOffsetMinutes ?? null;

    const statsUpdate = {
      totalMinutes,
      entryCount: remainingLogs.length,
      averageQuality,
      targetMet,
      averageBedTime: bedTimeMetrics.average,
      bedtimeConsistency: bedTimeMetrics.consistency,
      earliestBedTime: bedTimeMetrics.earliest,
      latestBedTime: bedTimeMetrics.latest,
      averageWakeTime: wakeTimeMetrics.average,
      wakeTimeConsistency: wakeTimeMetrics.consistency,
      earliestWakeTime: wakeTimeMetrics.earliest,
      latestWakeTime: wakeTimeMetrics.latest,
      updatedAt: new Date(),
    };

    if (Number.isFinite(statsTimezoneOffsetMinutes)) {
      statsUpdate.timezoneOffsetMinutes = statsTimezoneOffsetMinutes;
    }

    const updatedStats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date: log.date },
      {
        $set: statsUpdate,
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
    const requestTimezoneOffsetMinutes = Number(req.query.tzOffset);
    const today = parseISO(`${getToday(req)}T04:00:00Z`);
    const monday = startOfWeek(today, { weekStartsOn: 1 });

    // Use UTC to format dates to avoid timezone issues
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, "0");
      const day = String(date.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    });

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
        dayLabel: format(parseISO(`${date}T00:00:00Z`), "EEE"),
        totalMinutes: existing?.totalMinutes || 0,
        totalHours: existing ? (existing.totalMinutes / 60).toFixed(1) : 0,
        targetHours: existing?.targetHours || DEFAULT_SLEEP_TARGET,
        targetMet: existing?.targetMet || false,
        averageQuality: existing?.averageQuality || "none",
        entryCount: existing?.entryCount || 0,
        averageBedTime: normalizeTimeForClient(
          existing?.averageBedTime || null,
          existing?.timezoneOffsetMinutes,
          requestTimezoneOffsetMinutes,
        ),
        averageWakeTime: normalizeTimeForClient(
          existing?.averageWakeTime || null,
          existing?.timezoneOffsetMinutes,
          requestTimezoneOffsetMinutes,
        ),
        bedtimeConsistency: existing?.bedtimeConsistency || 0,
        wakeTimeConsistency: existing?.wakeTimeConsistency || 0,
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
    const requestTimezoneOffsetMinutes = Number(req.query.tzOffset);

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

    // Use UTC to construct dates to avoid timezone issues
    const startYear = startOfMonth.getFullYear();
    const startMonth = String(startOfMonth.getMonth() + 1).padStart(2, "0");
    const startDay = String(startOfMonth.getDate()).padStart(2, "0");
    const startDate = `${startYear}-${startMonth}-${startDay}`;

    const endYear = endOfMonth.getFullYear();
    const endMonth = String(endOfMonth.getMonth() + 1).padStart(2, "0");
    const endDay = String(endOfMonth.getDate()).padStart(2, "0");
    const endDate = `${endYear}-${endMonth}-${endDay}`;

    const stats = await SleepStats.find({
      userId: DEFAULT_USER_ID,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Create map of all days in month
    const daysInMonth = endOfMonth.getDate();
    const statsMap = new Map(stats.map((s) => [s.date, s]));

    const monthData = Array.from({ length: daysInMonth }, (_, i) => {
      // Use UTC date construction to avoid timezone issues
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, "0");
      const day = String(i + 1).padStart(2, "0");
      const date = `${year}-${month}-${day}`;
      const existing = statsMap.get(date);
      return {
        date,
        day: i + 1,
        totalMinutes: existing?.totalMinutes || 0,
        totalHours: existing ? (existing.totalMinutes / 60).toFixed(1) : 0,
        targetHours: existing?.targetHours || DEFAULT_SLEEP_TARGET,
        targetMet: existing?.targetMet || false,
        averageQuality: existing?.averageQuality || "none",
        entryCount: existing?.entryCount || 0,
        averageBedTime: normalizeTimeForClient(
          existing?.averageBedTime || null,
          existing?.timezoneOffsetMinutes,
          requestTimezoneOffsetMinutes,
        ),
        averageWakeTime: normalizeTimeForClient(
          existing?.averageWakeTime || null,
          existing?.timezoneOffsetMinutes,
          requestTimezoneOffsetMinutes,
        ),
        bedtimeConsistency: existing?.bedtimeConsistency || 0,
        wakeTimeConsistency: existing?.wakeTimeConsistency || 0,
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
    const today = parseISO(`${getToday(req)}T04:00:00Z`);
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
    // Helper to format date as yyyy-MM-dd using UTC
    const formatDateUTC = (d) => {
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // If today hasn't been met yet, start from yesterday
    if (!metDates.has(formatDateUTC(checkDate))) {
      checkDate = subDays(today, 1);
    }
    while (metDates.has(formatDateUTC(checkDate))) {
      current++;
      checkDate = subDays(checkDate, 1);
    }

    // Longest streak from available data
    let longest = 0;
    let tempStreak = 0;
    for (let i = 89; i >= 0; i--) {
      const d = formatDateUTC(subDays(today, i));
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

    const date = getToday(req);

    const stats = await SleepStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: { targetHours, updatedAt: new Date() },
        $setOnInsert: {
          totalMinutes: 0,
          entryCount: 0,
          averageQuality: "none",
        },
      },
      { upsert: true, new: true },
    );

    stats.targetMet = stats.totalMinutes / 60 >= stats.targetHours;

    await stats.save();

    res.json({ targetHours: stats.targetHours, stats });
  } catch (err) {
    next(err);
  }
};
