import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import { ObjectId } from 'mongodb';

const router = express.Router();

// At the top of your golfRoutes.ts file
router.get('/test-golf-route', (req, res) => {
    res.json({ message: 'Golf routes are working' });
  });
/**
 * Get tournament golfers from pgaChampionshipOdds collection
 * @route GET /api/getTournamentGolfers
 */
router.get('/getTournamentGolfers', async (req, res) => {
    try {
        const database = await connectToDatabase();
        const pgaChampionshipOdds = database.collection('pgaChampionshipOdds');
        
        // Changed tournamentName to tournament
        const tournament = await pgaChampionshipOdds.findOne(
            { tournament: "PGA Championship Winner" }, 
            { sort: { fetchedAt: -1 } }
        );
        
        if (!tournament) {
            console.error('No tournament data found in pgaChampionshipOdds collection');
            return res.status(404).json({ 
                success: false, 
                message: 'No tournament data found'
            });
        }
        
        console.log(`Found tournament data: ${tournament.tournament} with ${tournament.golferOdds?.length || 0} golfers`);
        
        // Extract golfer data from the tournament
        const golfers = Array.isArray(tournament.golferOdds) 
            ? tournament.golferOdds.map((golfer) => ({
                name: golfer.name,
                odds: golfer.odds,
                oddsDisplay: golfer.oddsDisplay
            }))
            : [];
        
        // Sort golfers by odds (lowest to highest - better odds first)
        golfers.sort((a, b) => {
            const oddsA = parseInt(a.odds);
            const oddsB = parseInt(b.odds);
            return oddsA - oddsB;
        });
        
        res.json(golfers);
    } catch (error) {
        console.error('Error fetching tournament golfers:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch tournament golfers' 
        });
    }
});

/**
 * Get pool state (IdleTime, DraftTime, PlayTime)
 * @route GET /api/getPoolState/:poolName
 */
router.get('/getPoolState/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');
        
        const pool = await poolsCollection.findOne({ name: poolName, mode: 'golf' });
        
        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool not found or not a golf pool' });
        }
        
        res.json({
            idleTime: pool.idleTime || false,
            draftTime: pool.draftTime || false,
            playTime: pool.playTime || false
        });
    } catch (error) {
        console.error('Error fetching pool state:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pool state' });
    }
});

/**
 * Get user's golf picks for a specific pool
 * @route GET /api/getUserGolfPicks/:username/:poolName
 */
router.get('/getUserGolfPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        
        const database = await connectToDatabase();
        const userGolfPicksCollection = database.collection('userGolfPicks');
        
        const userPicks = await userGolfPicksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });
        
        if (!userPicks) {
            return res.json({ success: true, picks: [] });
        }
        
        res.json({ success: true, picks: userPicks.golfers || [] });
    } catch (error) {
        console.error('Error fetching user golf picks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user golf picks' });
    }
});

/**
 * Get all users' golf picks for a pool
 * @route GET /api/getAllGolfPicks/:poolName
 */
router.get('/getAllGolfPicks/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        
        const database = await connectToDatabase();
        const userGolfPicksCollection = database.collection('userGolfPicks');
        
        const allPicks = await userGolfPicksCollection.find({ poolName }).toArray();
        
        const picksObj: Record<string, any[]> = {};
        allPicks.forEach(userPick => {
            picksObj[userPick.username] = userPick.golfers || [];
        });
        
        res.json({ success: true, picks: picksObj });
    } catch (error) {
        console.error('Error fetching all golf picks:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch all golf picks' });
    }
});
/**
 * Get current draft state for a pool
 * @route GET /api/getDraftState/:poolName
 */
