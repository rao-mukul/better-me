import { Router } from "express";
import {
  getTodayData,
  startSleep,
  completeSleep,
  deleteSleepLog,
  getWeekData,
  getStreak,
  updateTarget,
} from "../controllers/sleepController.js";

const router = Router();

router.get("/today", getTodayData);
router.post("/start", startSleep);
router.put("/complete/:id", completeSleep);
router.delete("/log/:id", deleteSleepLog);
router.get("/week", getWeekData);
router.get("/streak", getStreak);
router.put("/target", updateTarget);

export default router;
