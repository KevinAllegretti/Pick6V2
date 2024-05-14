"use strict";
// src/routes/poolRoutes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const poolController_1 = require("../Controllers/poolController");
const Pool_1 = __importDefault(require("../models/Pool"));
const connectDB_1 = require("../microservices/connectDB");
//import { ObjectId } from 'mongodb';
const router = express_1.default.Router();
// Route to create a new pool
router.post('/create', poolController_1.createPool);
// Route to handle join pool requests
router.post('/joinByName', poolController_1.joinPoolByName);
// Route for admins to manage join requests
// Route to leave a pool
router.post('/leave/:username/:poolName', poolController_1.leavePool); // Add the leave pool route
router.get('/get-all', async (req, res) => {
    try {
        const pools = await Pool_1.default.find();
        res.json(pools.map(pool => pool.toObject())); // 'adminUsername' is now a direct property of the pool object
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pools', error });
    }
});
// In your routes file
router.get('/userPools/:username', async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        //console.log(`Fetching pools for user: ${username}`);
        const database = await (0, connectDB_1.connectToDatabase)();
        const poolsCollection = database.collection('pools');
        // Find pools where the members array contains the username
        const pools = await poolsCollection.find({
            'members.username': username
        }).toArray();
        res.json(pools);
    }
    catch (error) {
        console.error('Error fetching pools for user:', error);
        res.status(500).send('Internal server error');
    }
});
router.delete('/delete/:poolName', async (req, res) => {
    const poolName = req.params.poolName; //.toLowerCase();
    console.log(`Received delete request for pool with name: '${poolName}'`);
    const usernameHeader = req.headers['x-username'];
    if (typeof usernameHeader !== 'string' || !usernameHeader) {
        console.log('Username header is missing or not a string');
        return res.status(400).json({ message: 'Username header is required' });
    }
    try {
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection('users');
        const poolsCollection = db.collection('pools');
        const username = usernameHeader.toLowerCase();
        console.log(`Looking for admin user with username: '${username}'`);
        const adminUser = await usersCollection.findOne({ username });
        if (!adminUser) {
            console.log(`Admin user '${username}' not found.`);
            return res.status(404).json({ message: 'Admin user not found' });
        }
        console.log(`Looking for pool with name: '${poolName}'`);
        const pool = await poolsCollection.findOne({ name: poolName });
        if (!pool) {
            console.log(`Pool with name '${poolName}' not found.`);
            return res.status(404).json({ message: 'Pool not found' });
        }
        console.log(`Found pool with name '${poolName}':`, pool);
        if (pool.admin.toString() !== adminUser._id.toString()) {
            console.log(`User '${username}' is not authorized to delete pool with name '${poolName}'`);
            return res.status(403).json({ message: 'Not authorized to delete this pool' });
        }
        console.log(`Attempting to delete pool with name '${poolName}'`);
        const result = await poolsCollection.deleteOne({ name: poolName });
        console.log(`Delete result for pool with name '${poolName}':`, result);
        if (result.deletedCount === 0) {
            console.log(`No pool was deleted for name '${poolName}'`);
            return res.status(404).json({ message: 'No pool was deleted' });
        }
        console.log(`Pool with name '${poolName}' deleted successfully.`);
        res.json({ message: 'Pool deleted successfully' });
    }
    catch (error) {
        console.error(`Error deleting pool with name '${poolName}':`, error);
        res.status(500).json({ message: 'Error deleting pool', error });
    }
});
router.post('/updateUserPointsInPoolByName', async (req, res) => {
    const { username, additionalPoints, poolName } = req.body; // Using additionalPoints directly sent from client
    console.log("Received data for updating points:", req.body);
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const poolsCollection = database.collection('pools');
        // Attempt to increment the points for the specified user within the specified pool
        const updateResult = await poolsCollection.updateOne({ name: poolName, "members.username": username }, { $inc: { "members.$.points": additionalPoints } } // Directly increment points
        );
        /*
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "No matching pool or user found" });
        } */
        if (updateResult.modifiedCount === 0) {
            return res.status(406).json({ success: false, message: "No points updated, user might already have the updated value" });
        }
        res.json({ success: true, message: "User points updated successfully in pool" });
    }
    catch (error) {
        console.error("Error updating points:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});
router.post('/setUserPointsInPoolByName', async (req, res) => {
    const { username, points, poolName } = req.body;
    console.log("Received data for setting points:", req.body);
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const poolsCollection = database.collection('pools');
        // Set the points for the specified user in the specified pool
        const updateResult = await poolsCollection.updateOne({ name: poolName, "members.username": username }, { $set: { "members.$.points": points } } // Directly set points to the new value
        );
        if (updateResult.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "No matching pool or user found" });
        }
        if (updateResult.modifiedCount === 0) {
            return res.status(406).json({ success: false, message: "No points updated, possible data issue or unchanged value" });
        }
        res.json({ success: true, message: "User points set successfully in pool" });
    }
    catch (error) {
        console.error("Error setting points:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});
exports.default = router;