router.get('/getDraftState/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        
        const database = await connectToDatabase();
        const golfDraftStateCollection = database.collection('golfDraftState');
        
        const draftState = await golfDraftStateCollection.findOne({ poolName });
        
        if (!draftState) {
            return res.status(404).json({ success: false, message: 'Draft state not found' });
        }
        
        // Calculate remaining time
        const now: any = new Date();
        const turnExpiresAt = draftState.turnExpiresAt || now;
        const timeRemainingMs = Math.max(0, turnExpiresAt - now);
        const timeRemainingSeconds = Math.ceil(timeRemainingMs / 1000);
        
        res.json({
            currentRound: draftState.currentRound || 1,
            currentTurn: draftState.currentTurn || 0,
            draftOrder: draftState.draftOrder || [],
            turnExpiresAt: draftState.turnExpiresAt,
            timeRemainingSeconds: timeRemainingSeconds
        });
    } catch (error) {
        console.error('Error fetching draft state:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch draft state' });
    }
});

// Inside golfRoutes.ts

/**
 * Submit a golf pick
 * @route POST /api/submitGolfPick/:username/:poolName
 */
router.post('/submitGolfPick/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const pick = req.body;

        // Validate required fields
        if (!pick.golferName || !pick.round) {
            return res.status(400).json({ success: false, message: 'Golfer name and round are required' });
        }

        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');
        const golfDraftStateCollection = database.collection('golfDraftState');
        const userGolfPicksCollection = database.collection('userGolfPicks');

        // Get the pool to check if it's in draft mode
        const pool = await poolsCollection.findOne({ name: poolName, mode: 'golf' });
        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool not found or not a golf pool' });
        }

        if (!pool.draftTime) {
            return res.status(400).json({ success: false, message: 'Pool is not in draft mode' });
        }

        // Get the draft state
        const draftState = await golfDraftStateCollection.findOne({ poolName });
        if (!draftState) {
            return res.status(404).json({ success: false, message: 'Draft state not found' });
        }

        // --- CORRECTED BACKEND TURN VALIDATION ---
        let expectedUserForTurn = 'Unknown';
        const numberOfDrafters = draftState.draftOrder ? draftState.draftOrder.length : 0;

        if (draftState.draftOrder && numberOfDrafters > 0) {
            const isEvenRound = draftState.currentRound % 2 === 0;

            if (isEvenRound) {
                // Even round (snake): Calculate the index from the end
                const reverseIndex = numberOfDrafters - 1 - draftState.currentTurn;
                if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                    expectedUserForTurn = draftState.draftOrder[reverseIndex];
                } else {
                    console.error(`Backend Validation Error: Calculated Reverse Index ${reverseIndex} out of bounds.`);
                }
            } else {
                // Odd round (normal): Use the currentTurn index directly
                if (draftState.currentTurn >= 0 && draftState.currentTurn < numberOfDrafters) {
                    expectedUserForTurn = draftState.draftOrder[draftState.currentTurn];
                } else {
                     console.error(`Backend Validation Error: Current Turn Index ${draftState.currentTurn} out of bounds.`);
                }
            }
            console.log(`Backend Validation: Round ${draftState.currentRound}, Turn ${draftState.currentTurn}, Expected User: ${expectedUserForTurn}`);
        } else {
             console.error(`Backend Validation Error: Draft order not found or empty for pool ${poolName}`);
        }

        // Compare the calculated expected user (lowercase) with the user making the request (lowercase)
        // Auto-selected picks (from timer expiration) are exempt from this validation
        if (!pick.autoSelected && expectedUserForTurn.toLowerCase() !== username.toLowerCase()) {
             console.error(`Turn Validation Failed (Backend): Expected ${expectedUserForTurn}, Got ${username}. Round: ${draftState.currentRound}, Turn Index: ${draftState.currentTurn}`);
            // Send the specific error message that the frontend is receiving
            return res.status(400).json({ success: false, message: 'It is not your turn to draft' });
        }
        // --- END OF CORRECTION ---

        // Check if already picked in this round (Existing logic)
        const userPicks = await userGolfPicksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });

        if (userPicks && userPicks.golfers) {
            const existingRoundPick = userPicks.golfers.find((g) => g.round === pick.round);
            if (existingRoundPick) {
                return res.status(400).json({ success: false, message: 'You already made a pick for this round' });
            }
        }

        // Check if this golfer is already picked (Existing logic)
        const allPoolPicks = await userGolfPicksCollection.find({ poolName }).toArray();
        for (const userPickDoc of allPoolPicks) {
            // Ensure userPickDoc.golfers exists and is an array
            if (userPickDoc.golfers && Array.isArray(userPickDoc.golfers)) {
                const golferAlreadyPicked = userPickDoc.golfers.find((g) => g.golferName === pick.golferName);
                if (golferAlreadyPicked) {
                    return res.status(400).json({ success: false, message: `This golfer (${pick.golferName}) has already been drafted by ${userPickDoc.username}` });
                }
            }
        }

        // Save the pick (Existing logic)
        await userGolfPicksCollection.updateOne(
            { username: username.toLowerCase(), poolName },
            {
                $push: { golfers: pick },
                $setOnInsert: { username: username.toLowerCase(), poolName }
            },
            { upsert: true }
        );

        // Update the draft state to advance to the next user's turn (Existing logic)
        const nextTurn = (draftState.currentTurn + 1) % numberOfDrafters;
        let nextRound = draftState.currentRound;

        // If we've gone through all users AND it's not the last round, increment the round
        // Ensure numberOfDrafters is valid before checking nextTurn
        if (numberOfDrafters > 0 && nextTurn === 0 && draftState.currentRound < 6) {
            nextRound++;
        }

        // Check if draft is complete (after round 6 pick by the last person in that round's sequence)
        let isComplete = false;
        // Draft is complete if it was the last turn of the last round
        if (draftState.currentRound === 6 && nextTurn === 0 && numberOfDrafters > 0) {
           isComplete = true;
           console.log(`Draft for pool ${poolName} marked as complete.`);
        }

        await golfDraftStateCollection.updateOne(
            { poolName },
            {
                $set: {
                    currentTurn: nextTurn,
                    currentRound: nextRound,
                    isComplete: isComplete,
                    lastTurnStartedAt: new Date(),
                    turnExpiresAt: new Date(Date.now() + 60000)  // 60 seconds from now
                }
            }
        );

        // If draft is complete, update pool state to PlayTime (Existing logic)
        if (isComplete) {
            await poolsCollection.updateOne(
                { name: poolName, mode: 'golf' },
                {
                    $set: {
                        idleTime: false,
                        draftTime: false,
                        playTime: true
                    }
                }
            );
            console.log(`Pool state for ${poolName} updated to PlayTime.`);
        }

        res.json({ 
            success: true, 
            message: 'Pick submitted successfully',
            autoSelected: pick.autoSelected || false
        });

    } catch (error) {
        console.error('Error submitting golf pick:', error);
        res.status(500).json({ success: false, message: 'Failed to submit golf pick' });
    }
});
/**
 * Start the draft for a pool (Admin only)
 * @route POST /api/startGolfDraft/:poolName
*/
router.post('/startGolfDraft/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        const { username } = req.body;
        
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');
        const golfDraftStateCollection = database.collection('golfDraftState');
        
        // Verify the user is an admin of the pool
        const pool = await poolsCollection.findOne({ 
            name: poolName, 
            mode: 'golf', 
            adminUsername: username.toLowerCase() 
        });
        
        if (!pool) {
            return res.status(403).json({ 
                success: false, 
                message: 'Only the pool admin can start the draft or pool not found' 
            });
        }
        
        // Check if the pool is in idle time
        if (!pool.idleTime) {
            return res.status(400).json({ 
                success: false, 
                message: 'Pool is not in idle time, draft may have already started' 
            });
        }
        
        // Get all users in the pool
        const members = pool.members || [];
        if (members.length === 0) {
            return res.status(400).json({ success: false, message: 'No members in the pool' });
        }
        
        if (members.length > 6) {
            return res.status(400).json({ success: false, message: 'Maximum 6 members allowed in a golf pool' });
        }
        
        // Create a randomized draft order
        const draftOrder = members.map((member) => member.username);
        // Fisher-Yates shuffle algorithm
        for (let i = draftOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [draftOrder[i], draftOrder[j]] = [draftOrder[j], draftOrder[i]];
        }
        
        // Create snake draft order for all 6 rounds
        const fullDraftOrder: string[] = [];
        for (let round = 1; round <= 6; round++) {
            if (round % 2 === 1) {
                // Odd rounds go in order
                fullDraftOrder.push(...draftOrder);
            } else {
                // Even rounds go in reverse order (snake)
                fullDraftOrder.push(...draftOrder.slice().reverse());
            }
        }
        
        // Create or update draft state
        await golfDraftStateCollection.updateOne(
            { poolName },
            {
                $set: {
                    poolName,
                    currentRound: 1,
                    currentTurn: 0,
                    draftOrder,
                    fullDraftSequence: fullDraftOrder,
                    isComplete: false,
                    startedAt: new Date(),
                    lastTurnStartedAt: new Date(),
                    turnExpiresAt: new Date(Date.now() + 60000)  // 60 seconds from now
                }
            },
            { upsert: true }
        );
        
        // Update pool state to DraftTime
        await poolsCollection.updateOne(
            { name: poolName, mode: 'golf' },
            { 
                $set: { 
                    idleTime: false,
                    draftTime: true,
                    playTime: false 
                }
            }
        );
        
        res.json({ 
            success: true, 
            message: 'Draft started successfully',
            draftOrder,
            currentTurn: 0,
            currentRound: 1
        });
    } catch (error) {
        console.error('Error starting draft:', error);
        res.status(500).json({ success: false, message: 'Failed to start draft' });
    }
});
// Add this to your golfRoutes.ts file
router.get('/golfPicks/:username/:poolName', async (req, res) => {
    try {
      const { username, poolName } = req.params;
      
      const database = await connectToDatabase();
      const userGolfPicksCollection = database.collection('userGolfPicks');
      
      const userPicks = await userGolfPicksCollection.findOne({
        username: username.toLowerCase(),
        poolName
      });
      
      if (!userPicks) {
        return res.json({ success: true, picks: [] });
      }
      
      res.json({ success: true, picks: userPicks.golfers || [] });
    } catch (error) {
      console.error('Error fetching golf picks:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch golf picks' });
    }
  });
 

  /**
 * Auto-select the best available golfer for a user
 * @param {string} username - The username to make the pick for
 * @param {string} poolName - The pool name
 * @param {number} round - The current draft round
 */
