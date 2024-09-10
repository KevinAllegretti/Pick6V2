import { fetchMLBData, fetchNFLschedule, saveNFLSchedule, saveWeeklyPicks, fetchNFLDataOneWeekOut, fetchGamesTwoWeeksAhead } from '../Controllers/dashController';
import { Router } from 'express';
const router = Router();


router.post('/fetchMLBData', fetchMLBData);
router.post('/saveWeeklyPicks', saveWeeklyPicks);
router.post('/fetchNFLschedule', fetchNFLschedule);
router.post('/saveNFLSchedule', saveNFLSchedule)
router.post('/fetchNFLDataOneWeekOut', fetchNFLDataOneWeekOut);
router.get('/fetchGamesTwoWeeksAhead', fetchGamesTwoWeeksAhead)
export default router;
