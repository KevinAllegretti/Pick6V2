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



export default router;