export async function autoSelectBestGolferForUser(username, poolName, round) {
    try {
        const database = await connectToDatabase();
        const userGolfPicksCollection = database.collection('userGolfPicks');
        const pgaChampionshipOdds = database.collection('pgaChampionshipOdds');
        
        // Get all golfers from tournament
        const tournament = await pgaChampionshipOdds.findOne(
            { tournament: "PGA Championship Winner" }, 
            { sort: { fetchedAt: -1 } }
        );
        
        if (!tournament || !tournament.golferOdds) {
            console.error('No tournament data found for auto-selection');
            return;
        }
        
        // Get all existing picks in this pool
        const allPoolPicks = await userGolfPicksCollection.find({ poolName }).toArray();
        
        // Find available golfers (not already picked)
        const availableGolfers = tournament.golferOdds.filter(golfer => {
            let isPicked = false;
            
            allPoolPicks.forEach(userPick => {
                if (userPick.golfers && Array.isArray(userPick.golfers)) {
                    const found = userPick.golfers.find(g => g.golferName === golfer.name);
                    if (found) isPicked = true;
                }
            });
            
            return !isPicked;
        });
        
        // Sort golfers by odds (lowest to highest)
        availableGolfers.sort((a, b) => {
            const oddsA = parseInt(a.odds);
            const oddsB = parseInt(b.odds);
            return oddsA - oddsB;
        });
        
        // Get best available golfer
        const bestGolfer = availableGolfers[0];
        
        if (!bestGolfer) {
            console.error('No available golfers for auto-selection');
            return;
        }
        
        // Create the pick
        const pickData = {
            golferName: bestGolfer.name,
            round: round,
            odds: bestGolfer.odds,
            oddsDisplay: bestGolfer.oddsDisplay,
            timestamp: new Date().toISOString(),
            autoSelected: true
        };
        
        // Save pick to database
        await userGolfPicksCollection.updateOne(
            { username: username.toLowerCase(), poolName },
            {
                $push: { golfers: pickData } as any,
                $setOnInsert: { username: username.toLowerCase(), poolName }
            },
            { upsert: true }
        );
        
        // Update draft state
        await updateDraftStateAfterPick(poolName);
        
        console.log(`Auto-selected ${bestGolfer.name} for user ${username} in pool ${poolName}`);
        
    } catch (error) {
        console.error('Error in auto-selecting golfer:', error);
    }
}

