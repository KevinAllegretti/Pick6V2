"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAndSaveInjuries = void 0;
const axios_1 = __importDefault(require("axios"));
const connectDB_1 = require("./connectDB");
async function fetchAndSaveInjuries() {
    try {
        const response = await axios_1.default.get('https://api-american-football.p.rapidapi.com/injuries', {
            headers: {
                'X-RapidAPI-Key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e',
                'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com'
            }
        });
        const injuries = response.data.response;
        const db = await (0, connectDB_1.connectToDatabase)();
        const injuriesCollection = db.collection('injuries');
        // Clear existing injuries
        await injuriesCollection.deleteMany({});
        // Save new injuries
        await injuriesCollection.insertMany(injuries);
        console.log('Injuries fetched and saved successfully.');
    }
    catch (error) {
        console.error('Error fetching and saving injuries:', error);
    }
}
exports.fetchAndSaveInjuries = fetchAndSaveInjuries;
