import { Router } from "express";
import {
  getTodayLog,
  logWorkout,
  deleteWorkout,
  getExercises,
  addExercise,
  deleteExercise,
  getProgram,
  updateProgram,
  getWeekHistory,
  getWeekData,
  getStreak,
  getInsights,
  getMonthData,
  seedDefaultExercises,
} from "../controllers/gymController.js";

const router = Router();

// Workout logging
router.get("/today", getTodayLog);
router.post("/log", logWorkout);
router.delete("/workout/:id", deleteWorkout);

// Exercise library
router.get("/exercises", getExercises);
router.post("/exercises", addExercise);
router.delete("/exercises/:id", deleteExercise);

// Training program
router.get("/program", getProgram);
router.put("/program", updateProgram);

// Week history for smart defaults
router.get("/week-history", getWeekHistory);

// Stats
router.get("/week", getWeekData);
router.get("/month", getMonthData);
router.get("/streak", getStreak);
router.get("/insights", getInsights);

// Seed default exercises (one-time setup)
router.post("/seed-exercises", seedDefaultExercises);

export default router;
