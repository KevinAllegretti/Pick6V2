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
import { WebSocketServer } from 'ws';
import cron from 'node-cron';
import fetch from 'node-fetch';
import '../src/microservices/websocket';  
import '../src/microservices/scheduler';

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middleware to parse JSON
app.use(express.json());


app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

app.use(express.static('public/logos/'));
app.use(express.static('public/infoPics/'));

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
console.log("Registering /users routes");
app.use('/users', userRoutes);
console.log("/users routes registered");

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(picksRoutes);

app.use(profileRoutes);

app.use('/api', InjuryRoutes);

app.use('/api', timeWindowRoutes)

app.use('/uploads', express.static('uploads'));
app.use('/pools', poolRoutes);
// 6. Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const server = new Server(app);
const wss = new WebSocketServer({ server });

wss.on('connection', ws => {
  console.log('New client connected');
  ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server' }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

function broadcastMessage(message: string) {
  const clients = wss.clients as Set<WebSocket>;
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
const mongoURI = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6'


app.get('/', (req, res) => {
// req.session.isAuth = true;
})


const options = {
  serverSelectionTimeoutMS: 5000, // Reduce the time the driver waits for server selection
  socketTimeoutMS: 45000, // Adjust socket timeout 
};

mongoose.connect('mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6', options);



export default app;
