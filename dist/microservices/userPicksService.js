"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPicksByUsername = exports.addPick = void 0;
const { connectToDatabase } = require('./connectDB');
async function addPick(pick) {
    const db = await connectToDatabase();
    const collection = db.collection('userPicks');
    return await collection.insertOne(pick);
}
exports.addPick = addPick;
async function getPicksByUsername(username) {
    const db = await connectToDatabase();
    const collection = db.collection('userPicks');
    return await collection.find({ username }).toArray();
}
exports.getPicksByUsername = getPicksByUsername;
