import { format, startOfWeek, addDays, parseISO } from "date-fns";
import DailyStats from "../models/DailyStats.js";
import SleepLog from "../models/SleepLog.js";
import SleepStats from "../models/SleepStats.js";
import GymLog from "../models/GymLog.js";
import GymStats from "../models/GymStats.js";
import DietLog from "../models/DietLog.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_GOAL,
  DEFAULT_SLEEP_TARGET,
} from "../constants/defaults.js";

const getToday = (req) => req?.query?.date || format(new Date(), "yyyy-MM-dd");

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

export const getTodayOverview = async (req, res, next) => {
  try {
    const date = getToday(req);
    const requestTimezoneOffsetMinutes = Number(req?.query?.tzOffset);

    const baseDate = parseISO(`${date}T00:00:00`);
    const monday = startOfWeek(baseDate, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "yyyy-MM-dd"),
    );

    const [
      waterStats,
      sleepStats,
      activeSleepLog,
      gymLog,
      gymStats,
      dietTotalsAgg,
      gymWeekHistory,
    ] = await Promise.all([
      DailyStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
      SleepStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
      SleepLog.findOne({
        userId: DEFAULT_USER_ID,
        isComplete: false,
      })
        .sort({ sleptAt: -1 })
        .lean(),
      GymLog.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
      GymStats.findOne({ userId: DEFAULT_USER_ID, date }).lean(),
      DietLog.aggregate([
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
      ]),
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

    const dietTotals = dietTotalsAgg[0] || {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      count: 0,
    };

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
        activeSleepLog: activeSleepLog || null,
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
      },
    });
  } catch (err) {
    next(err);
  }
};

export default {
  getTodayOverview,
};
