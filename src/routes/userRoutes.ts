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
        user: 'kevinallegretti`7@gmail.com',
        pass: 'Yunglean17!',
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

       /* const oldUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }
        */
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        const verificationToken = uuidv4(); // Generate a unique verification token

        // Insert the new user with verificationToken and verified status
        await usersCollection.insertOne({
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
            verificationToken,
            verified: false,
        });

        // Prepare and send the verification email
        const verificationUrl = `http://localhost:3000/users/verify/${verificationToken}`;
        console.log('[Email Attempt] Preparing to send email to:', email);
        transporter.sendMail({
            from: 'kevinallegretti17@gmail.com', // Your email from environment variable
            to: email, // User's email
            subject: 'Please verify your email',
            html: `<p>Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
        }, (error, info) => {
            if (error) {
                console.error('[Email Attempt] Error sending email:', error);
                return res.status(500).send("Failed to send verification email.");
            }
            console.log('[Email Attempt] Email sent successfully:', info.response);
            res.status(201).send("User created successfully. Please check your email to verify your account.");
        });
        
    } catch (error) {
        console.error('[Registration Error]', error);
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
        console.log('[Login Attempt] Body:', req.body); // Log the incoming request body
        const { username, password } = req.body;
        const db = await connectToDatabase();
        console.log('[Login Attempt] Database connection successful');

        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username });

        if (user) {
            console.log(`[Login Attempt] User found in database: ${username}`);
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                console.log('[Login Attempt] Password matches');
                if (!user.verified) {
                    console.log('[Login Attempt] User email not verified');
                    return res.status(403).send("Please verify your email to login.");
                }
                console.log('[Login Attempt] Login successful');
                // Implement session/token creation here as needed
                res.redirect(`/homepage.html?username=${username}`);
            } else {
                console.log('[Login Attempt] Password does not match');
                res.status(401).send('Invalid credentials. Please try again.');
            }
        } else {
            console.log(`[Login Attempt] No user found with username: ${username}`);
            res.status(401).send('Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('[Login Attempt] Error:', error);
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
