import { Router } from "express";
import {
  getTodayData,
  startWorkout,
  updateWorkout,
  completeWorkout,
  deleteWorkout,
  getWeekData,
  getStreak,
} from "../controllers/gymController.js";

const router = Router();

router.get("/today", getTodayData);
router.post("/start", startWorkout);
router.put("/update/:id", updateWorkout);
router.put("/complete/:id", completeWorkout);
router.delete("/workout/:id", deleteWorkout);
router.get("/week", getWeekData);
router.get("/streak", getStreak);

export default router;
