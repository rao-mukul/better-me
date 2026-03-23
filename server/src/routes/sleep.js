import { Router } from "express";
import {
  getTodayData,
  getWeekLogs,
  logCompleteSleep,
  deleteSleepLog,
  getWeekData,
  getMonthData,
  getStreak,
  updateTarget,
} from "../controllers/sleepController.js";

const router = Router();

router.get("/today", getTodayData);
router.get("/week-logs", getWeekLogs);
router.post("/log", logCompleteSleep);
router.delete("/log/:id", deleteSleepLog);
router.get("/week", getWeekData);
router.get("/month", getMonthData);
router.get("/streak", getStreak);
router.put("/target", updateTarget);

export default router;
