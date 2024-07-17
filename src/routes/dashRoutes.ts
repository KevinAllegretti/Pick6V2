import { fetchMLBData, saveWeeklyPicks } from '../Controllers/dashController';
import { Router } from 'express';
const router = Router();

router.post('/fetchMLBData', fetchMLBData);
router.post('/saveWeeklyPicks', saveWeeklyPicks);

export default router;