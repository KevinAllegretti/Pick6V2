"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolMemberSchema = void 0;
//poolMember.ts
const mongoose_1 = __importDefault(require("mongoose"));
const poolMemberSchema = new mongoose_1.default.Schema({
    pool: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Pool',
        required: false
    },
    user: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        default: 0
    },
    picks: [{
        // Structure of a pick
        }],
    win: {
        type: Number,
        default: 0
    },
    loss: {
        type: Number,
        default: 0
    },
    push: {
        type: Number,
        default: 0
    },
});
exports.poolMemberSchema = poolMemberSchema;
