"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const gameOutcomeSchema = new mongoose_1.default.Schema({
    week: {
        type: Number,
        required: true
    },
    outcomes: [{
            team: {
                type: String,
                required: true
            },
            result: {
                type: String,
                required: true
            },
            value: {
                type: Number,
                required: true
            }
        }]
});
const GameOutcome = mongoose_1.default.model('GameOutcome', gameOutcomeSchema);
exports.default = GameOutcome;
