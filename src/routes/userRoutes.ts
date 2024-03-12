import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import users from '../models/user';

/*
declare module 'express-session' {
    export interface SessionData {
      username?: string; // Add other custom session properties here if needed
    }
  }
 */ 

const router = express.Router();

router.get('/test', (req, res) => res.send('Test route works!'));

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





export default router;
