"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const connectDB_1 = require("../microservices/connectDB"); // Adjust the import path as necessary
console.log('Profile routes loaded');
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
    console.log('Received request for profile picture upload');
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
        console.error('Error uploading profile picture:', error);
        res.status(500).send({ message: 'Error uploading profile picture' });
    }
});
// Get user profile endpoint
router.get('/api/getUserProfile/:username', async (req, res) => {
    console.log(`Received request for user profile: ${req.params.username}`);
    console.log("params", req.params);
    console.log("body", req.body);
    try {
        const db = await (0, connectDB_1.connectToDatabase)();
        const usersCollection = db.collection('users');
        const username = req.params.username.toLowerCase();
        console.log('Looking up user in database', username);
        const user = await usersCollection.findOne({ username });
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }
        res.json({ profilePicture: user.profilePicture || 'Default.png' }); // Send the profile picture URL back to the client
    }
    catch (error) {
        console.error('Error getting user profile:', error);
        res.status(500).send({ message: 'Error getting user profile' });
    }
});
exports.default = router;
