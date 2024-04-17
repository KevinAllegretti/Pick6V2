"use strict";
// Pool.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const poolMember_1 = require("./poolMember");
// Define the Pool schema
const poolSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    admin: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    adminUsername: {
        type: String,
        required: true
    },
    members: [poolMember_1.poolMemberSchema],
    isPrivate: {
        type: Boolean,
        default: false,
    },
    password: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
// Create the model from the schema
const Pool = mongoose_1.default.model('Pool', poolSchema);
// Export the model
exports.default = Pool;
