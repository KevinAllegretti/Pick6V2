import { exec } from 'child_process';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from '../src/routes/userRoutes';
import path from 'path';
import picksRoutes from '../src/routes/picksRoutes'; 
import bodyParser from 'body-parser';
import profileRoutes from '../src/routes/profileRoutes';
import poolRoutes from '../src/routes/poolRoutes';
import mongoose from 'mongoose';
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware to parse JSON
app.use(express.json());


app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

app.use(express.static('public/logos/'));

// 2. Logging middleware\
/*
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});
*/
// Middleware for logging incoming requests
app.use((req, res, next) => {
  next();
});


// 3. Body parser
app.use(bodyParser.json());

// 4. URL encoded parser
app.use(express.urlencoded({ extended: true }));

// 5. API routes
/*app.get('/', (req, res) => {
  res.send('Welcome to Pick 6!');
}); */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));

});


app.use('/users', userRoutes);


app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(picksRoutes);

app.use(profileRoutes);

app.use('/uploads', express.static('uploads'));
app.use('/pools', poolRoutes);
// 6. Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const mongoURI = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6'


app.get('/', (req, res) => {
// req.session.isAuth = true;
})

app.get('/api/odds', async (req: Request, res: Response) => {
  const pinnacleUrl = 'https://api.pinnacle.com/v1/odds';
  const params = {
    sportId: '3', // the ID for basketball, this should be replaced with the actual ID for NBA
    oddsFormat: 'decimal', // or 'american' based on your requirement
    //leagues: [366] // the ID for the NBA league, replace with actual if different
  };
  const queryParams = new URLSearchParams(params).toString();

  try {
    const apiRes = await fetch(`${pinnacleUrl}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('your_username:your_password').toString('base64')
      }
    });

    if (!apiRes.ok) {
      throw new Error(`Error fetching from Pinnacle API: ${apiRes.statusText}`);
    }

    const data = await apiRes.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching NBA odds:', error);
    res.status(500).send('Failed to fetch odds');
  }
});

const options = {
  serverSelectionTimeoutMS: 5000, // Reduce the time the driver waits for server selection
  socketTimeoutMS: 45000, // Adjust socket timeout as necessary
};

mongoose.connect('mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6', options);

export default app;
