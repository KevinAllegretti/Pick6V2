"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BetPollTimeWindow = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const betPollTimeWindowSchema = new mongoose_1.default.Schema({
    thursdayBetPoll: { type: Date, required: true },
    sundayBetPoll1: { type: Date, required: true },
    sundayBetPoll2: { type: Date, required: true },
    sundayBetPoll3: { type: Date, required: true },
    mondayBetPoll: { type: Date, required: true }
});
const BetPollTimeWindow = mongoose_1.default.model('BetPollTimeWindow', betPollTimeWindowSchema);
exports.BetPollTimeWindow = BetPollTimeWindow;
