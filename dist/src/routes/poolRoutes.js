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
router.post('/manage-join', poolController_1.manageJoinRequest);
router.get('/get-all', async (req, res) => {
    try {
        const pools = await Pool_1.default.find();
        res.json(pools.map(pool => pool.toObject())); // 'adminUsername' is now a direct property of the pool object
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching pools', error });
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
exports.default = router;
