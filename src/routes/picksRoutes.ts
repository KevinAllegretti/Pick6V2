//pickRoutes.ts
import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
const router = express.Router();


router.post('/api/savePicks/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const { picks, immortalLock } = req.body;

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
       // console.log('Requested picks for:', req.params.username, 'in pool:', req.params.poolName);
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



export default router;
