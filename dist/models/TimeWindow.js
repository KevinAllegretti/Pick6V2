"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeWindow = void 0;
const mongoose_1 = require("mongoose");
const timeWindowSchema = new mongoose_1.Schema({
    thursdayDeadline: { type: Date, required: true },
    tuesdayStartTime: { type: Date, required: true },
});
exports.TimeWindow = (0, mongoose_1.model)('TimeWindow', timeWindowSchema);
