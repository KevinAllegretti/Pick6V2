"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndUpdatePicks = void 0;
// picksController.ts
const connectDB_1 = require("../microservices/connectDB");
const dataController_1 = require("./dataController");
async function fetchAndUpdatePicks() {
    try {
        const apiData = await (0, dataController_1.fetchMLBData)(); // Fetch and process MLB data
        const transformedData = (0, dataController_1.transformDataForNFL)(apiData); // Transform it into NFL format
        const database = await (0, connectDB_1.connectToDatabase)();
        const weeklyPicksCollection = database.collection('weeklyPicks');
        // Update the database with the new data
        await weeklyPicksCollection.updateOne({ identifier: 'current' }, { $set: { picks: transformedData, updated: new Date() } }, { upsert: true });
        return transformedData; // Optionally return the transformed data
    }
    catch (error) {
        console.error('Failed to fetch and update picks:', error);
        throw error;
    }
}
exports.fetchAndUpdatePicks = fetchAndUpdatePicks;
