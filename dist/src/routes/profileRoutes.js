"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//profileRoutes.ts
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const connectDB_1 = require("../microservices/connectDB"); // Adjust the import path as necessary
// Set up Multer for file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this uploads directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});
const upload = (0, multer_1.default)({ storage });
const router = express_1.default.Router();
// Profile picture upload endpoint
router.post('/api/uploadProfilePicture', upload.single('profilePic'), async (req, res) => {
    //   console.log('Received request for profile picture upload');
    const file = req.file;
    if (!file) {
        return res.status(400).send({ message: 'No file uploaded.' });
    }
    // Assuming the username is sent along with the multipart/form-data
    const username = req.body.username;
    try {
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }
        const filePath = `/uploads/${file.filename}`; // URL to access the file
        await usersCollection.updateOne({ username }, { $set: { profilePicture: filePath } });
        res.send({ message: 'Profile picture uploaded successfully', filePath });
    }
    catch (error) {
        // console.error('Error uploading profile picture:', error);
        res.status(500).send({ message: 'Error uploading profile picture' });
    }
});
// Get user profile endpoint
router.get('/api/getUserProfile/:username', async (req, res) => {
    try {
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection('users');
        const username = req.params.username.toLowerCase();
        // console.log('Looking up user in database:', username);
        const user = await usersCollection.findOne({ username });
        if (!user) {
            // console.log(`User not found in database: ${username}`);
            return res.status(404).send({ message: 'User not found.' });
        }
        // console.log(`User found: ${user.username}`);
        // Assuming you have fields like points, picks, etc., in your user document
        const userProfile = {
            username: user.username,
            profilePicture: user.profilePicture || 'Default.png',
            points: user.points || 0,
            picks: user.picks || [],
            wins: user.wins || 0,
            losses: user.losses || 0,
            pushes: user.pushes || 0,
            // ... any other fields you want to include
        };
        res.json(userProfile); // Send the expanded user profile back to the client
    }
    catch (error) {
        // console.error('Error getting user profile:', error);
        res.status(500).send({ message: 'Error getting user profile', error });
    }
});
exports.default = router;