/**
 * Update draft state after a pick
 * @param {string} poolName - The pool name
 */
async function updateDraftStateAfterPick(poolName) {
    try {
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');
        const golfDraftStateCollection = database.collection('golfDraftState');
        
        // Get current draft state
        const draftState = await golfDraftStateCollection.findOne({ poolName });
        if (!draftState) return;
        
        const numberOfDrafters = draftState.draftOrder ? draftState.draftOrder.length : 0;
        
        // Calculate next turn and round
        const nextTurn = (draftState.currentTurn + 1) % numberOfDrafters;
        let nextRound = draftState.currentRound;
        
        if (numberOfDrafters > 0 && nextTurn === 0 && draftState.currentRound < 6) {
            nextRound++;
        }
        
        // Check if draft is complete
        let isComplete = false;
        if (draftState.currentRound === 6 && nextTurn === 0 && numberOfDrafters > 0) {
           isComplete = true;
           console.log(`Draft for pool ${poolName} marked as complete.`);
        }
        
        // Update draft state
        await golfDraftStateCollection.updateOne(
            { poolName },
            {
                $set: {
                    currentTurn: nextTurn,
                    currentRound: nextRound,
                    isComplete: isComplete,
                    lastTurnStartedAt: new Date(),
                    turnExpiresAt: new Date(Date.now() + 60000)  // 60 seconds from now
                }
            }
        );
        
        // If draft is complete, update pool state to PlayTime
        if (isComplete) {
            await poolsCollection.updateOne(
                { name: poolName, mode: 'golf' },
                {
                    $set: {
                        idleTime: false,
                        draftTime: false,
                        playTime: true
                    }
                }
            );
        }
    } catch (error) {
        console.error('Error updating draft state after auto-pick:', error);
    }
}

