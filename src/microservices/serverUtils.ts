import fetch from 'node-fetch';
import { connectToDatabase } from '../microservices/connectDB';

const baseUrl = 'https://www.pick6.club'; 
//test
// Function to update user points
/*
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
}*/

export async function updateUserPoints(username: string, additionalPoints: number | string, poolName: string): Promise<void> {
    // Convert additionalPoints to a number if it's a string
    const pointsValue = typeof additionalPoints === 'string' ? parseFloat(additionalPoints) : additionalPoints;
    
    if (isNaN(pointsValue) || pointsValue === 0) {
        console.log('No valid points to update for:', username);
        return;
    }

    try {
        console.log(`Updating points for ${username}: ${pointsValue} points in pool ${poolName}`);
        const response = await fetch(`${baseUrl}/pools/updateUserPointsInPoolByName`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, additionalPoints: pointsValue, poolName })
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


export async function deletePicksFromServer(): Promise<void> {

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


// Function to get all picks
export async function getAllPicks(): Promise<any[]> {
    try {
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        
        // Get all picks, including both regular and playoff picks
        const allPicks = await picksCollection.find({}).toArray();
        
        // Add a flag to each pick indicating whether it's a playoff pick
        allPicks.forEach(pick => {
            pick.isPlayoffPick = pick.poolName.startsWith('playoff_');
            if (pick.isPlayoffPick) {
                // Store original pool name without prefix for reference
                pick.originalPoolName = pick.poolName.substring(8);
            }
        });
        
        return allPicks;
    } catch (error) {
        console.error('Error fetching all picks:', error);
        throw new Error('Failed to fetch all picks');
    }
}

/*
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
*/

// Function to calculate bet result
// Function to calculate bet result for NFL data
export function getBetResult(pick: any, homeTeamScore: number, awayTeamScore: number, teamName: string, homeTeam: string, awayTeam: string): { result: string, odds: number } {
    let result = 'error'; // Default to error in case conditions fail
    let pickString: string;
    
    // Handle different types of pick values
    if (typeof pick === 'string') {
        pickString = pick;
    } else if (pick && typeof pick === 'object') {
        // If pick is an object, try to extract relevant value
        if (pick.value) {
            pickString = String(pick.value);
        } else if (pick.type) {
            pickString = String(pick.type);
        } else {
            console.error('Invalid pick object format:', pick);
            return { result, odds: 0 };
        }
    } else {
        console.error('Invalid pick type:', typeof pick, pick);
        return { result, odds: 0 };
    }

    try {
        const numericValue = parseFloat(pickString.replace(/[^-+\d.]/g, ''));
        console.log('Evaluating Bet:', { pick: pickString, teamName, homeTeam, awayTeam, homeTeamScore, awayTeamScore, numericValue });

        // Rest of your existing logic remains the same
        if (Math.abs(numericValue) < 100) { 
            // Spread logic
            console.log('Handling as Spread');
            
            let adjustedScore;
            
            // Check if the user bet on the home team
            if (teamName === homeTeam) {
                adjustedScore = homeTeamScore + numericValue;
                // Compare adjusted home score to away score
                if (adjustedScore > awayTeamScore) {
                    return { result: "hit", odds: numericValue };
                } else if (adjustedScore < awayTeamScore) {
                    return { result: "miss", odds: numericValue };
                } else {
                    return { result: "push", odds: numericValue };
                }
            } else {
                // The bet is on the away team, so adjust the away team's score
                adjustedScore = awayTeamScore + numericValue;
                // Compare adjusted away score to home score
                if (adjustedScore > homeTeamScore) {
                    return { result: "hit", odds: numericValue };
                } else if (adjustedScore < homeTeamScore) {
                    return { result: "miss", odds: numericValue };
                } else {
                    return { result: "push", odds: numericValue };
                }
            }
        } else { 
            // Moneyline logic
            console.log('Handling as Moneyline');

            // Determine if the bet was on the home or away team
            const isHomeTeamBet = teamName === homeTeam;

            // Check for a tie game first
            if (homeTeamScore === awayTeamScore) {
                console.log('Game ended in a tie, moneyline push.');
                return { result: "push", odds: numericValue };
            }

            // Moneyline logic for a "hit"
            const didWin = (isHomeTeamBet && homeTeamScore > awayTeamScore) || (!isHomeTeamBet && awayTeamScore > homeTeamScore);

            if (didWin) {
                console.log('Bet hit, awarding points.');
                return { result: "hit", odds: numericValue };
            } else {
                console.log('Bet missed.');
                return { result: "miss", odds: numericValue };
            }
        }
    } catch (error) {
        console.error('Error processing bet:', error, { pick, pickString });
        return { result: 'error', odds: 0 };
    }
}


// Function to calculate points for a result
// Function to calculate points for a result
export function calculatePointsForResult({ result, odds, type }: { result: string, odds: number, type?: string }): number {
    let points = 0;

    switch (result) {
        case 'hit':
            if (type === "ImmortalLock") {
                points += 1; // Points for immortal lock win
            } else if (Math.abs(odds) > 99) {
                if (odds < 0) {
                    points += odds <= -250 ? 0.5 : 1; // Less points for high favorites
                } else {
                    points += odds >= 400 ? 4 : odds >= 250 ? 2.5 : 2; // More points for big underdogs
                }
            } else if (Math.abs(odds) < 100) {
                points += 1.5; // Points for spread win
            }
            break;
            
        case 'miss':
            if (type === "ImmortalLock") {
                points -= 2; // Penalty for immortal lock loss
            }
            break;
            
        case 'push':
            if (type === "ImmortalLock") {
                points -= 2; // Penalty for immortal lock push
            }else{
            points += 0.5; // Points for a push
            }
            break;
    }

    return points;
}

export async function fetchPlayoffPicksData(username: string, poolName: string): Promise<any> {
    const database = await connectToDatabase();
    const picksCollection = database.collection('userPicks');
    return picksCollection.findOne({ 
        username: username.toLowerCase(), 
        poolName: `playoff_${poolName}` 
    });
}

export async function fetchPicksData(username: string, poolName: string): Promise<any> {
    const database = await connectToDatabase();
    const picksCollection = database.collection('userPicks');
    return picksCollection.findOne({ username: username.toLowerCase(), poolName });
}

// Function to save picks to last week's collection
/*
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
}*/

export async function savePicksToLastWeek(): Promise<void> {
    try {
        const database = await connectToDatabase();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
        const picksCollection = database.collection('userPicks');
        const poolsCollection = database.collection('pools');

        // Get all pools with "classic" mode
        const classicPools = await poolsCollection.find({ mode: "classic" }).toArray();
        const classicPoolNames = classicPools.map(pool => pool.name);

        // Only get picks that belong to classic mode pools
        const allPicks = await picksCollection.find({
            poolName: { $in: classicPoolNames }
        }).toArray();

        for (const pickData of allPicks) {
            const { username, poolName, picks, immortalLock } = pickData;
            await lastWeeksPicksCollection.updateOne(
                { username: username, poolName: poolName },
                { $set: { picks: picks, immortalLockPick: immortalLock } },
                { upsert: true }
            );
        }

        console.log(`Saved ${allPicks.length} picks from ${classicPoolNames.length} classic mode pools to last week collection`);
    } catch (error: any) {
        console.error('Error saving picks to last week collection:', error);
        throw new Error('Failed to save picks to last week collection');
    }
}

export async function saveSurvivorPicks(): Promise<void> {
    try {
        const database = await connectToDatabase();
        const survivorPastPicksCollection = database.collection('survivorPastPicks');
        const picksCollection = database.collection('userPicks');
        const poolsCollection = database.collection('pools');

        // Get current week
        const currentWeek = await getCurrentWeek();
        
        // Get all pools with "survivor" mode
        const survivorPools = await poolsCollection.find({ mode: "survivor" }).toArray();
        const survivorPoolNames = survivorPools.map(pool => pool.name);
        
        if (survivorPoolNames.length === 0) {
            console.log('No survivor pools found, skipping survivor picks update');
            return;
        }

        // Only get picks that belong to survivor mode pools
        const allSurvivorPicks = await picksCollection.find({
            poolName: { $in: survivorPoolNames }
        }).toArray();

        console.log(`Found ${allSurvivorPicks.length} picks from ${survivorPoolNames.length} survivor mode pools`);

        for (const pickData of allSurvivorPicks) {
            const { username, poolName, picks } = pickData;
            
            // For each pick in the user's picks, add it to their survivor history
            if (picks && Array.isArray(picks) && picks.length > 0) {
                // Process each pick in the user's picks array
                for (const pick of picks) {
                    // Add current week to the pick data
                    const pickWithWeek = {
                        week: currentWeek,
                        pick: pick
                    };
                    
                    // Check if this pick for this week already exists to avoid duplicates
                    const existingRecord = await survivorPastPicksCollection.findOne({
                        username: username.toLowerCase(),
                        poolName: poolName,
                        "pastPicks.week": currentWeek
                    });

                    if (!existingRecord) {
                        // Add the pick to the user's survivor history if no pick exists for this week
                        await survivorPastPicksCollection.updateOne(
                            { username: username.toLowerCase(), poolName: poolName },
                            { $push: { pastPicks: pickWithWeek } } as any,
                            { upsert: true }
                        );
                    } else {
                        console.log(`Week ${currentWeek} pick already exists for user ${username} in pool ${poolName}, skipping`);
                    }
                }
                
                console.log(`Saved week ${currentWeek} survivor pick for user ${username} in pool ${poolName}`);
            }
        }

        console.log(`Successfully saved all survivor picks for week ${currentWeek}`);
    } catch (error: any) {
        console.error('Error saving survivor picks:', error);
        throw new Error('Failed to save survivor picks');
    }
}
function getCurrentTimeInUTC4(): Date {
    const now = new Date();
    now.setHours(now.getHours() - 4); // Convert UTC to EST (UTC-4)
    return now;
}

// Function to update the Thursday deadline 
/* old function w out sunday
export async function updateThursdayDeadline(): Promise<void> {
    const now = getCurrentTimeInUTC4();

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
    }*/

        export async function updateThursdayDeadline(): Promise<void> {
            const now = getCurrentTimeInUTC4();
            const nextThursday = new Date(now);
            nextThursday.setDate(nextThursday.getDate() + ((4 + 7 - now.getDay()) % 7));
            nextThursday.setHours(19, 0, 0, 0); // 7 PM EST
            nextThursday.setMinutes(nextThursday.getMinutes() + nextThursday.getTimezoneOffset());
            nextThursday.setHours(nextThursday.getHours() - 4); // Convert UTC to EST (UTC-4)
        
            // Calculate Sunday reveal time (next Sunday at 12 PM EST)
            const nextSunday = new Date(nextThursday);
            nextSunday.setDate(nextSunday.getDate() + ((0 + 7 - nextThursday.getDay()) % 7));
            nextSunday.setHours(12, 0, 0, 0); // 12 PM EST
            nextSunday.setMinutes(nextSunday.getMinutes() + nextSunday.getTimezoneOffset());
            nextSunday.setHours(nextSunday.getHours() - 4);
        
            try {
                const database = await connectToDatabase();
                const timeWindowCollection = database.collection('timewindows');
                await timeWindowCollection.updateOne(
                    {},
                    { 
                        $set: { 
                            thursdayDeadline: nextThursday,
                            sundayDeadline: nextSunday
                        }
                    },
                    { upsert: true }
                );
                console.log('Thursday deadline and Sunday reveal time updated successfully.');
            } catch (error) {
                console.error('Error updating deadlines:', error);
                throw error;
            }
        }
        
// Function to update the Tuesday start time
export async function updateTuesdayStartTime(): Promise<void> {
    const now = getCurrentTimeInUTC4();
    const nextTuesday = new Date(now);
    nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - now.getDay()) % 7));
    nextTuesday.setHours(0, 0, 0, 0); // 12 AM EST
    nextTuesday.setMinutes(nextTuesday.getMinutes() + nextTuesday.getTimezoneOffset());
    nextTuesday.setHours(nextTuesday.getHours() - 4 ); // Convert UTC to EST (UTC-4)


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

