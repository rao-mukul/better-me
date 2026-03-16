import { format, startOfWeek, addDays } from "date-fns";
import GymLog from "../models/GymLog.js";
import GymExercise from "../models/GymExercise.js";
import GymProgram from "../models/GymProgram.js";
import GymStats from "../models/GymStats.js";
import { DEFAULT_USER_ID } from "../constants/defaults.js";

const getToday = (req) => {
  // Accept date from client to handle timezone correctly
  return req?.query?.date || format(new Date(), "yyyy-MM-dd");
};

// Get all exercises for a user (including defaults and custom)
export const getExercises = async (req, res, next) => {
  try {
    const exercises = await GymExercise.find({
      $or: [{ userId: DEFAULT_USER_ID }, { userId: "default" }],
    }).sort({ muscleGroup: 1, name: 1 });

    res.json(exercises);
  } catch (err) {
    next(err);
  }
};

// Add a new custom exercise
export const addExercise = async (req, res, next) => {
  try {
    const { name, muscleGroup } = req.body;

    const exercise = await GymExercise.create({
      userId: DEFAULT_USER_ID,
      name,
      muscleGroup,
      isCustom: true,
    });

    res.status(201).json(exercise);
  } catch (err) {
    next(err);
  }
};

// Delete an exercise (custom or seeded)
export const deleteExercise = async (req, res, next) => {
  try {
    const { id } = req.params;

    const exercise = await GymExercise.findOne({
      _id: id,
      $or: [{ userId: DEFAULT_USER_ID }, { userId: "default" }],
    });

    if (!exercise) {
      return res.status(404).json({ error: "Exercise not found" });
    }

    await GymExercise.deleteOne({ _id: id });

    res.json({ message: "Exercise deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Get user's training program
export const getProgram = async (req, res, next) => {
  try {
    let program = await GymProgram.findOne({ userId: DEFAULT_USER_ID });

    if (!program) {
      // Create default empty program
      program = await GymProgram.create({
        userId: DEFAULT_USER_ID,
        workoutTypes: {
          chestTriceps: { primary: [], secondary: [] },
          tricepsChest: { primary: [], secondary: [] },
          backBiceps: { primary: [], secondary: [] },
          bicepsBack: { primary: [], secondary: [] },
          legsShoulders: { primary: [], secondary: [] },
          shouldersLegs: { primary: [], secondary: [] },
        },
      });
    }

    res.json(program);
  } catch (err) {
    next(err);
  }
};

// Update user's training program
export const updateProgram = async (req, res, next) => {
  try {
    const { workoutTypes } = req.body;

    let program = await GymProgram.findOne({ userId: DEFAULT_USER_ID });

    if (!program) {
      program = await GymProgram.create({
        userId: DEFAULT_USER_ID,
        workoutTypes,
      });
    } else {
      program.workoutTypes = workoutTypes;
      await program.save();
    }

    res.json(program);
  } catch (err) {
    next(err);
  }
};

// Get this week's workout history (for smart defaults)
export const getWeekHistory = async (req, res, next) => {
  try {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "yyyy-MM-dd"),
    );

    const logs = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date: { $in: dates },
    }).sort({ date: 1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};

// Get week data for stats page
export const getWeekData = async (req, res, next) => {
  try {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(monday, i);
      return {
        date: format(date, "yyyy-MM-dd"),
        dayLabel: format(date, "EEE"),
      };
    });

    const stats = await GymStats.find({
      userId: DEFAULT_USER_ID,
      date: { $in: dates.map((d) => d.date) },
    });

    const weekData = dates.map((dateInfo) => {
      const stat = stats.find((s) => s.date === dateInfo.date) || null;
      return {
        date: dateInfo.date,
        dayLabel: dateInfo.dayLabel,
        totalWorkouts: stat?.totalWorkouts || 0,
        totalMinutes: stat?.totalMinutes || 0,
        muscleGroupsWorked: stat?.muscleGroupsWorked || [],
        totalExercises: stat?.totalExercises || 0,
      };
    });

    res.json(weekData);
  } catch (err) {
    next(err);
  }
};

// Get streak data
export const getStreak = async (req, res, next) => {
  try {
    const today = new Date();
    const monday = startOfWeek(today, { weekStartsOn: 1 });

    // Get this week's workouts
    const weekDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(monday, i), "yyyy-MM-dd"),
    );

    const thisWeekLogs = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date: { $in: weekDates },
    });

    // Get all logs to calculate streaks
    const allLogs = await GymLog.find({
      userId: DEFAULT_USER_ID,
    }).sort({ date: -1 });

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks (consecutive weeks with at least 1 workout)
    const weeklyWorkouts = {};
    allLogs.forEach((log) => {
      const logDate = new Date(log.date);
      const weekStart = format(
        startOfWeek(logDate, { weekStartsOn: 1 }),
        "yyyy-MM-dd",
      );
      weeklyWorkouts[weekStart] = (weeklyWorkouts[weekStart] || 0) + 1;
    });

    const weeks = Object.keys(weeklyWorkouts).sort().reverse();
    const currentWeekStart = format(monday, "yyyy-MM-dd");

    // Calculate current streak
    let checkDate = new Date(currentWeekStart);
    while (true) {
      const weekKey = format(checkDate, "yyyy-MM-dd");
      if (weeklyWorkouts[weekKey] && weeklyWorkouts[weekKey] > 0) {
        currentStreak++;
        checkDate = addDays(checkDate, -7);
      } else {
        break;
      }
    }

    // Calculate longest streak
    for (let i = 0; i < weeks.length; i++) {
      if (weeklyWorkouts[weeks[i]] > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    res.json({
      current: currentStreak,
      longest: longestStreak,
      thisWeek: thisWeekLogs.length,
    });
  } catch (err) {
    next(err);
  }
};

