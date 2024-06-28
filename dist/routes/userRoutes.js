"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const connectDB_1 = require("../microservices/connectDB");
require("dotenv").config();
const router = express_1.default.Router();
router.post('/register', async (req, res) => {
    console.log('Register endpoint hit with data:', req.body);
    try {
        const { username, password } = req.body;
        if (!(username && password)) {
            console.log('Missing input data');
            return res.status(400).json({ message: "Username and password are required", type: "error" });
        }
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection("users");
        // Check if username is already taken
        const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "Username is already taken", type: "error" });
        }
        // Everything is unique, proceed to create user
        await usersCollection.insertOne({
            username: username.toLowerCase(), // Store usernames in lowercase to ensure uniqueness
            password: password, // Store password as plain text
        });
        res.status(201).json({ error: false, message: "User created successfully. You can now log in." });
    }
    catch (error) {
        console.error('[Registration Error]', error);
        if (error.code === 11000) {
            // This is the error code for duplicate key violation (i.e., username not unique)
            return res.status(409).send("Username is already taken.");
        }
        res.status(500).json({ message: "Internal Server Error", type: "error" });
    }
});
router.post('/login', async (req, res) => {
    console.log('Login endpoint hit with data:', req.body);
    try {
        const { username, password } = req.body;
        console.log('Attempting login with', { username, password });
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username: username.toLowerCase() }); // Lowercase the username
        console.log('User found:', user);
        if (user) {
            if (password === user.password) { // Compare plain text passwords
                console.log(`Redirecting ${username} to homepage`);
                res.json({ error: false, redirect: `/homepage.html?username=${username}` });
            }
            else {
                console.log('Invalid password for username:', username);
                return res.status(401).json({ error: true, message: "Invalid credentials. Please try again." });
            }
        }
        else {
            console.log('Username not found:', username);
            return res.status(401).json({ error: true, message: "Invalid credentials. Please try again." });
        }
    }
    catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ error: true, message: "An error occurred during the login process. Please try again." });
    }
});
exports.default = router;
