"use strict";
/*import express from 'express';
import userRoutes from './routes/userRoutes';
import path from 'path';
import picksRoutes from './routes/picksRoutes'; // Update the path if needed
import bodyParser from 'body-parser';
import { Request, Response, NextFunction } from 'express';





const app = express();
const PORT = 3000;


// Use middleware to parse JSON
app.use(express.json());



app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Welcome to Pick 6!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(bodyParser.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});


app.use(express.urlencoded({ extended: true }));

// Place all your API routes above the static file middleware
app.use('/users', userRoutes);


app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});


app.use(picksRoutes);





// Serve static files last
//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, '../public')));

*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const path_1 = __importDefault(require("path"));
const picksRoutes_1 = __importDefault(require("./routes/picksRoutes"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 1. Middleware to parse JSON
app.use(express_1.default.json());
// 2. Logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
// 3. Body parser
app.use(body_parser_1.default.json());
// 4. URL encoded parser
app.use(express_1.default.urlencoded({ extended: true }));
// 5. API routes
app.get('/', (req, res) => {
    res.send('Welcome to Pick 6!');
});
app.use('/users', userRoutes_1.default);
app.get('/dashboard', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/dashboard.html'));
});
app.use(picksRoutes_1.default);
// 6. Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
