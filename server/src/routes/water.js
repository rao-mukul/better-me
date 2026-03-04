import { Router } from 'express';
import {
  getTodayData,
  addLog,
  deleteLog,
  getWeekData,
  getStreak,
  updateGoal,
} from '../controllers/waterController.js';

const router = Router();

router.get('/today', getTodayData);
router.post('/log', addLog);
router.delete('/log/:id', deleteLog);
router.get('/week', getWeekData);
router.get('/streak', getStreak);
router.put('/goal', updateGoal);

export default router;
