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
