"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("../src/routes/userRoutes"));
const path_1 = __importDefault(require("path"));
const picksRoutes_1 = __importDefault(require("../src/routes/picksRoutes"));
const body_parser_1 = __importDefault(require("body-parser"));
const profileRoutes_1 = __importDefault(require("../src/routes/profileRoutes"));
const poolRoutes_1 = __importDefault(require("../src/routes/poolRoutes"));
const mongoose_1 = __importDefault(require("mongoose"));
const fetch = require('node-fetch');
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// 1. Middleware to parse JSON
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
require('dotenv').config();
app.use(express_1.default.static('public/logos/'));
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
app.use(body_parser_1.default.json());
// 4. URL encoded parser
app.use(express_1.default.urlencoded({ extended: true }));
// 5. API routes
/*app.get('/', (req, res) => {
  res.send('Welcome to Pick 6!');
}); */
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/login.html'));
});
app.use('/users', userRoutes_1.default);
app.get('/dashboard', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/dashboard.html'));
});
app.use(picksRoutes_1.default);
app.use(profileRoutes_1.default);
app.use('/uploads', express_1.default.static('uploads'));
app.use('/pools', poolRoutes_1.default);
// 6. Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const mongoURI = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6';
app.get('/', (req, res) => {
    // req.session.isAuth = true;
});
app.get('/api/odds', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error fetching NBA odds:', error);
        res.status(500).send('Failed to fetch odds');
    }
});
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Reduce the time the driver waits for server selection
    socketTimeoutMS: 45000, // Adjust socket timeout as necessary
};
mongoose_1.default.connect('mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/Pick6', options);
exports.default = app;
