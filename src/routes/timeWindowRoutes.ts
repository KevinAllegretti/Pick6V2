import express from 'express';
const router = express.Router();
import { TimeWindow } from '../models/TimeWindow';


router.post('/timeWindows', async (req, res) => {
    const { thursdayDeadline, tuesdayStartTime } = req.body;
    try {
        await TimeWindow.create({ thursdayDeadline, tuesdayStartTime });
        res.status(201).send('Initial times saved.');
    } catch (error:any) {
        res.status(500).send('Error saving initial times.');
    }
});


router.get('/timeWindows', async (req, res) => {
    try {
        const timeWindow = await TimeWindow.findOne();
        if (!timeWindow) {
            return res.status(404).send('Time windows not found.');
        }
        res.json(timeWindow);
    } catch (error: any) {
        res.status(500).send('Error fetching time windows.');
    }
});

router.put('/timeWindows/tuesday', async (req, res) => {
    const { tuesdayStartTime } = req.body;
    try {
        await TimeWindow.findOneAndUpdate({}, { tuesdayStartTime });
        res.send('Tuesday start time updated.');
    } catch (error:any) {
        res.status(500).send('Error updating Tuesday start time.');
    }
});

router.put('/timeWindows/thursday', async (req, res) => {
    const { thursdayDeadline } = req.body;
    try {
        await TimeWindow.findOneAndUpdate({}, { thursdayDeadline });
        res.send('Thursday deadline updated.');
    } catch (error:any) {
        res.status(500).send('Error updating Thursday deadline.');
    }
});



export default router;
