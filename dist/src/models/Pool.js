"use strict";
// Pool.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
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
    members: [{
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: 'User',
        }],
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
// Pre-save hook to hash password for private pools
poolSchema.pre('save', async function (next) {
    const pool = this; // Cast to 'any' type to avoid type checking issues in this context
    if (pool.isPrivate && pool.isModified('password')) {
        pool.password = await bcrypt_1.default.hash(pool.password, 10);
    }
    next();
});
// Create the model from the schema
const Pool = mongoose_1.default.model('Pool', poolSchema);
// Export the model
exports.default = Pool;
