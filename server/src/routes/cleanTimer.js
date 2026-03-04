import express from "express";
import {
  getAllTimers,
  createTimer,
  resetTimer,
  updateTimer,
  deleteTimer,
  getTimerStats,
} from "../controllers/cleanTimerController.js";

const router = express.Router();

router.get("/", getAllTimers);
router.post("/", createTimer);
router.post("/reset/:id", resetTimer);
router.put("/:id", updateTimer);
router.delete("/:id", deleteTimer);
router.get("/stats/:id", getTimerStats);

export default router;
