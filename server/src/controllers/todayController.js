import { format, startOfWeek, addDays, parseISO } from "date-fns";
import DailyStats from "../models/DailyStats.js";
import SleepStats from "../models/SleepStats.js";
import GymLog from "../models/GymLog.js";
import GymStats from "../models/GymStats.js";
import DietLog from "../models/DietLog.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_GOAL,
  DEFAULT_SLEEP_TARGET,
} from "../constants/defaults.js";
import { getRequestDayKey, parseDayKey } from "../utils/dayBoundary.js";

const getToday = (req) => getRequestDayKey(req);

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

const minutesToClockTime = (minutes) => {
  const safeMinutes = ((minutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
  const mins = String(safeMinutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
};

const computeMealTimingInsights = (logs = []) => {
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

  const mealTimesMinutes = sortedLogs.map((log) => {
    const eatenAt = new Date(log.eatenAt);
    return eatenAt.getHours() * 60 + eatenAt.getMinutes();
  });

  const firstAfter4 = mealTimesMinutes.find((m) => m >= 4 * 60);
  const firstMealMinutes = firstAfter4 ?? mealTimesMinutes[0];
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

  const feedingWindowMinutes =
    mealTimesMinutes.length > 1
      ? Math.max(0, lastMealMinutes - firstMealMinutes)
      : 0;

  return {
    mealCount: sortedLogs.length,
    firstMealTime: minutesToClockTime(firstMealMinutes),
    lastMealTime: minutesToClockTime(lastMealMinutes),
    averageGapMinutes,
    shortestGapMinutes: gaps.length ? Math.min(...gaps) : null,
    longestGapMinutes: gaps.length ? Math.max(...gaps) : null,
    feedingWindowMinutes,
    overnightGapMinutes: Math.max(0, 24 * 60 - feedingWindowMinutes),
  };
};

export const getTodayOverview = async (req, res, next) => {
  try {
    const date = getToday(req);
    const requestTimezoneOffsetMinutes = Number(req?.query?.tzOffset);

    const baseDate = parseDayKey(date);
    const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "yyyy-MM-dd"),
    );

    const [waterStats, sleepStats, gymLog, gymStats, dietLogs, gymWeekHistory] =
      await Promise.all([
        DailyStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
        SleepStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
        GymLog.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
        GymStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
        DietLog.find({ userId: DEFAULT_USER_ID, date })
          .sort({ eatenAt: -1 })
          .lean(),
        GymLog.find({
          userId: DEFAULT_USER_ID,
          date: { $in: weekDates },
        })
          .sort({ date: 1 })
          .lean(),
      ]);

    const sleepStatsObj = sleepStats || null;
    const normalizedSleepStats = sleepStatsObj
      ? {
          ...sleepStatsObj,
          averageBedTime: normalizeTimeForClient(
            sleepStatsObj.averageBedTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          averageWakeTime: normalizeTimeForClient(
            sleepStatsObj.averageWakeTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          earliestBedTime: normalizeTimeForClient(
            sleepStatsObj.earliestBedTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          latestBedTime: normalizeTimeForClient(
            sleepStatsObj.latestBedTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          earliestWakeTime: normalizeTimeForClient(
            sleepStatsObj.earliestWakeTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
          latestWakeTime: normalizeTimeForClient(
            sleepStatsObj.latestWakeTime,
            sleepStatsObj.timezoneOffsetMinutes,
            requestTimezoneOffsetMinutes,
          ),
        }
      : null;

    const dietTotals = {
      count: (dietLogs || []).length,
    };

    const dietTiming = computeMealTimingInsights(dietLogs || []);

    res.json({
      date,
      water: {
        logs: [],
        stats: waterStats || {
          totalMl: 0,
          goal: DEFAULT_GOAL,
          goalMet: false,
          entryCount: 0,
        },
      },
      sleep: {
        logs: [],
        stats: normalizedSleepStats || {
          totalMinutes: 0,
          targetHours: DEFAULT_SLEEP_TARGET,
          targetMet: false,
          entryCount: 0,
          averageQuality: "none",
        },
      },
      gym: {
        log: gymLog || null,
        stats: gymStats || {
          totalWorkouts: 0,
          totalMinutes: 0,
          muscleGroupsWorked: [],
          totalExercises: 0,
          averageIntensity: "none",
        },
        weekHistory: gymWeekHistory || [],
      },
      diet: {
        logs: [],
        totals: dietTotals,
        timing: dietTiming,
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getTodayOverview,
};
