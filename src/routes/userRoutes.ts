import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import bcrypt from 'bcrypt';
require("dotenv").config();

const router = express.Router();
const saltRounds = 10;

router.post('/register', async (req, res) => {
    console.log('Register endpoint hit with data:', req.body);
    try {
        const { username, password } = req.body;

        if (!(username && password)) {
            console.log('Missing input data');
            return res.status(400).json({ message: "Username and password are required", type: "error" });
        }
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Check if username is already taken
        const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "Username is already taken", type: "error" });
        }

        // Everything is unique, proceed to create user
        const encryptedPassword = await bcrypt.hash(password, saltRounds);

        await usersCollection.insertOne({
            username: username.toLowerCase(), // Store usernames in lowercase to ensure uniqueness
            password: encryptedPassword,
        });

        res.status(201).json({ error: false, message: "User created successfully. You can now log in." });

    } catch (error: any) {
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

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username: username.toLowerCase() }); // Lowercase the username

        console.log('User found:', user);

        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            console.log('Password match:', passwordMatch);
            if (passwordMatch) {
                console.log(`Redirecting ${username} to homepage`);
                res.json({ error: false, redirect: `/homepage.html?username=${username}` });
            } else {
                console.log('Invalid password for username:', username);
                return res.status(401).json({ error: true, message: "Invalid credentials. Please try again." });
            }
        } else {
            console.log('Username not found:', username);
            return res.status(401).json({ error: true, message: "Invalid credentials. Please try again." });
        }
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ error: true, message: "An error occurred during the login process. Please try again." });
    }
});

export default router;
/*
import express, { Request, Response } from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import bcrypt from 'bcrypt';
import sgMail from '@sendgrid/mail';
import crypto from 'crypto';

const router = express.Router();
const saltRounds = 10;

// Type definitions
interface RegisterRequest {
    username: string;
    password: string;
    email: string;
}

interface User {
    username: string;
    email: string;
    password: string;
    verified: boolean;
    verificationToken?: string;
}

interface LoginRequest {
    username: string;
    password: string;
}

if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY is not set in environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post('/register', async (req: Request<{}, {}, RegisterRequest>, res: Response) => {
    try {
        const { username, password, email } = req.body;

        if (!(username && password && email)) {
            return res.status(400).json({ message: "All fields required", type: "error" });
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection<User>("users");

        const existingUser = await usersCollection.findOne({ 
            $or: [
                { username: username.toLowerCase() },
                { email: email.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({ 
                message: existingUser.username === username.toLowerCase() ? 
                    "Username taken" : "Email already registered", 
                type: "error" 
            });
        }

        const verificationToken: string = crypto.randomBytes(32).toString('hex');
        const encryptedPassword: string = await bcrypt.hash(password, saltRounds);

        const newUser: User = {
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password: encryptedPassword,
            verified: false,
            verificationToken
        };

        await usersCollection.insertOne(newUser);

        const verificationLink = `https://pick6.club/users/verify?token=${verificationToken}`;
        
        const msg = {
            to: email,
            from: 'pick6noreply@gmail.com',
            subject: 'Welcome to Pick 6 - Verify Your Email',
            text: `Welcome to Pick 6! Click this link to verify your email: ${verificationLink}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="color-scheme" content="dark">
                    <meta name="supported-color-schemes" content="dark">
                </head>
                <body style="background-color: #040d21 !important; margin: 0; padding: 0;">
                    <div style="background-color: #040d21 !important; 
                                color: #CCD6F6 !important; 
                                padding: 40px; 
                                font-family: Arial, sans-serif; 
                                border-radius: 10px;
                                margin: 0;
                                max-width: 600px;
                                margin: 0 auto;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #33d9ff !important; margin: 0;">Welcome to Pick 6!</h1>
                        </div>
                        <div style="background-color: #112240 !important; 
                                   padding: 30px; 
                                   border-radius: 8px; 
                                   margin: 20px 0;
                                   border: 1px solid #33d9ff;">
                            <p style="color: #CCD6F6 !important; font-size: 16px; line-height: 1.5;">Thank you for joining Pick 6. To get started, please verify your email address:</p>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${verificationLink}" 
                                   style="background-color: #33d9ff !important; 
                                          color: #040d21 !important; 
                                          padding: 15px 30px; 
                                          text-decoration: none; 
                                          border-radius: 5px;
                                          font-weight: bold;
                                          display: inline-block;
                                          border: none;
                                          box-shadow: 0 4px 6px rgba(51, 217, 255, 0.2);">
                                    Verify Email
                                </a>
                            </div>
                            <p style="color: #8892B0 !important; font-size: 14px; margin-top: 30px;">If you didn't create this account, you can safely ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await sgMail.send(msg);

        res.status(201).json({ 
            error: false, 
            message: "Please check your email to verify your account." 
        });

    } catch (error) {
        console.error('[Registration Error]', error);
        res.status(500).json({ message: "Internal Server Error", type: "error" });
    }
});
router.get('/verify', async (req: Request, res: Response) => {
    try {
        const token = req.query.token as string;
        if (!token) {
            return res.redirect('/login.html?status=failed');
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const result = await usersCollection.updateOne(
            { verificationToken: token },
            { 
                $set: { verified: true },
                $unset: { verificationToken: "" }
            }
        );

        if (result.modifiedCount === 0) {
            return res.redirect('/login.html?status=failed');
        }

        // On success, redirect to login with success status
        res.redirect('/login.html?status=success');
    } catch (error) {
        console.error('[Verification Error]', error);
        res.redirect('/login.html?status=failed');
    }
});

router.post('/login', async (req: Request<{}, {}, LoginRequest>, res: Response) => {
    try {
        const { username, password } = req.body;
        const db = await connectToDatabase();
        const usersCollection = db.collection<User>("users");
        const user = await usersCollection.findOne({ username: username.toLowerCase() });

        if (!user) {
            return res.status(401).json({ error: true, message: "Invalid credentials" });
        }

        if (!user.verified) {
            return res.status(401).json({ error: true, message: "Please verify your email first" });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: true, message: "Invalid credentials" });
        }

        res.json({ error: false, redirect: `/homepage.html?username=${username}` });
    } catch (error) {
        console.error('[Login Error]', error);
        res.status(500).json({ error: true, message: "Login failed" });
    }
});

export default router;*/