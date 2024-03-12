"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const picks_1 = __importDefault(require("../models/picks")); // Adjust path accordingly
const router = express_1.default.Router();
router.get('/currentPicks', async (req, res) => {
    const picks = await picks_1.default.findOne().sort({ timestamp: -1 });
    res.json(picks);
});
router.post('/addPick', async (req, res) => {
    const currentPicks = await picks_1.default.findOne().sort({ timestamp: -1 });
    if (currentPicks && currentPicks.picks.length >= 6) {
        return res.status(400).send({ error: 'You have already made 6 picks. Time for the immortal lock!' });
    }
    const newPick = new picks_1.default(req.body);
    await newPick.save();
    res.json(newPick);
});
router.post('/addImmortalLock', async (req, res) => {
    const currentPicks = await picks_1.default.findOne().sort({ timestamp: -1 });
    if (!currentPicks || currentPicks.picks.length < 6 || currentPicks.immortalLock) {
        return res.status(400).send({ error: 'Either not all picks are made or immortal lock is already set!' });
    }
    currentPicks.immortalLock = req.body;
    await currentPicks.save();
    res.json(currentPicks);
});
exports.default = router;
