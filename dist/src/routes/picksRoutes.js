"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//pickRoutes.ts
const express_1 = __importDefault(require("express"));
const connectDB_1 = require("../microservices/connectDB");
const router = express_1.default.Router();
router.post('/api/savePicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const { picks, immortalLock, results } = req.body;
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('userPicks');
        // Use the updateOne method with upsert option to create or update the document
        // Now we're including poolName in the query to identify the document
        await picksCollection.updateOne({ username: username.toLowerCase(), poolName }, {
            $set: {
                picks,
                immortalLock
            }
        }, { upsert: true });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving or updating picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// Include poolName in the route parameters
router.post('/api/resetPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('userPicks');
        // Delete the document that matches both username and poolName
        const result = await picksCollection.deleteOne({
            username: username.toLowerCase(),
            poolName
        });
        if (result.deletedCount === 0) {
            res.status(404).json({ success: false, message: 'Document not found' });
        }
        else {
            res.json({ success: true, message: 'Picks deleted successfully' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/api/getPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('userPicks');
        // Query the collection using both username and poolName
        const userPicksData = await picksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });
        if (userPicksData) {
            res.json(userPicksData);
        }
        else {
            res.status(404).json({ message: 'No picks found for the given username in this pool' });
        }
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
// picksRoutes.js
router.post('/api/saveWeeklyPicks', async (req, res) => {
    const { picks } = req.body; // Your NFL transformed data
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('weeklyPicks');
        await picksCollection.updateOne({ identifier: 'current' }, { $set: { picks: picks, updated: new Date() } }, { upsert: true });
        res.json({ success: true, message: 'Picks saved successfully' });
    }
    catch (error) {
        console.error('Failed to save picks:', error);
        res.status(500).json({ success: false, message: 'Failed to save picks', error: error.toString() });
    }
});
router.get('/api/getWeeklyPicks', async (req, res) => {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('weeklyPicks');
        const currentPicks = await picksCollection.findOne({ identifier: 'current' });
        if (currentPicks && Array.isArray(currentPicks.picks)) {
            res.json(currentPicks.picks);
        }
        else {
            res.json([]); // Always return an array, even if empty
        }
    }
    catch (error) {
        console.error('Failed to retrieve picks:', error);
        res.status(500).json({ message: 'Server error', error: error.toString() });
    }
});
// picksRoutes.js
// API endpoint to store the results of the bets
router.post('/api/saveResults', async (req, res) => {
    const { results } = req.body;
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const resultsCollection = database.collection('betResultsGlobal');
        // Store results with a static identifier
        await resultsCollection.updateOne({ identifier: 'currentResults' }, { $set: { results, updated: new Date() } }, { upsert: true });
        res.json({ success: true, message: 'Results saved successfully' });
    }
    catch (error) {
        console.error('Failed to save results:', error);
        res.status(500).json({ success: false, message: 'Failed to save results', error: error.toString() });
    }
});
router.delete('/api/deleteResults', async (req, res) => {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const resultsCollection = database.collection('betResultsGlobal');
        await resultsCollection.deleteMany({});
        res.json({ success: true, message: 'Results deleted successfully' });
    }
    catch (error) {
        console.error('Failed to delete results:', error);
        res.status(500).json({ success: false, message: 'Failed to delete results', error: error.toString() });
    }
});
router.get('/api/getResults', async (req, res) => {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const resultsCollection = database.collection('betResultsGlobal');
        const currentResults = await resultsCollection.findOne({ identifier: 'currentResults' });
        if (currentResults) {
            res.json({ success: true, results: currentResults.results });
        }
        else {
            res.json({ success: false, results: [], message: 'No results found' });
        }
    }
    catch (error) {
        console.error('Failed to fetch results:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.toString() });
    }
});
router.post('/api/savePicksToLastWeek', async (req, res) => {
    try {
        const { allPicks } = req.body;
        const database = await (0, connectDB_1.connectToDatabase)();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
        for (const { username, poolName, picks, immortalLockPick } of allPicks) {
            await lastWeeksPicksCollection.updateOne({ username: username, poolName: poolName }, { $set: { picks: picks, immortalLockPick: immortalLockPick } }, { upsert: true });
        }
        res.json({ success: true, message: 'Picks saved to last week collection successfully' });
    }
    catch (error) {
        console.error('Error saving picks to last week collection:', error);
        res.status(500).json({ success: false, message: 'Failed to save picks to last week collection' });
    }
});
router.get('/api/getLastWeekPicks/:username/:poolName', async (req, res) => {
    const { username, poolName } = req.params;
    const lowercaseUsername = username.toLowerCase();
    // console.log(`Server received: username = ${lowercaseUsername}, poolName = ${poolName}`);
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
        const userPicks = await lastWeeksPicksCollection.findOne({ username: lowercaseUsername, poolName });
        // console.log('User picks found:', userPicks);
        if (userPicks) {
            res.json({ success: true, picks: userPicks.picks, immortalLockPick: userPicks.immortalLockPick });
        }
        else {
            res.json({ success: false, picks: [], immortalLockPick: [] });
        }
    }
    catch (error) {
        console.error('Error fetching last week picks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch last week picks' });
    }
});
exports.default = router;
