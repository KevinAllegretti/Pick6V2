import { fetchMLBData, fetchNFLschedule, saveNFLSchedule, saveWeeklyPicks } from '../Controllers/dashController';
import { Router } from 'express';
const router = Router();

router.post('/fetchMLBData', fetchMLBData);
router.post('/saveWeeklyPicks', saveWeeklyPicks);
router.post('/fetchNFLschedule', fetchNFLschedule);
router.post('/saveNFLSchedule', saveNFLSchedule)
export default router;