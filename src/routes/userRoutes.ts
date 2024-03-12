import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import users from '../models/user';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // For generating unique verification tokens
import nodemailer from 'nodemailer';
/*
declare module 'express-session' {
    export interface SessionData {
      username?: string; // Add other custom session properties here if needed
    }
  }
 */ 

const router = express.Router();

router.get('/test', (req, res) => res.send('Test route works!'));

const saltRounds = 10; // Cost factor for hashing the password



// Setup Nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your preferred email service
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
    },
});

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!(email && password && username)) {
            res.status(400).send("All input is required");
            return;
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const oldUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        const verificationToken = uuidv4(); // Generate a unique verification token

        // Insert the new user with verificationToken and verified status
        const result = await usersCollection.insertOne({
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
            verificationToken,
            verified: false,
        });

        // Send verification email
        const verificationUrl = `http://localhost:3000/users/verify/${verificationToken}`;
        transporter.sendMail({
            from: 'your-email@gmail.com',
            to: email,
            subject: 'Please verify your email',
            html: `Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`,
        });

        res.status(201).send("User created successfully. Please check your email to verify your account.");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error occurred. Please try again.");
    }
});

// Email verification route
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Verify the user based on the token
        const user = await usersCollection.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).send("Invalid or expired verification link");
        }

        await usersCollection.updateOne({ _id: user._id }, { $set: { verified: true }, $unset: { verificationToken: "" } });
        res.send("Account verified successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error during verification. Please try again.");
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Find the user by username
        const user = await usersCollection.findOne({ username });

        if (user && await bcrypt.compare(password, user.password)) {
            // If the user is found and the password matches
            // Check if the user's email is verified if necessary
            if (!user.verified) {
                return res.status(403).send("Please verify your email to login.");
            }
            // Redirect or handle successful login
            res.redirect(`/homepage.html?username=${username}`);
        } else {
            // If the user is not found or password doesn't match
            res.status(401).send('Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred during the login process. Please try again.");
    }
});

// Other routes...
/*
router.post('/login', (req,res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.redirect(`/homepage.html?username=${username}`);
        //res.redirect('/homepage.html'); // This would be the URL to your homepage
    } else {
        res.status(401).send('Invalid credentials. Please try again.');
    }
});

*/




export default router;