// Get comprehensive insights for growth tracking
export const getInsights = async (req, res, next) => {
  try {
    const today = new Date();
    const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
    const lastMonday = addDays(thisMonday, -7);

    // Get last 4 weeks of data
    const fourWeeksAgo = addDays(thisMonday, -28);
    const allLogs = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date: { $gte: format(fourWeeksAgo, "yyyy-MM-dd") },
    }).sort({ date: -1 });

    // This week's logs
    const thisWeekDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(thisMonday, i), "yyyy-MM-dd"),
    );
    const thisWeekLogs = allLogs.filter((log) =>
      thisWeekDates.includes(log.date),
    );

    // Last week's logs
    const lastWeekDates = Array.from({ length: 7 }, (_, i) =>
      format(addDays(lastMonday, i), "yyyy-MM-dd"),
    );
    const lastWeekLogs = allLogs.filter((log) =>
      lastWeekDates.includes(log.date),
    );

    // Muscle group balance (this week)
    const muscleGroupCount = {};
    thisWeekLogs.forEach((log) => {
      muscleGroupCount[log.primaryMuscle] =
        (muscleGroupCount[log.primaryMuscle] || 0) + 1;
      muscleGroupCount[log.secondaryMuscle] =
        (muscleGroupCount[log.secondaryMuscle] || 0) + 1;
    });

    // Workout type distribution (last 4 weeks)
    const workoutTypeCount = {};
    allLogs.forEach((log) => {
      workoutTypeCount[log.workoutType] =
        (workoutTypeCount[log.workoutType] || 0) + 1;
    });

    // Exercise variety (unique exercises used this week)
    const uniqueExercises = new Set();
    thisWeekLogs.forEach((log) => {
      log.primaryExercises.forEach((ex) => uniqueExercises.add(ex));
      log.secondaryExercises.forEach((ex) => uniqueExercises.add(ex));
    });

    // Average exercises per workout
    const totalExercises = thisWeekLogs.reduce(
      (sum, log) =>
        sum + log.primaryExercises.length + log.secondaryExercises.length,
      0,
    );
    const avgExercisesPerWorkout =
      thisWeekLogs.length > 0
        ? Math.round((totalExercises / thisWeekLogs.length) * 10) / 10
        : 0;

    // Weekly comparison
    const weekOverWeekChange =
      lastWeekLogs.length > 0
        ? Math.round(
            ((thisWeekLogs.length - lastWeekLogs.length) /
              lastWeekLogs.length) *
              100,
          )
        : thisWeekLogs.length > 0
          ? 100
          : 0;

    // Most trained muscle group
    const muscleGroupEntries = Object.entries(muscleGroupCount);
    const mostTrainedMuscle =
      muscleGroupEntries.length > 0
        ? muscleGroupEntries.reduce((max, entry) =>
            entry[1] > max[1] ? entry : max,
          )[0]
        : null;

    // Least trained muscle group (find muscle group with lowest count or 0)
    const allMuscles = [
      "chest",
      "triceps",
      "back",
      "biceps",
      "legs",
      "shoulders",
    ];
    const leastTrainedMuscle = allMuscles.reduce((min, muscle) => {
      const count = muscleGroupCount[muscle] || 0;
      const minCount = muscleGroupCount[min] || 0;
      return count < minCount ? muscle : min;
    });

    // Last 5 workouts summary
    const recentWorkouts = allLogs.slice(0, 5).map((log) => ({
      date: log.date,
      workoutType: log.workoutType,
      totalExercises:
        log.primaryExercises.length + log.secondaryExercises.length,
      primaryMuscle: log.primaryMuscle,
      secondaryMuscle: log.secondaryMuscle,
    }));

    res.json({
      thisWeek: {
        totalWorkouts: thisWeekLogs.length,
        totalExercises,
        uniqueExercises: uniqueExercises.size,
        avgExercisesPerWorkout,
        muscleGroupBalance: muscleGroupCount,
        mostTrainedMuscle,
        leastTrainedMuscle,
      },
      lastWeek: {
        totalWorkouts: lastWeekLogs.length,
      },
      comparison: {
        weekOverWeekChange,
      },
      last4Weeks: {
        totalWorkouts: allLogs.length,
        workoutTypeDistribution: workoutTypeCount,
      },
      recentWorkouts,
    });
  } catch (err) {
    next(err);
  }
};