export async function initializeWeek() {
    const database = await connectToDatabase();
    const weeksCollection = database.collection('weeks');
    
    // Check if a current week record exists
    const currentWeek = await weeksCollection.findOne({ identifier: 'currentWeek' });
    
    if (!currentWeek) {
      // Create the initial week record
      await weeksCollection.insertOne({
        identifier: 'currentWeek',
        week: 1,
        lastUpdated: new Date()
      });
      console.log('Initialized week to 1');
      return 1;
    }
    
    return currentWeek.week;
  }
  
  // Get the current week
  export async function getCurrentWeek() {
    const database = await connectToDatabase();
    const weeksCollection = database.collection('weeks');
    
    const currentWeek = await weeksCollection.findOne({ identifier: 'currentWeek' });
    return currentWeek ? currentWeek.week : await initializeWeek();
  }
  
  // Increment the week
  export async function incrementWeek() {
    const database = await connectToDatabase();
    const weeksCollection = database.collection('weeks');
    
    const result: any = await weeksCollection.findOneAndUpdate(
      { identifier: 'currentWeek' },
      { 
        $inc: { week: 1 },
        $set: { lastUpdated: new Date() }
      },
      { returnDocument: 'after' }
    );
    
    if (!result.value) {
      return await initializeWeek();
    }
    
    console.log(`Incremented week to ${result.value.week}`);
    return result.value.week;
  }
  
  // Set the week to a specific value
  export async function setWeek(weekNumber: number) {
    if (weekNumber < 1 || weekNumber > 18) {
      throw new Error('Week number must be between 1 and 18');
    }
    
    const database = await connectToDatabase();
    const weeksCollection = database.collection('weeks');
    
    const result: any = await weeksCollection.findOneAndUpdate(
      { identifier: 'currentWeek' },
      { 
        $set: { 
          week: weekNumber,
          lastUpdated: new Date()
        }
      },
      { 
        returnDocument: 'after',
        upsert: true 
      }
    );
    
    console.log(`Set week to ${result.value.week}`);
    return result.value.week;
  }