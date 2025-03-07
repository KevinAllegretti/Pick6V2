//pickRoutes.ts
import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
const router = express.Router();


router.post('/api/savePicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const { picks, immortalLock, results } = req.body;

        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');

        // Use the updateOne method with upsert option to create or update the document
        // Now we're including poolName in the query to identify the document
        await picksCollection.updateOne(
            { username: username.toLowerCase(), poolName }, 
            {
                $set: {
                    picks,
                    immortalLock
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving or updating picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});




// Include poolName in the route parameters
router.post('/api/resetPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');

        // Delete the document that matches both username and poolName
        const result = await picksCollection.deleteOne({ 
            username: username.toLowerCase(), 
            poolName 
        });

        if (result.deletedCount === 0) {
            res.status(404).json({ success: false, message: 'Document not found' });
        } else {
            res.json({ success: true, message: 'Picks deleted successfully' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});



router.get('/api/getPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');

        // Query the collection using both username and poolName
        const userPicksData = await picksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });

        if (userPicksData) {
            res.json(userPicksData);
        } else {
            res.status(404).json({ message: 'No picks found for the given username in this pool' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});




// picksRoutes.js
router.post('/api/saveWeeklyPicks', async (req, res) => {
    const { picks } = req.body; // Your NFL transformed data
    try {
        const database = await connectToDatabase();
        const picksCollection = database.collection('weeklyPicks');
        await picksCollection.updateOne(
            { identifier: 'current' },
            { $set: { picks: picks, updated: new Date() } },
            { upsert: true }
        );
        res.json({ success: true, message: 'Picks saved successfully' });
    } catch (error:any) {
        console.error('Failed to save picks:', error);
        res.status(500).json({ success: false, message: 'Failed to save picks', error: error.toString() });
    }
});

router.get('/api/getWeeklyPicks', async (req, res) => {
    try {
        const database = await connectToDatabase();
        const picksCollection = database.collection('weeklyPicks');
        const currentPicks = await picksCollection.findOne({ identifier: 'current' });

        if (currentPicks && Array.isArray(currentPicks.picks)) {
            res.json(currentPicks.picks);
        } else {
            res.json([]); // Always return an array, even if empty
        }
    } catch (error:any) {
        console.error('Failed to retrieve picks:', error);
        res.status(500).json({ message: 'Server error', error: error.toString() });
    }
});

// picksRoutes.js
// API endpoint to store the results of the bets
router.post('/api/saveResults', async (req, res) => {
    const { results } = req.body;
    try {
        const database = await connectToDatabase();
        const resultsCollection = database.collection('betResultsGlobal');
        // Store results with a static identifier
        await resultsCollection.updateOne(
            { identifier: 'currentResults' },
            { $set: { results, updated: new Date() }},
            { upsert: true }
        );
        res.json({ success: true, message: 'Results saved successfully' });
    } catch (error:any) {
        console.error('Failed to save results:', error);
        res.status(500).json({ success: false, message: 'Failed to save results', error: error.toString() });
    }
});

router.delete('/api/deleteResults', async (req, res) => {
    try {
        const database = await connectToDatabase();
        const resultsCollection = database.collection('betResultsGlobal');
        await resultsCollection.deleteMany({});
        res.json({ success: true, message: 'Results deleted successfully' });
    } catch (error:any) {
        console.error('Failed to delete results:', error);
        res.status(500).json({ success: false, message: 'Failed to delete results', error: error.toString() });
    }
});



router.get('/api/getResults', async (req, res) => {
    try {
        const database = await connectToDatabase();
        const resultsCollection = database.collection('betResultsGlobal');
        const currentResults = await resultsCollection.findOne({ identifier: 'currentResults' });

        if (currentResults) {
            res.json({ success: true, results: currentResults.results });
        } else {
            res.json({ success: false, results: [], message: 'No results found' });
        }
    } catch (error:any) {
        console.error('Failed to fetch results:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.toString() });
    }
});

router.post('/api/savePicksToLastWeek', async (req, res) => {
    try {
        const { allPicks } = req.body;

        const database = await connectToDatabase();
        const lastWeeksPicksCollection = database.collection('lastWeeksPicks');

        for (const { username, poolName, picks, immortalLockPick } of allPicks) {
            await lastWeeksPicksCollection.updateOne(
                { username: username, poolName: poolName },
                { $set: { picks: picks, immortalLockPick: immortalLockPick } },
                { upsert: true }
            );
        }

        res.json({ success: true, message: 'Picks saved to last week collection successfully' });
    } catch (error:any) {
        console.error('Error saving picks to last week collection:', error);
        res.status(500).json({ success: false, message: 'Failed to save picks to last week collection' });
    }
});

router.get('/api/getLastWeekPicks/:username/:poolName', async (req, res) => {
    const { username, poolName } = req.params;
    const lowercaseUsername = username.toLowerCase();
    // console.log(`Server received: username = ${lowercaseUsername}, poolName = ${poolName}`);
   
    try {
    const database = await connectToDatabase();
    const lastWeeksPicksCollection = database.collection('lastWeeksPicks');
   
    const userPicks = await lastWeeksPicksCollection.findOne({ username: lowercaseUsername, poolName });
   // console.log('User picks found:', userPicks);
   
    if (userPicks) {
    res.json({ success: true, picks: userPicks.picks, immortalLockPick: userPicks.immortalLockPick });
    } else {
    res.json({ success: false, picks: [], immortalLockPick: [] });
    }
    } catch (error) {
    console.error('Error fetching last week picks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch last week picks' });
    }
   });
   


// New route to get picks from all pools for a user
router.get('/api/getAllUserPicks/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        const poolsCollection = database.collection('pools');

        // Get all pools the user is in
        const userPools = await poolsCollection.find({
            'members.username': username.toLowerCase()
        }).toArray();

        // Get picks from all pools
        const allPicks = await Promise.all(userPools.map(async pool => {
            const userPicksData = await picksCollection.findOne({
                username: username.toLowerCase(),
                poolName: pool.name
            });
            return userPicksData || { picks: [], immortalLock: [] };
        }));

        // Combine picks from all pools
        const combinedPicks = {
            picks: allPicks.flatMap(p => p.picks || []),
            immortalLocks: allPicks.flatMap(p => p.immortalLock || [])
        };

        res.json(combinedPicks);
    } catch (error) {
        console.error('Error fetching all user picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Modified existing routes to handle single pool operations
router.post('/api/savePicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const { picks, immortalLock } = req.body;

        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');

        await picksCollection.updateOne(
            { 
                username: username.toLowerCase(), 
                poolName 
            },
            {
                $set: {
                    picks,
                    immortalLock
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add this route to your pickRoutes.ts file

router.get('/api/getSurvivorPastPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const survivorPastPicksCollection = database.collection('survivorPastPicks');

        // Find all past picks for this user in this survivor pool
        const userSurvivorPicks = await survivorPastPicksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });

        if (userSurvivorPicks && userSurvivorPicks.pastPicks) {
            // Return the full history of picks with their weeks
            res.json({
                success: true,
                pastPicks: userSurvivorPicks.pastPicks
            });
        } else {
            // User has no survivor history yet
            res.json({
                success: true,
                pastPicks: []
            });
        }
    } catch (error) {
        console.error('Error fetching survivor past picks:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch survivor past picks',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Add an additional helper route to get just the team names that have been picked
router.get('/api/getSurvivorPickedTeams/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const survivorPastPicksCollection = database.collection('survivorPastPicks');

        // Find all past picks for this user in this survivor pool
        const userSurvivorPicks = await survivorPastPicksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });

        if (userSurvivorPicks && userSurvivorPicks.pastPicks) {
            // Extract just the team names for easier frontend filtering
            const pickedTeams = userSurvivorPicks.pastPicks.map(pickData => pickData.pick.teamName);
            
            res.json({
                success: true,
                pickedTeams
            });
        } else {
            // User has no survivor history yet
            res.json({
                success: true,
                pickedTeams: []
            });
        }
    } catch (error) {
        console.error('Error fetching survivor picked teams:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch survivor picked teams',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

// Add these routes to your pickRoutes.ts file to handle playoff picks

// Route to save playoff picks specifically
router.post('/api/savePlayoffPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const { picks, immortalLock } = req.body;

        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');

        // Use playoff_ prefix to distinguish playoff picks
        const playoffPoolName = `playoff_${poolName}`;

        // Get current week from the pools collection to include in picks
        const poolsCollection = database.collection('pools');
        const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
        
        if (!pool || !pool.playoffCurrentWeek) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pool not found or not in playoff mode' 
            });
        }

        // Add current playoff week to the picks data
        const playoffWeek = pool.playoffCurrentWeek;

        // Use the updateOne method with upsert option to create or update the document
        await picksCollection.updateOne(
            { 
                username: username.toLowerCase(), 
                poolName: playoffPoolName,
                week: playoffWeek
            }, 
            {
                $set: {
                    picks,
                    immortalLock,
                    week: playoffWeek
                }
            },
            { upsert: true }
        );
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error saving or updating playoff picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Route to retrieve playoff picks specifically
router.get('/api/getPlayoffPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        const poolsCollection = database.collection('pools');

        // First check if the pool is in playoff mode
        const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
        
        if (!pool || !pool.playoffCurrentWeek) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pool not found or not in playoff mode' 
            });
        }

        // Use playoff_ prefix to retrieve playoff picks
        const playoffPoolName = `playoff_${poolName}`;
        const playoffWeek = pool.playoffCurrentWeek;

        // Query the collection using both username, playoff pool name, and week
        const userPicksData = await picksCollection.findOne({
            username: username.toLowerCase(),
            poolName: playoffPoolName,
            week: playoffWeek
        });

        if (userPicksData) {
            res.json({
                ...userPicksData,
                isPlayoffPicks: true,
                playoffWeek
            });
        } else {
            res.status(404).json({ 
                message: 'No playoff picks found for the given username in this pool' 
            });
        }
    } catch (error) {
        console.error('Error retrieving playoff picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Modify existing getPicks route to check if a pool is in playoff mode
router.get('/api/getPicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        
        // Check if this is already a playoff pool request (has playoff_ prefix)
        const isPlayoffRequest = poolName.startsWith('playoff_');
        
        if (isPlayoffRequest) {
            // Handle direct playoff request
            const userPicksData = await picksCollection.findOne({
                username: username.toLowerCase(),
                poolName
            });

            if (userPicksData) {
                res.json(userPicksData);
            } else {
                res.status(404).json({ message: 'No playoff picks found for the given username in this pool' });
            }
            return;
        }
        
        // If not an explicit playoff request, check if the pool is in playoff mode
        const poolsCollection = database.collection('pools');
        const pool = await poolsCollection.findOne({ name: poolName });
        
        const currentWeek = await getCurrentWeek(); // Assuming you have this function
        const isPlayoffWeek = currentWeek >= 14 && currentWeek <= 17;
        const isPlayoffPool = pool?.hasPlayoffs && isPlayoffWeek;
        
        // If it's a playoff pool and in playoff weeks, check for playoff picks first
        if (isPlayoffPool) {
            const playoffPoolName = `playoff_${poolName}`;
            const playoffPicksData = await picksCollection.findOne({
                username: username.toLowerCase(),
                poolName: playoffPoolName,
                week: pool.playoffCurrentWeek || currentWeek
            });
            
            if (playoffPicksData) {
                // Return playoff picks if they exist
                res.json({
                    ...playoffPicksData,
                    isPlayoffPicks: true,
                    playoffWeek: pool.playoffCurrentWeek || currentWeek
                });
                return;
            }
        }
        
        // If we get here, either it's not a playoff pool or no playoff picks were found
        // Fall back to regular pool picks
        const userPicksData = await picksCollection.findOne({
            username: username.toLowerCase(),
            poolName
        });

        if (userPicksData) {
            res.json(userPicksData);
        } else {
            res.status(404).json({ message: 'No picks found for the given username in this pool' });
        }
    } catch (error) {
        console.error('Error fetching picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Add a route to check if a pool is in playoff mode
router.get('/api/isPlayoffPool/:poolName', async (req, res) => {
    try {
        const { poolName } = req.params;
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');
        
        const pool = await poolsCollection.findOne({ name: poolName });
        if (!pool) {
            return res.status(404).json({ success: false, message: 'Pool not found' });
        }
        
        const currentWeek = await getCurrentWeek(); // Assuming you have this function
        const isPlayoffWeek = currentWeek >= 14 && currentWeek <= 17;
        const isPlayoffPool = pool.hasPlayoffs && isPlayoffWeek;
        
        res.json({
            success: true,
            poolName,
            isPlayoffPool,
            playoffCurrentWeek: pool.playoffCurrentWeek || null,
            currentWeek
        });
    } catch (error) {
        console.error('Error checking playoff status:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// Import current week helper if needed
async function getCurrentWeek() {
    try {
        const database = await connectToDatabase();
        const weeksCollection = database.collection('weeks');
        
        const currentWeek = await weeksCollection.findOne({ identifier: 'currentWeek' });
        return currentWeek ? currentWeek.week : 1;
    } catch (error) {
        console.error('Error fetching current week:', error);
        return 1; // Default to week 1 if error
    }
}

export default router;