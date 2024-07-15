import fetch from 'node-fetch';
import { connectToDatabase } from '../microservices/connectDB';

const baseUrl = 'http://localhost:3000' || 'www.pick6.club'; 

// Function to update user points
export async function updateUserPoints(username: string, additionalPoints: number, poolName: string): Promise<void> {
    if (additionalPoints === 0) {
        console.log('No points to update for:', username);
        return;
    }

    try {
        console.log(`Updating points for ${username}: ${additionalPoints} points in pool ${poolName}`);
        const response = await fetch(`${baseUrl}/pools/updateUserPointsInPoolByName`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, additionalPoints, poolName })
        });
        const updateData = await response.json();
        if (response.ok && updateData.success) {
            console.log('User points updated successfully:', updateData.message);
        } else {
            throw new Error(updateData.message || 'Failed to update points');
        }
    } catch (error) {
        console.error('Error during the update process:', error);
        throw error;
    }
}

// Function to update user stats
export async function updateUserStats(username: string, poolName: string, winIncrement: number = 0, lossIncrement: number = 0, pushIncrement: number = 0): Promise<void> {
    try {
        console.log(`Updating stats for ${username} in pool ${poolName} - Wins: ${winIncrement}, Losses: ${lossIncrement}, Pushes: ${pushIncrement}`);
        const response = await fetch(`${baseUrl}/pools/updateUserStatsInPoolByName`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, poolName, winIncrement, lossIncrement, pushIncrement })
        });
        const updateData = await response.json();
        if (response.ok && updateData.success) {
            console.log('User stats updated successfully:', updateData.message);
        } else {
            throw new Error(updateData.message || 'Failed to update stats');
        }
    } catch (error) {
        console.error('Error during the update process:', error);
        throw error;
    }
}

// Function to save results to the server
let scoresUpdated = false;

// Function to save results to the server
export async function saveResultsToServer(newResults: any[]): Promise<void> {
    try {
        const database = await connectToDatabase();
        const resultsCollection = database.collection('betResultsGlobal');

        const existingResultsDoc = await resultsCollection.findOne({ identifier: 'currentResults' });

        if (existingResultsDoc) {
            // If there are existing results, append new results to the existing array
            const updatedResults = existingResultsDoc.results.concat(newResults);
            await resultsCollection.updateOne(
                { identifier: 'currentResults' },
                { $set: { results: updatedResults, updated: new Date() } }
            );
        } else {
            // If no existing results, create a new document
            await resultsCollection.insertOne({
                identifier: 'currentResults',
                results: newResults,
                updated: new Date()
            });
        }
        console.log('Results saved successfully');
    } catch (error) {
        console.error('Failed to save results:', error);
        throw error;
    }
}


export async function deleteResultsFromServer(): Promise<void> {
    const now = getCurrentTimeInUTC4();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentDay === 2 && currentHour === 0 && currentMinute === 0) {
    try {
        const database = await connectToDatabase();
        const resultsCollection = database.collection('betResultsGlobal');
        await resultsCollection.deleteMany({});
        console.log('Results deleted successfully');
    } catch (error: any) {
        console.error('Failed to delete results:', error);
        throw new Error('Failed to delete results');
    }
}
}

export async function deletePicksFromServer(): Promise<void> {
    const now = getCurrentTimeInUTC4();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentDay === 2 && currentHour === 0 && currentMinute === 0) {
    try {
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        await picksCollection.deleteMany({});
        console.log('Picks deleted successfully');
    } catch (error: any) {
        console.error('Failed to delete Picks:', error);
        throw new Error('Failed to delete Picks');
    }
}
}

// Function to get all picks
export async function getAllPicks(): Promise<any[]> {
    try {
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        const allPicks = await picksCollection.find({}).toArray();
        return allPicks;
    } catch (error) {
        console.error('Error fetching all picks:', error);
        throw new Error('Failed to fetch all picks');
    }
}

