import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
require("dotenv").config();
const router = express.Router();
const saltRounds = 10;


const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
sgMail.setApiKey(SENDGRID_API_KEY);

//test
router.post('/register', async (req, res) => {
    console.log('Register endpoint hit with data:', req.body);
    try {
        const { username, email, password } = req.body;

        if (!(email && password && username)) {
            return res.status(400).json({ message: "All input is required", type: "error" });
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        // Check if username is already taken
        const existingUser = await usersCollection.findOne({ username: username.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: "Username is already taken", type: "error" });
        }

        // Check if email is already used
        const oldUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (oldUser) {
            return res.status(409).json({ message: "Email is already in use", type: "error" });
        }

        // Everything is unique, proceed to create user
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        const verificationToken = uuidv4();

        await usersCollection.insertOne({
            username: username.toLowerCase(), // Store usernames in lowercase to ensure uniqueness
            email: email.toLowerCase(),
            password: encryptedPassword,
            verificationToken,
            verified: false,
        });

        // Send verification email
        const verificationUrl = `http://pick6.club/users/verify/${verificationToken}`;
        const msg = {
            to: email,
            from: 'pick6NoREPLY@gmail.com',
            subject: 'Please verify your email',
            html: `<p>Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
        };
        await sgMail.send(msg);

        // Log and respond with success
        console.log('Email sent successfully to:', email);
        res.status(201).json({ error: false, message: "User created successfully. Please check your email to verify your account." });

    } catch (error: any) {
        console.error('[Registration Error]', error);
        if (error.code === 11000) {
            // This is the error code for duplicate key violation (i.e., username not unique)
            return res.status(409).send("Username is already taken.");
        }
        res.status(500).json({ message: "Internal Server Error", type: "error" });
    }
});

router.get('/verify/:token', async (req, res) => {
    console.log('Verification endpoint hit with token:', req.params.token);
    try {
        const { token } = req.params;
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ verificationToken: token });
        if (!user) {
            return res.redirect('/login.html?verified=false');
        }

        await usersCollection.updateOne({ _id: user._id }, { $set: { verified: true }, $unset: { verificationToken: "" } });
        console.log(`[Email Verification] User verified: ${user.username}`);
        res.redirect('/login.html?verified=true');
    } catch (error) {
        console.error('[Email Verification Error]', error);
        res.redirect('/login.html?verified=error');
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
                console.log('User verified:', user.verified);
                if (!user.verified) {
                    return res.status(403).json({ error: true, message: "Please verify your email to login." });
                }
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
