import { Router } from "express";
import { getTodayOverview } from "../controllers/todayController.js";

const router = Router();

router.get("/overview", getTodayOverview);

export default router;
