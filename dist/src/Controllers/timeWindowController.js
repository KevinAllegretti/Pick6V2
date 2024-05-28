"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTimeWindows = exports.getTimeWindows = void 0;
const TimeWindow_1 = require("../models/TimeWindow");
const getTimeWindows = async (req, res) => {
    try {
        const timeWindow = await TimeWindow_1.TimeWindow.findOne();
        res.json(timeWindow);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.getTimeWindows = getTimeWindows;
const updateTimeWindows = async (req, res) => {
    try {
        const { thursdayDeadline, tuesdayStartTime } = req.body;
        const timeWindow = await TimeWindow_1.TimeWindow.findOneAndUpdate({}, { thursdayDeadline, tuesdayStartTime }, { new: true, upsert: true });
        res.json(timeWindow);
    }
    catch (error) {
        res.status(500).send(error);
    }
};
exports.updateTimeWindows = updateTimeWindows;
