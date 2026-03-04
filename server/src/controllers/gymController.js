import { format, subDays, parseISO, differenceInMinutes } from "date-fns";
import GymLog from "../models/GymLog.js";
import GymStats from "../models/GymStats.js";
import {
  DEFAULT_USER_ID,
  DEFAULT_WEEKLY_GYM_TARGET,
  WORKOUT_INTENSITY,
} from "../constants/defaults.js";

const getToday = () => format(new Date(), "yyyy-MM-dd");

export const getTodayData = async (req, res, next) => {
  try {
    const date = getToday();

    // Get completed workouts for today
    const completedWorkouts = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    }).sort({ startedAt: -1 });

    // Check for active (incomplete) workout
    const activeWorkout = await GymLog.findOne({
      userId: DEFAULT_USER_ID,
      isComplete: false,
    }).sort({ startedAt: -1 });

    const stats = await GymStats.findOne({ userId: DEFAULT_USER_ID, date });

    res.json({
      completedWorkouts: completedWorkouts,
      activeWorkout: activeWorkout || null,
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

export const startWorkout = async (req, res, next) => {
  try {
    const { startedAt, notes } = req.body;

    if (!startedAt) {
      return res.status(400).json({ error: "Start time is required" });
    }

    // Check if there's already an active workout
    const existingActiveWorkout = await GymLog.findOne({
      userId: DEFAULT_USER_ID,
      isComplete: false,
    });

    if (existingActiveWorkout) {
      return res.status(400).json({
        error: "You already have an active workout. Complete it first.",
      });
    }

    const startedAtDate = new Date(startedAt);
    const date = format(startedAtDate, "yyyy-MM-dd");

    const workout = await GymLog.create({
      userId: DEFAULT_USER_ID,
      startedAt: startedAtDate,
      muscleGroups: [], // Will be filled when completing workout
      notes: notes || "",
      date,
      isComplete: false,
    });

    res.status(201).json({ workout });
  } catch (err) {
    next(err);
  }
};

export const updateWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { exercises, muscleGroups, intensity, notes } = req.body;

    const workout = await GymLog.findById(id);

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    if (workout.isComplete) {
      return res.status(400).json({ error: "Cannot update completed workout" });
    }

    // Update fields if provided
    if (exercises !== undefined) workout.exercises = exercises;
    if (muscleGroups !== undefined) workout.muscleGroups = muscleGroups;
    if (intensity !== undefined) workout.intensity = intensity;
    if (notes !== undefined) workout.notes = notes;

    await workout.save();

    res.json({ workout });
  } catch (err) {
    next(err);
  }
};

export const completeWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { endedAt, muscleGroups, exercises, intensity, notes } = req.body;

    if (!endedAt) {
      return res.status(400).json({ error: "End time is required" });
    }

    if (!muscleGroups || muscleGroups.length === 0) {
      return res
        .status(400)
        .json({ error: "At least one muscle group is required" });
    }

    const workout = await GymLog.findById(id);

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    if (workout.isComplete) {
      return res.status(400).json({ error: "Workout already completed" });
    }

    const endedAtDate = new Date(endedAt);

    if (endedAtDate <= workout.startedAt) {
      return res
        .status(400)
        .json({ error: "End time must be after start time" });
    }

    const duration = differenceInMinutes(endedAtDate, workout.startedAt);

    if (duration < 1 || duration > 480) {
      // Max 8 hours
      return res.status(400).json({
        error: "Workout duration must be between 1 minute and 8 hours",
      });
    }

    // Update workout with completion data
    const date = format(endedAtDate, "yyyy-MM-dd");
    workout.endedAt = endedAtDate;
    workout.duration = duration;
    workout.date = date; // Update to end date
    workout.isComplete = true;
    workout.muscleGroups = muscleGroups;
    if (exercises !== undefined) workout.exercises = exercises;
    if (intensity !== undefined) workout.intensity = intensity;
    if (notes !== undefined) workout.notes = notes;
    await workout.save();

    // Fetch current stats
    let stats = await GymStats.findOne({ userId: DEFAULT_USER_ID, date });

    const newTotalWorkouts = (stats?.totalWorkouts || 0) + 1;
    const newTotalMinutes = (stats?.totalMinutes || 0) + duration;
    const totalExercises = workout.exercises.length;

    // Combine muscle groups from all workouts
    const allCompletedWorkouts = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date,
      isComplete: true,
    });

    const allMuscleGroups = new Set();
    let totalIntensityScore = 0;

    allCompletedWorkouts.forEach((w) => {
      w.muscleGroups.forEach((mg) => allMuscleGroups.add(mg));
      totalIntensityScore += WORKOUT_INTENSITY[w.intensity] || 1.0;
    });

    const avgIntensityScore = totalIntensityScore / allCompletedWorkouts.length;
    let averageIntensity = "moderate";
    if (avgIntensityScore <= 0.8) averageIntensity = "light";
    else if (avgIntensityScore >= 1.2) averageIntensity = "intense";

    // Update stats
    stats = await GymStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date },
      {
        $set: {
          totalWorkouts: newTotalWorkouts,
          totalMinutes: newTotalMinutes,
          muscleGroupsWorked: Array.from(allMuscleGroups),
          totalExercises: allCompletedWorkouts.reduce(
            (sum, w) => sum + w.exercises.length,
            0,
          ),
          averageIntensity,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    res.status(200).json({ workout, stats });
  } catch (err) {
    next(err);
  }
};

