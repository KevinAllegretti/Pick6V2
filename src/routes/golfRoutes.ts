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
        
        res.json({
            currentRound: draftState.currentRound || 1,
            currentTurn: draftState.currentTurn || 0,
            draftOrder: draftState.draftOrder || []
        });
    } catch (error) {
        console.error('Error fetching draft state:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch draft state' });
    }
});

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
        
        // Verify it's this user's turn
        const currentTurnUser = draftState.draftOrder[draftState.currentTurn];
        if (currentTurnUser.toLowerCase() !== username.toLowerCase()) {
            return res.status(400).json({ success: false, message: 'It is not your turn to draft' });
        }
        
        // Check if already picked in this round
        const userPicks = await userGolfPicksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });
        
        if (userPicks && userPicks.golfers) {
            const existingRoundPick = userPicks.golfers.find((g: any) => g.round === pick.round);
            if (existingRoundPick) {
                return res.status(400).json({ success: false, message: 'You already made a pick for this round' });
            }
        }
        
        // Check if this golfer is already picked
        const allPoolPicks = await userGolfPicksCollection.find({ poolName }).toArray();
        for (const userPick of allPoolPicks) {
            const golferAlreadyPicked = userPick.golfers && userPick.golfers.find((g: any) => g.golferName === pick.golferName);
            if (golferAlreadyPicked) {
                return res.status(400).json({ success: false, message: 'This golfer has already been drafted' });
            }
        }
        
        // Save the pick
        await userGolfPicksCollection.updateOne(
            { username: username.toLowerCase(), poolName },
            { 
                $push: { golfers: pick },
                $setOnInsert: { username: username.toLowerCase(), poolName }
            },
            { upsert: true }
        );
        
        // Update the draft state to advance to the next user's turn
        const totalUsers = draftState.draftOrder.length;
        const nextTurn = (draftState.currentTurn + 1) % totalUsers;
        let nextRound = draftState.currentRound;
        
        // If we've gone through all users, increment the round
        if (nextTurn === 0 && draftState.currentRound < 6) {
            nextRound++;
        }
        
        // Check if draft is complete (after round 6)
        let isComplete = false;
        if (draftState.currentRound === 6 && nextTurn === 0) {
            isComplete = true;
        }
        
        await golfDraftStateCollection.updateOne(
            { poolName },
            { 
                $set: {
                    currentTurn: nextTurn,
                    currentRound: nextRound,
                    isComplete: isComplete
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
        
        res.json({ success: true, message: 'Pick submitted successfully' });
    } catch (error) {
        console.error('Error submitting golf pick:', error);
        res.status(500).json({ success: false, message: 'Failed to submit golf pick' });
    }
});

/**
 * Start the draft for a pool (Admin only)
 * @route POST /api/startGolfDraft/:poolName

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
        const draftOrder = members.map((member: any) => member.username);
        // Fisher-Yates shuffle algorithm
        for (let i = draftOrder.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [draftOrder[i], draftOrder[j]] = [draftOrder[j], draftOrder[i]];
        }
        
        // Create snake draft order for all 6 rounds
        const fullDraftOrder = [];
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
                    startedAt: new Date()
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
 */
export default router;