import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
const router = express.Router();

router.post('/api/savePicks/:username', async (req, res) => {
    try {
        const username = req.params.username;

        // Extract data from request
        const { picks, immortalLock } = req.body;

        // Connect to database
        const database = await connectToDatabase();
        console.log("Saving or updating picks for username:", username);
        const picksCollection = database.collection('userPicks');

        // Use the updateOne method with upsert option to ensure only one document per user
        await picksCollection.updateOne(
            { username }, 
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



router.post('/api/resetPicks/:username', async (req, res) => {
    try {
        const username = req.params.username;
        console.log("Deleting picks for username:", username);
        
        // Connect to the database
        const database = await connectToDatabase();
        const picksCollection = database.collection('userPicks');
        
        // Delete the document with the specified username
        const result = await picksCollection.deleteOne({ username });

        // Check if any document was deleted
        if (result.deletedCount === 0) {
            console.log(`No document found for username: ${username}`);
            res.status(404).json({ success: false, message: 'Document not found' });
            return;
        }

        res.json({ success: true, message: 'Picks deleted successfully' });
    } catch (error) {
        console.error('Error deleting picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/api/getPicks/:username', async (req, res) => {
    try {
        const username = req.params.username;

        // Connect to database
        const database = await connectToDatabase();
       // console.log("Fetching picks for username:", username);
        const picksCollection = database.collection('userPicks');

        // Fetch user's picks
        const userPicksData = await picksCollection.findOne({ username });

        if (userPicksData) {
            res.json(userPicksData);
        } else {
            res.status(404).json({ message: 'No picks found for the given username' });
        }
    } catch (error) {
        console.error('Error fetching picks:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});


export default router;