export const deleteWorkout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const workout = await GymLog.findById(id);

    if (!workout) {
      return res.status(404).json({ error: "Workout not found" });
    }

    // If workout is not complete, just delete it (no stats to update)
    if (!workout.isComplete) {
      await GymLog.deleteOne({ _id: id });
      return res.json({ message: "Incomplete workout deleted" });
    }

    await GymLog.deleteOne({ _id: id });

    // Recalculate stats for completed workouts only
    const remainingWorkouts = await GymLog.find({
      userId: DEFAULT_USER_ID,
      date: workout.date,
      isComplete: true,
    });

    if (remainingWorkouts.length === 0) {
      // No workouts left, reset stats
      const stats = await GymStats.findOneAndUpdate(
        { userId: DEFAULT_USER_ID, date: workout.date },
        {
          $set: {
            totalWorkouts: 0,
            totalMinutes: 0,
            muscleGroupsWorked: [],
            totalExercises: 0,
            averageIntensity: "none",
            updatedAt: new Date(),
          },
        },
        { new: true },
      );

      return res.json({ stats });
    }

    // Recalculate from remaining workouts
    const totalMinutes = remainingWorkouts.reduce(
      (sum, w) => sum + w.duration,
      0,
    );
    const allMuscleGroups = new Set();
    let totalIntensityScore = 0;

    remainingWorkouts.forEach((w) => {
      w.muscleGroups.forEach((mg) => allMuscleGroups.add(mg));
      totalIntensityScore += WORKOUT_INTENSITY[w.intensity] || 1.0;
    });

    const avgIntensityScore = totalIntensityScore / remainingWorkouts.length;
    let averageIntensity = "moderate";
    if (avgIntensityScore <= 0.8) averageIntensity = "light";
    else if (avgIntensityScore >= 1.2) averageIntensity = "intense";

    const updatedStats = await GymStats.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, date: workout.date },
      {
        $set: {
          totalWorkouts: remainingWorkouts.length,
          totalMinutes,
          muscleGroupsWorked: Array.from(allMuscleGroups),
          totalExercises: remainingWorkouts.reduce(
            (sum, w) => sum + w.exercises.length,
            0,
          ),
          averageIntensity,
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

    const stats = await GymStats.find({
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
        totalWorkouts: existing?.totalWorkouts || 0,
        totalMinutes: existing?.totalMinutes || 0,
        muscleGroupsWorked: existing?.muscleGroupsWorked || [],
        totalExercises: existing?.totalExercises || 0,
        averageIntensity: existing?.averageIntensity || "none",
      };
    });

    res.json(weekData);
  } catch (err) {
    next(err);
  }
};

export const getStreak = async (req, res, next) => {
  try {
    // Get last 90 days of stats where workouts were logged
    const today = new Date();
    const stats = await GymStats.find({
      userId: DEFAULT_USER_ID,
      totalWorkouts: { $gt: 0 },
    })
      .sort({ date: -1 })
      .limit(90);

    if (stats.length === 0) {
      return res.json({ current: 0, longest: 0, thisWeek: 0 });
    }

    const workoutDates = new Set(stats.map((s) => s.date));

    // Current streak: consecutive days with workouts ending today (or yesterday)
    let current = 0;
    let checkDate = today;
    if (!workoutDates.has(format(checkDate, "yyyy-MM-dd"))) {
      checkDate = subDays(today, 1);
    }
    while (workoutDates.has(format(checkDate, "yyyy-MM-dd"))) {
      current++;
      checkDate = subDays(checkDate, 1);
    }

    // Longest streak from available data
    let longest = 0;
    let tempStreak = 0;
    for (let i = 89; i >= 0; i--) {
      const d = format(subDays(today, i), "yyyy-MM-dd");
      if (workoutDates.has(d)) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // This week's workouts (last 7 days)
    const thisWeekStart = subDays(today, 6);
    const thisWeek = stats
      .filter((s) => {
        const statDate = parseISO(s.date);
        return statDate >= thisWeekStart && statDate <= today;
      })
      .reduce((sum, s) => sum + s.totalWorkouts, 0);

    res.json({ current, longest, thisWeek });
  } catch (err) {
    next(err);
  }
};
