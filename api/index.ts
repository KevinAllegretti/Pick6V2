import { exec } from 'child_process';
import express, { Request, Response, NextFunction } from 'express';
import userRoutes from '../src/routes/userRoutes';
import path from 'path';
import picksRoutes from '../src/routes/picksRoutes'; 
import bodyParser from 'body-parser';
import profileRoutes from '../src/routes/profileRoutes';
import poolRoutes from '../src/routes/poolRoutes';

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

const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBSession = require('connect-mongodb-session')(session);


const mongoURI = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/sessions'

mongoose
  .connect(mongoURI)
  .then(() => {
  })
  .catch(err => console.log(err)); // It's important to catch any errors here

const store = new MongoDBSession({
  uri: mongoURI,
  collection: "mySessions",
})

app.use(session({
  secret: 'your secret key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: 'auto' }, // 'auto' will secure cookies if the site is accessed over HTTPS
  store: store,
}));

app.get('/', (req, res) => {
// req.session.isAuth = true;
})
/*
app.post('/login', (req, res) => {
  // ... after successful login:
  req.session.username = req.body.username; // Store the username in the session
  res.redirect('/homepage');
});

app.get('/homepage', (req, res) => {
  if (req.session.username) {
    // The user is logged in, proceed with serving the homepage
  } else {
    // The user is not logged in, redirect to the login page
    res.redirect('/login');
  }
});
*/

export default app;
