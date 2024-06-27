"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTuesdayStartTime = exports.updateThursdayDeadline = exports.savePicksToLastWeek = exports.calculatePointsForResult = exports.getBetResult = exports.getAllPicks = exports.deleteResultsFromServer = exports.saveResultsToServer = exports.updateUserStats = exports.updateUserPoints = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const connectDB_1 = require("../microservices/connectDB");
const baseUrl = 'http://localhost:3000' || 'www.pick6.club'; // Replace with your actual server URL
// Function to update user points
async function updateUserPoints(username, additionalPoints, poolName) {
    try {
        const response = await (0, node_fetch_1.default)(`${baseUrl}/pools/updateUserPointsInPoolByName`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, additionalPoints, poolName })
        });
        const updateData = await response.json();
        if (response.ok && updateData.success) {
            console.log('User points updated successfully:', updateData.message);
        }
        else {
            throw new Error(updateData.message || 'Failed to update points');
        }
    }
    catch (error) {
        console.error('Error during the update process:', error);
        throw error;
    }
}
exports.updateUserPoints = updateUserPoints;
// Function to update user stats
async function updateUserStats(username, poolName, winIncrement = 0, lossIncrement = 0, pushIncrement = 0) {
    try {
        const response = await (0, node_fetch_1.default)(`${baseUrl}/pools/updateUserStatsInPoolByName`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, poolName, winIncrement, lossIncrement, pushIncrement })
        });
        const updateData = await response.json();
        if (response.ok && updateData.success) {
            console.log('User stats updated successfully:', updateData.message);
        }
        else {
            throw new Error(updateData.message || 'Failed to update stats');
        }
    }
    catch (error) {
        console.error('Error during the update process:', error);
        throw error;
    }
}
exports.updateUserStats = updateUserStats;
// Function to save results to the server
let scoresUpdated = false;
async function saveResultsToServer(results) {
    try {
        const response = await (0, node_fetch_1.default)(`${baseUrl}/api/saveResults`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results })
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || 'Failed to save results');
        }
        console.log('Results saved successfully');
        scoresUpdated = true; // Set flag to indicate scores were updated
    }
    catch (error) {
        console.error('Failed to save results:', error);
        throw error;
    }
}
exports.saveResultsToServer = saveResultsToServer;
async function deleteResultsFromServer() {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const resultsCollection = database.collection('betResultsGlobal');
        await resultsCollection.deleteMany({});
        console.log('Results deleted successfully');
    }
    catch (error) {
        console.error('Failed to delete results:', error);
        throw new Error('Failed to delete results');
    }
}
exports.deleteResultsFromServer = deleteResultsFromServer;
// Function to get all picks
async function getAllPicks() {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('userPicks');
        const allPicks = await picksCollection.find({}).toArray();
        return allPicks;
    }
    catch (error) {
        console.error('Error fetching all picks:', error);
        throw new Error('Failed to fetch all picks');
    }
}
exports.getAllPicks = getAllPicks;
// Function to calculate bet result
function getBetResult(pick, homeTeamScore, awayTeamScore) {
    let result = 'error'; // Default to error in case conditions fail
    if (!pick) {
        console.error('Invalid pick:', pick);
        return { result, odds: 0 };
    }
    const numericValue = parseFloat(pick.replace(/[^-+\d.]/g, '')); // Strip to just numeric, including negative
    console.log('Evaluating Bet:', { pick, homeTeamScore, awayTeamScore, numericValue });
    // Determine if it's a spread or moneyline based on the absolute value of numericValue
    if (Math.abs(numericValue) < 100) { // Spread logic
        console.log('Handling as Spread');
        const adjustedHomeScore = homeTeamScore + numericValue;
        if (adjustedHomeScore > awayTeamScore) {
            return { result: "hit", odds: numericValue };
        }
        else if (adjustedHomeScore < awayTeamScore) {
            return { result: "miss", odds: numericValue };
        }
        else {
            return { result: "push", odds: numericValue };
        }
    }
    else { // Moneyline logic
        console.log('Handling as Moneyline');
        const didWin = (numericValue < 0 && homeTeamScore > awayTeamScore) || (numericValue > 0 && homeTeamScore < awayTeamScore);
        const isFavorite = numericValue < 0;
        if (didWin) {
            return { result: "hit", odds: numericValue };
        }
        else {
            return { result: "miss", odds: numericValue };
        }
    }
}
exports.getBetResult = getBetResult;
// Function to calculate points for a result
function calculatePointsForResult({ result, odds, type }) {
    let points = 0;
    switch (result) {
        case 'hit':
            if (Math.abs(odds) > 99) {
                if (odds < 0) {
                    points += odds <= -250 ? 0.5 : 1; // Less points for high favorites
                }
                else {
                    points += odds >= 400 ? 4 : odds >= 250 ? 2.5 : 2; // More points for big underdogs
                }
            }
            else if (Math.abs(odds) < 100) {
                points += 1.5; // Points for spread win
            }
            else if (type === "ImmortalLock") {
                points += 1; // Points for immortal lock win
            }
            break;
        case 'miss':
            if (type === "ImmortalLock") {
                points -= 2; // Penalty for immortal lock loss
            }
            break;
        case 'push':
            points += 0.5; // Points for a push
            break;
    }
    return points;
}
exports.calculatePointsForResult = calculatePointsForResult;
async function fetchPicksData(username, poolName) {
    const database = await (0, connectDB_1.connectToDatabase)();
    const picksCollection = database.collection('userPicks');
    return picksCollection.findOne({ username: username.toLowerCase(), poolName });
}
// Function to save picks to last week's collection
async function savePicksToLastWeek() {
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
        const picksCollection = database.collection('userPicks');
        const allPicks = await picksCollection.find({}).toArray();
        for (const pickData of allPicks) {
            const { username, poolName, picks, immortalLock } = pickData;
            await lastWeeksPicksCollection.updateOne({ username: username, poolName: poolName }, { $set: { picks: picks, immortalLockPick: immortalLock } }, { upsert: true });
        }
        console.log('Picks saved to last week collection successfully');
    }
    catch (error) {
        console.error('Error saving picks to last week collection:', error);
        throw new Error('Failed to save picks to last week collection');
    }
}
exports.savePicksToLastWeek = savePicksToLastWeek;
function getCurrentTimeInUTC4() {
    const now = new Date();
    now.setHours(now.getHours() - 4); // Convert UTC to EST (UTC-4)
    return now;
}
// Function to update the Thursday deadline
async function updateThursdayDeadline() {
    const now = getCurrentTimeInUTC4();
    const nextThursday = new Date(now);
    nextThursday.setDate(nextThursday.getDate() + ((4 + 7 - now.getDay()) % 7));
    nextThursday.setHours(19, 0, 0, 0); // 7 PM EST
    nextThursday.setMinutes(nextThursday.getMinutes() + nextThursday.getTimezoneOffset());
    nextThursday.setHours(nextThursday.getHours() - 4); // Convert UTC to EST (UTC-4)
    // Ensure it's the next Thursday
    if (now > nextThursday) {
        nextThursday.setDate(nextThursday.getDate() + 7); // Move to next Thursday
    }
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const timeWindowCollection = database.collection('timeWindows');
        await timeWindowCollection.updateOne({}, { $set: { thursdayDeadline: nextThursday.toISOString() } }, { upsert: true });
        console.log('Thursday deadline updated successfully.');
    }
    catch (error) {
        console.error('Error updating Thursday deadline:', error);
        throw new Error('Failed to update Thursday deadline');
    }
}
exports.updateThursdayDeadline = updateThursdayDeadline;
// Function to update the Tuesday start time
async function updateTuesdayStartTime() {
    const now = getCurrentTimeInUTC4();
    const nextTuesday = new Date(now);
    nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - now.getDay()) % 7));
    nextTuesday.setHours(0, 0, 0, 0); // 12 AM EST
    nextTuesday.setMinutes(nextTuesday.getMinutes() + nextTuesday.getTimezoneOffset());
    nextTuesday.setHours(nextTuesday.getHours() - 4); // Convert UTC to EST (UTC-4)
    // Ensure it's the next Tuesday
    if (now > nextTuesday) {
        nextTuesday.setDate(nextTuesday.getDate() + 7); // Move to next Tuesday
    }
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const timeWindowCollection = database.collection('timeWindows');
        await timeWindowCollection.updateOne({}, { $set: { tuesdayStartTime: nextTuesday.toISOString() } }, { upsert: true });
        console.log('Tuesday start time updated successfully.');
    }
    catch (error) {
        console.error('Error updating Tuesday start time:', error);
        throw new Error('Failed to update Tuesday start time');
    }
}
exports.updateTuesdayStartTime = updateTuesdayStartTime;
