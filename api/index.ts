import { exec } from 'child_process';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from '../src/routes/userRoutes';
import path from 'path';
import picksRoutes from '../src/routes/picksRoutes'; 
import bodyParser from 'body-parser';
import profileRoutes from '../src/routes/profileRoutes';
import poolRoutes from '../src/routes/poolRoutes';
import InjuryRoutes from '../src/routes/InjuryRoutes';
import mongoose from 'mongoose';
import timeWindowRoutes from '../src/routes/timeWindowRoutes';
import { Server } from 'http';
import fetch from 'node-fetch';
import '../src/microservices/websocket';  
import '../src/microservices/scheduler';
import dashRoutes from '../src/routes/dashRoutes'
import { fetchNFLschedule } from '../src/Controllers/dashController';
import { fetchTeamsAndWeeks, fetchGamesByFilter } from '../src/Controllers/dashController';
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware to parse JSON
app.use(express.json());


app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

app.use(express.static('public/logos/'));
app.use(express.static('public/infoPics/'));
app.use(express.static('public/halloweenPics/'));
// 2. Logging middleware\
/*
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});
*/
// Middleware for logging incoming requests
app.use((req, res, next) => {
 // console.log(`Request URL: ${req.url}`);
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

// Add logging to confirm route registration

app.use('/users', userRoutes);


app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(picksRoutes);
app.use('/api', dashRoutes);
app.use(profileRoutes);

app.use('/api', InjuryRoutes);

app.use('/api', timeWindowRoutes)

app.post('/api/fetchTeamsAndWeeks', fetchTeamsAndWeeks);
app.post('/api/fetchGamesByFilter', fetchGamesByFilter);

app.post('/api/fetchNFLSchedule', fetchNFLschedule);
app.use('/uploads', express.static('uploads'));
app.use('/pools', poolRoutes);
// 6. Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


app.use(bodyParser.json({ limit: '500mb' })); // Adjust the limit as needed
app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));



app.get('/', (req, res) => {
// req.session.isAuth = true;
})


const options = {
  serverSelectionTimeoutMS: 5000, // Reduce the time the driver waits for server selection
  socketTimeoutMS: 45000, // Adjust socket timeout 
};

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not set in environment variables');
}

mongoose.connect(process.env.MONGODB_URI, options);


export default app;
