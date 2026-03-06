import { Router } from "express";
import {
  getTodayLog,
  logWorkout,
  deleteWorkout,
  getExercises,
  addExercise,
  getProgram,
  updateProgram,
  getWeekHistory,
  getWeekData,
  getStreak,
  seedDefaultExercises,
} from "../controllers/newGymController.js";

const router = Router();

// Workout logging
router.get("/today", getTodayLog);
router.post("/log", logWorkout);
router.delete("/workout/:id", deleteWorkout);

// Exercise library
router.get("/exercises", getExercises);
router.post("/exercises", addExercise);

// Training program
router.get("/program", getProgram);
router.put("/program", updateProgram);

// Week history for smart defaults
router.get("/week-history", getWeekHistory);

// Stats
router.get("/week", getWeekData);
router.get("/streak", getStreak);

// Seed default exercises (one-time setup)
router.post("/seed-exercises", seedDefaultExercises);

export default router;