/**
 * Get golf scores for a pool
 * @route GET /api/getGolfScores/:poolName
 */
router.get('/getGolfScores/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        
        const database = await connectToDatabase();
        const userGolfPicksCollection = database.collection('userGolfPicks');
        const golfResultsCollection = database.collection('golfBetResults');
        
        // Get all users' picks for this pool
        const userPicks = await userGolfPicksCollection.find({
            poolName
        }).toArray();
        
        // Get all users' results for this pool - this has the correct totalScore
        const golfResults = await golfResultsCollection.find({
            poolName
        }).toArray();
        
        console.log('Golf results from DB:', golfResults); // Add this to see what's coming from DB
        
        // Combine the data
        const combinedData = userPicks.map(userPick => {
            // Find the corresponding result
            const result = golfResults.find(r => 
                r.username.toLowerCase() === userPick.username.toLowerCase()
            );
            
            // Format scores for display
            const formattedGolfers = (userPick.golfers || []).map(golfer => {
                return {
                    ...golfer,
                    // Use scoreDisplay if it exists, otherwise format it
                    scoreDisplay: golfer.scoreDisplay || (
                        golfer.score === 0 ? "E" : 
                        golfer.score > 0 ? `+${golfer.score}` : 
                        `${golfer.score}`
                    )
                };
            });
            
            // IMPORTANT: Use the values from golfResults which have the correct calculations
            return {
                username: userPick.username,
                golfers: formattedGolfers,
                totalScore: result?.totalScore || 0,
                // Use totalScoreDisplay directly from database if available
                totalScoreDisplay: result?.totalScoreDisplay || (
                    (result?.totalScore === 0) ? "E" : 
                    (result?.totalScore > 0) ? `+${result?.totalScore}` : 
                    `${result?.totalScore || 0}`
                )
            };
        });
        
        res.json({
            success: true,
            golfScores: combinedData
        });
    } catch (error) {
        console.error('Error fetching golf scores:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch golf scores' });
    }
});
export default router;