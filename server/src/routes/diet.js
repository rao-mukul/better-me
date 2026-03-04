import express from "express";
import {
  getTodayData,
  addLog,
  deleteLog,
  getWeekData,
  updateGoals,
  getStreak,
} from "../controllers/dietController.js";

const router = express.Router();

router.get("/today", getTodayData);
router.post("/log", addLog);
router.delete("/log/:id", deleteLog);
router.get("/week", getWeekData);
router.put("/goals", updateGoals);
router.get("/streak", getStreak);

export default router;
