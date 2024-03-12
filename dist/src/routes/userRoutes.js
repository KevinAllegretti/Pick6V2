"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("../models/user"));
/*
declare module 'express-session' {
    export interface SessionData {
      username?: string; // Add other custom session properties here if needed
    }
  }
 */
const router = express_1.default.Router();
router.get('/test', (req, res) => res.send('Test route works!'));
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = user_1.default.find(u => u.username === username && u.password === password);
    if (user) {
        res.redirect(`/homepage.html?username=${username}`);
        //res.redirect('/homepage.html'); // This would be the URL to your homepage
    }
    else {
        res.status(401).send('Invalid credentials. Please try again.');
    }
});
exports.default = router;
