import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';

const router = express.Router();
const saltRounds = 10;

// Initialize SendGrid
sgMail.setApiKey('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'); // Should ideally be an environment variable

router.get('/test', (req, res) => res.send('Test route works!'));

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!(email && password && username)) {
            return res.status(400).send("All input is required");
        }

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const oldUser = await usersCollection.findOne({ email: email.toLowerCase() });
        if (oldUser) {
            return res.status(409).send("User Already Exist. Please Login");
        }

        const encryptedPassword = await bcrypt.hash(password, saltRounds);
        const verificationToken = uuidv4();

        await usersCollection.insertOne({
            username,
            email: email.toLowerCase(),
            password: encryptedPassword,
            verificationToken,
            verified: false,
        });

        const verificationUrl = `http://localhost:3000/users/verify/${verificationToken}`;

        const msg = {
            to: email,
            from: 'kevinallegretti17@gmail.com', // This should be a verified sender in SendGrid
            subject: 'Please verify your email',
            html: `<p>Please click this link to verify your email: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
        };

        await sgMail.send(msg);
        console.log('[Email Attempt] Email sent successfully to:', email);
        res.status(201).send("User created successfully. Please check your email to verify your account.");
        
    } catch (error) {
        console.error('[Registration Error]', error);
        res.status(500).send("Error occurred. Please try again.");
    }
});

router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");

        const user = await usersCollection.findOne({ verificationToken: token });
        if (!user) {
            return res.status(400).send("Invalid or expired verification link");
        }

        await usersCollection.updateOne({ _id: user._id }, { $set: { verified: true }, $unset: { verificationToken: "" } });
        console.log(`[Email Verification] User verified: ${user.username}`);
        res.send("Account verified successfully!");
    } catch (error) {
        console.error('[Email Verification Error]', error);
        res.status(500).send("Error during verification. Please try again.");
    }
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = await connectToDatabase();

        const usersCollection = db.collection("users");
        const user = await usersCollection.findOne({ username });

        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                if (!user.verified) {
                    return res.status(403).send("Please verify your email to login.");
                }
                console.log(`[Login Success] User logged in: ${username}`);
                res.redirect(`/homepage.html?username=${username}`);
            } else {
                return res.status(401).send('Invalid credentials. Please try again.');
            }
        } else {
            return res.status(401).send('Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('[Login Error]', error);
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