// Log a new workout
export const logWorkout = async (req, res, next) => {
  try {
    const {
      workoutType,
      primaryMuscle,
      secondaryMuscle,
      primaryExercises,
      secondaryExercises,
      duration,
      notes,
    } = req.body;

    const date = getToday(req);

    // Check if workout already logged today
    const existingLog = await GymLog.findOne({
      userId: DEFAULT_USER_ID,
      date,
    });

    if (existingLog) {
      return res.status(400).json({
        error:
          "Workout already logged for today. Delete it first to log a new one.",
      });
    }

    const log = await GymLog.create({
      userId: DEFAULT_USER_ID,
      date,
      workoutType,
      primaryMuscle,
      secondaryMuscle,
      primaryExercises,
      secondaryExercises,
      duration,
      notes,
    });

    // Update stats
    await updateGymStats(date);

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

// Get today's workout log
export const getTodayLog = async (req, res, next) => {
  try {
    const date = getToday(req);

    const [log, stats] = await Promise.all([
      GymLog.findOne({
        userId: DEFAULT_USER_ID,
        date,
      }).lean(),
      GymStats.findOne({
        userId: DEFAULT_USER_ID,
        date,
      }).lean(),
    ]);

    res.json({
      log: log || null,
      stats: stats || {
        totalWorkouts: 0,
        totalMinutes: 0,
        muscleGroupsWorked: [],
        totalExercises: 0,
        averageIntensity: "none",
      },
    });
  } catch (err) {
    next(err);
  }
};

// Delete a workout log
export const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;

    const log = await GymLog.findOneAndDelete({
      _id: id,
      userId: DEFAULT_USER_ID,
    });

    if (!log) {
      return res.status(404).json({ error: "Workout not found" });
    }

    // Update stats
    await updateGymStats(log.date);

    res.json({ message: "Workout deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Helper function to update stats
async function updateGymStats(date) {
  const log = await GymLog.findOne({
    userId: DEFAULT_USER_ID,
    date,
  });

  if (!log) {
    // No workout logged, delete stats if exist
    await GymStats.deleteOne({
      userId: DEFAULT_USER_ID,
      date,
    });
    return;
  }

  const muscleGroupsWorked = [log.primaryMuscle, log.secondaryMuscle].filter(
    Boolean,
  );
  const totalExercises =
    log.primaryExercises.length + log.secondaryExercises.length;

  await GymStats.findOneAndUpdate(
    {
      userId: DEFAULT_USER_ID,
      date,
    },
    {
      totalWorkouts: 1,
      totalMinutes: log.duration || 0,
      muscleGroupsWorked,
      totalExercises,
      averageIntensity: "moderate", // Can be enhanced later
    },
    { upsert: true, new: true },
  );
}

// Seed default exercises
export const seedDefaultExercises = async (req, res, next) => {
  try {
    // Check if already seeded
    const existingCount = await GymExercise.countDocuments({
      userId: "default",
    });
    if (existingCount > 0) {
      return res.json({ message: "Default exercises already seeded" });
    }

    const defaultExercises = [
      // Chest exercises
      { name: "Barbell Bench Press", muscleGroup: "chest" },
      { name: "Dumbbell Bench Press", muscleGroup: "chest" },
      { name: "Incline Barbell Bench Press", muscleGroup: "chest" },
      { name: "Incline Dumbbell Press", muscleGroup: "chest" },
      { name: "Decline Bench Press", muscleGroup: "chest" },
      { name: "Chest Dips", muscleGroup: "chest" },
      { name: "Cable Flyes", muscleGroup: "chest" },
      { name: "Dumbbell Flyes", muscleGroup: "chest" },
      { name: "Push-ups", muscleGroup: "chest" },
      { name: "Machine Chest Press", muscleGroup: "chest" },
      { name: "Pec Deck", muscleGroup: "chest" },

      // Triceps exercises
      { name: "Tricep Dips", muscleGroup: "triceps" },
      { name: "Close-Grip Bench Press", muscleGroup: "triceps" },
      { name: "Tricep Pushdown", muscleGroup: "triceps" },
      { name: "Overhead Tricep Extension", muscleGroup: "triceps" },
      { name: "Skull Crushers", muscleGroup: "triceps" },
      { name: "Dumbbell Kickbacks", muscleGroup: "triceps" },
      { name: "Diamond Push-ups", muscleGroup: "triceps" },
      { name: "Cable Overhead Extension", muscleGroup: "triceps" },

      // Back exercises
      { name: "Deadlift", muscleGroup: "back" },
      { name: "Pull-ups", muscleGroup: "back" },
      { name: "Chin-ups", muscleGroup: "back" },
      { name: "Barbell Row", muscleGroup: "back" },
      { name: "Dumbbell Row", muscleGroup: "back" },
      { name: "T-Bar Row", muscleGroup: "back" },
      { name: "Lat Pulldown", muscleGroup: "back" },
      { name: "Seated Cable Row", muscleGroup: "back" },
      { name: "Face Pulls", muscleGroup: "back" },
      { name: "Hyperextensions", muscleGroup: "back" },
      { name: "Single-Arm Dumbbell Row", muscleGroup: "back" },

      // Biceps exercises
      { name: "Barbell Curl", muscleGroup: "biceps" },
      { name: "Dumbbell Curl", muscleGroup: "biceps" },
      { name: "Hammer Curl", muscleGroup: "biceps" },
      { name: "Preacher Curl", muscleGroup: "biceps" },
      { name: "Cable Curl", muscleGroup: "biceps" },
      { name: "Concentration Curl", muscleGroup: "biceps" },
      { name: "Incline Dumbbell Curl", muscleGroup: "biceps" },
      { name: "EZ-Bar Curl", muscleGroup: "biceps" },
      { name: "Spider Curl", muscleGroup: "biceps" },

      // Legs exercises
      { name: "Barbell Squat", muscleGroup: "legs" },
      { name: "Front Squat", muscleGroup: "legs" },
      { name: "Leg Press", muscleGroup: "legs" },
      { name: "Romanian Deadlift", muscleGroup: "legs" },
      { name: "Leg Extension", muscleGroup: "legs" },
      { name: "Leg Curl", muscleGroup: "legs" },
      { name: "Lunges", muscleGroup: "legs" },
      { name: "Bulgarian Split Squat", muscleGroup: "legs" },
      { name: "Hack Squat", muscleGroup: "legs" },
      { name: "Calf Raises", muscleGroup: "legs" },
      { name: "Seated Calf Raise", muscleGroup: "legs" },
      { name: "Goblet Squat", muscleGroup: "legs" },

      // Shoulders exercises
      { name: "Overhead Press", muscleGroup: "shoulders" },
      { name: "Dumbbell Shoulder Press", muscleGroup: "shoulders" },
      { name: "Arnold Press", muscleGroup: "shoulders" },
      { name: "Lateral Raises", muscleGroup: "shoulders" },
      { name: "Front Raises", muscleGroup: "shoulders" },
      { name: "Rear Delt Flyes", muscleGroup: "shoulders" },
      { name: "Upright Row", muscleGroup: "shoulders" },
      { name: "Shrugs", muscleGroup: "shoulders" },
      { name: "Face Pulls", muscleGroup: "shoulders" },
      { name: "Cable Lateral Raises", muscleGroup: "shoulders" },
    ];

    const exercises = defaultExercises.map((ex) => ({
      ...ex,
      userId: "default",
      isCustom: false,
    }));

    await GymExercise.insertMany(exercises);

    res.json({
      message: "Default exercises seeded successfully",
      count: exercises.length,
    });
  } catch (err) {
    next(err);
  }
};

// Get month data for calendar view
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

    const logs = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: 1 });

    // Create map of all days in month
    const daysInMonth = endOfMonth.getDate();
    const logsMap = new Map(logs.map((log) => [log.date, log]));

    const monthData = Array.from({ length: daysInMonth }, (_, i) => {
      const date = format(
        new Date(targetDate.getFullYear(), targetDate.getMonth(), i + 1),
        "yyyy-MM-dd",
      );
      const existing = logsMap.get(date);

      return {
        date,
        day: i + 1,
        workoutType: existing?.workoutType || null,
        primaryMuscle: existing?.primaryMuscle || null,
        secondaryMuscle: existing?.secondaryMuscle || null,
        exerciseCount: existing
          ? (existing.primaryExercises?.length || 0) +
            (existing.secondaryExercises?.length || 0)
          : 0,
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
