"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router = express_1.default.Router();
const TimeWindow_1 = require("../models/TimeWindow");
const BetPollTimeWindow_1 = require("../models/BetPollTimeWindow");
router.post('/betPollTimeWindows', async (req, res) => {
    const { thursdayBetPoll, sundayBetPoll1, sundayBetPoll2, sundayBetPoll3, mondayBetPoll } = req.body;
    try {
        await BetPollTimeWindow_1.BetPollTimeWindow.create({
            thursdayBetPoll,
            sundayBetPoll1,
            sundayBetPoll2,
            sundayBetPoll3,
            mondayBetPoll
        });
        res.status(201).send('Bet poll times saved.');
    }
    catch (error) {
        res.status(500).send('Error saving bet poll times.');
    }
});
router.put('/betPollTimeWindows', async (req, res) => {
    const { thursdayBetPoll, sundayBetPoll1, sundayBetPoll2, sundayBetPoll3, mondayBetPoll } = req.body;
    try {
        await BetPollTimeWindow_1.BetPollTimeWindow.findOneAndUpdate({ identifier: 'betPollTimes' }, { thursdayBetPoll, sundayBetPoll1, sundayBetPoll2, sundayBetPoll3, mondayBetPoll }, { upsert: true });
        res.json({ success: true, message: 'Bet poll times updated successfully.' });
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Error updating bet poll times.' });
    }
});
router.post('/timeWindows', async (req, res) => {
    const { thursdayDeadline, tuesdayStartTime } = req.body;
    try {
        await TimeWindow_1.TimeWindow.create({ thursdayDeadline, tuesdayStartTime });
        res.status(201).send('Initial times saved.');
    }
    catch (error) {
        res.status(500).send('Error saving initial times.');
    }
});
router.get('/timeWindows', async (req, res) => {
    try {
        const timeWindow = await TimeWindow_1.TimeWindow.findOne();
        if (!timeWindow) {
            return res.status(404).send('Time windows not found.');
        }
        res.json(timeWindow);
    }
    catch (error) {
        res.status(500).send('Error fetching time windows.');
    }
});
router.put('/timeWindows/tuesday', async (req, res) => {
    const { tuesdayStartTime } = req.body;
    try {
        await TimeWindow_1.TimeWindow.findOneAndUpdate({}, { tuesdayStartTime });
        res.send('Tuesday start time updated.');
    }
    catch (error) {
        res.status(500).send('Error updating Tuesday start time.');
    }
});
router.put('/timeWindows/thursday', async (req, res) => {
    const { thursdayDeadline } = req.body;
    try {
        await TimeWindow_1.TimeWindow.findOneAndUpdate({}, { thursdayDeadline });
        res.send('Thursday deadline updated.');
    }
    catch (error) {
        res.status(500).send('Error updating Thursday deadline.');
    }
});
exports.default = router;
