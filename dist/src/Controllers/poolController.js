"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.joinPoolByName = exports.createPool = void 0;
const connectDB_1 = require("../microservices/connectDB");
const Pool_1 = __importDefault(require("../models/Pool")); // Assuming you have a Pool model set up as previously discussed
// Helper function to find user by username and return the user object
const findUserByUsername = async (username) => {
    const db = await (0, connectDB_1.connectToDatabase)();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username: username.toLowerCase() });
    return user;
};
const createPool = async (req, res) => {
    console.log('Request to create pool received:', req.body);
    try {
        let { name, adminUsername, isPrivate, password } = req.body;
        name = name; //.toLowerCase(); // Depending on your requirements, you might uncomment this.
        // Check if a pool with the same name already exists
        const existingPool = await Pool_1.default.findOne({ name });
        if (existingPool) {
            console.log('A pool with this name already exists:', name);
            return res.status(409).json({ message: 'Pool name already taken' });
        }
        // Find the admin user by adminUsername
        const adminUser = await findUserByUsername(adminUsername);
        if (!adminUser) {
            console.log('Admin user not found:', adminUsername);
            return res.status(404).json({ message: 'Admin user not found' });
        }
        console.log(`Creating pool: ${name} by admin user: ${adminUsername}`);
        const adminMember = {
            user: adminUser._id, // The ObjectId of the admin user
            username: adminUsername,
            points: 0,
            picks: [], // Assuming you have a default value for picks
            win: 0,
            loss: 0,
            push: 0,
        };
        // Automatically include the admin in the members array upon pool creation
        const newPool = new Pool_1.default({
            name,
            admin: adminUser._id, // Set the admin to the adminUser's ObjectId
            adminUsername: adminUsername, // Use the adminUsername directly from the request
            isPrivate,
            password: password,
            members: [adminMember], // Include the admin's ObjectId in the members array
        });
        const savedPool = await newPool.save();
        console.log('Pool saved to database:', savedPool);
        res.status(201).json({ message: 'Pool created successfully', pool: savedPool });
    }
    catch (error) {
        if (error.code === 11000) {
            // This error code indicates a duplicate key error (i.e., a unique index has been violated)
            return res.status(409).json({ message: 'Pool name already taken' });
        }
        console.error('Error creating pool:', error);
        res.status(500).json({ message: 'Error creating pool', error });
    }
};
exports.createPool = createPool;
// User requests to join a pool
// User requests to join a pool by pool name
// User requests to join a pool by pool name
const joinPoolByName = async (req, res) => {
    try {
        const { poolName, username, poolPassword, } = req.body;
        console.log({ poolName, username, poolPassword });
        // Find the user by username
        const user = await findUserByUsername(username);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Find the pool by name
        const pool = await Pool_1.default.findOne({ name: poolName });
        if (!pool) {
            return res.status(404).json({ message: 'Pool not found' });
        }
        // Check if pool is private and validate password if it is
        if (pool.isPrivate && pool.password) {
            if (poolPassword !== pool.password) {
                return res.status(401).json({ message: 'Incorrect password' });
            }
        }
        const isMemberAlready = pool.members.some(member => member.user.toString() === user._id.toString());
        if (!isMemberAlready) {
            // Add the user to the pool's members array if not already a member
            const newMember = {
                user: user._id, // Reference to the User document
                username: username,
                points: 0, // Initial points can be set to 0 or some starting value
                picks: [],
                wins: 0, // Initial wins
                losses: 0, // Initial losses
                pushes: 0, // Initial pushes
            };
            pool.members.push(newMember);
            await pool.save();
        }
        res.status(200).json({ message: 'Joined pool successfully', pool });
    }
    catch (error) {
        console.error('Error joining pool:', error);
        res.status(500).json({ message: 'Error joining pool', error });
    }
};
exports.joinPoolByName = joinPoolByName;
/*
export const getPoolsForUser = async (req: Request, res: Response) => {
 
};*/ 