// Function to calculate bet result
export function getBetResult(pick: string, homeTeamScore: number, awayTeamScore: number): { result: string, odds: number } {
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
        } else if (adjustedHomeScore < awayTeamScore) {
            return { result: "miss", odds: numericValue };
        } else {
            return { result: "push", odds: numericValue };
        }
    } else { // Moneyline logic
        console.log('Handling as Moneyline');
        const didWin = (numericValue < 0 && homeTeamScore > awayTeamScore) || (numericValue > 0 && homeTeamScore < awayTeamScore);
        const isFavorite = numericValue < 0;
        if (didWin) {
            return { result: "hit", odds: numericValue };
        } else {
            return { result: "miss", odds: numericValue };
        }
    }
}

// Function to calculate points for a result
export function calculatePointsForResult({ result, odds, type }: { result: string, odds: number, type?: string }): number {
    let points = 0;
    switch (result) {
        case 'hit':
            if (Math.abs(odds) > 99) {
                if (odds < 0) {
                    points += odds <= -250 ? 0.5 : 1; // Less points for high favorites
                } else {
                    points += odds >= 400 ? 4 : odds >= 250 ? 2.5 : 2; // More points for big underdogs
                }
            } else if (Math.abs(odds) < 100) {
                points += 1.5; // Points for spread win
            } else if (type === "ImmortalLock") {
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

export async function fetchPicksData(username: string, poolName: string): Promise<any> {
    const database = await connectToDatabase();
    const picksCollection = database.collection('userPicks');
    return picksCollection.findOne({ username: username.toLowerCase(), poolName });
}

// Function to save picks to last week's collection
export async function savePicksToLastWeek(): Promise<void> {
    try {
        const database = await connectToDatabase();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
        const picksCollection = database.collection('userPicks');

        const allPicks = await picksCollection.find({}).toArray();

        for (const pickData of allPicks) {
            const { username, poolName, picks, immortalLock } = pickData;
            await lastWeeksPicksCollection.updateOne(
                { username: username, poolName: poolName },
                { $set: { picks: picks, immortalLockPick: immortalLock } },
                { upsert: true }
            );
        }

        console.log('Picks saved to last week collection successfully');
    } catch (error: any) {
        console.error('Error saving picks to last week collection:', error);
        throw new Error('Failed to save picks to last week collection');
    }
}

function getCurrentTimeInUTC4(): Date {
    const now = new Date();
    now.setHours(now.getHours() - 4); // Convert UTC to EST (UTC-4)
    return now;
}

// Function to update the Thursday deadline
export async function updateThursdayDeadline(): Promise<void> {
    const now = getCurrentTimeInUTC4();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Only update if it's Tuesday at 12 AM
    if (currentDay === 2 && currentHour === 0 && currentMinute === 0) {
        const nextThursday = new Date(now);
        nextThursday.setDate(nextThursday.getDate() + ((4 + 7 - now.getDay()) % 7));
        nextThursday.setHours(19, 0, 0, 0); // 7 PM EST
        nextThursday.setMinutes(nextThursday.getMinutes() + nextThursday.getTimezoneOffset());
        nextThursday.setHours(nextThursday.getHours() - 4); // Convert UTC to EST (UTC-4)

        try {
            const database = await connectToDatabase();
            const timeWindowCollection = database.collection('timewindows');
            await timeWindowCollection.updateOne(
                {},
                { $set: { thursdayDeadline: nextThursday } },
                { upsert: true }
            );
            console.log('Thursday deadline updated successfully.');
        } catch (error) {
            console.error('Error updating Thursday deadline:', error);
            throw new Error('Failed to update Thursday deadline');
        }
    }
}
// Function to update the Tuesday start time
export async function updateTuesdayStartTime(): Promise<void> {
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
        const database = await connectToDatabase();
        const timeWindowCollection = database.collection('timewindows');
        await timeWindowCollection.updateOne(
            {},
            { $set: { tuesdayStartTime: nextTuesday } }, // Store as Date object
            { upsert: true }
        );
        console.log('Tuesday start time updated successfully.');
    } catch (error) {
        console.error('Error updating Tuesday start time:', error);
        throw new Error('Failed to update Tuesday start time');
    }
}