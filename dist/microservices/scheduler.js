"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const websocket_1 = require("./websocket");
let gameScores = []; // Define a variable to store the scores
const mlbToNflMap = {
    "Arizona Diamondbacks": "ARI Cardinals",
    "Atlanta Braves": "ATL Falcons",
    "Baltimore Orioles": "BAL Ravens",
    "Boston Red Sox": "NE Patriots",
    "Chicago Cubs": "CHI Bears",
    "Chicago White Sox": "CHI Bears",
    "Cincinnati Reds": "CIN Bengals",
    "Cleveland Guardians": "CLE Browns",
    "Colorado Rockies": "DEN Broncos",
    "Detroit Tigers": "DET Lions",
    "Houston Astros": "HOU Texans",
    "Kansas City Royals": "KC Chiefs",
    "Los Angeles Angels": "LA Chargers",
    "Los Angeles Dodgers": "LA Rams",
    "Miami Marlins": "MIA Dolphins",
    "Milwaukee Brewers": "GB Packers",
    "Minnesota Twins": "MIN Vikings",
    "New York Yankees": "NY Giants",
    "New York Mets": "NY Jets",
    "Oakland Athletics": "SF 49ers",
    "Philadelphia Phillies": "PHI Eagles",
    "Pittsburgh Pirates": "PIT Steelers",
    "San Francisco Giants": "SF 49ers",
    "Seattle Mariners": "SEA Seahawks",
    "Tampa Bay Rays": "TB Buccaneers",
    "Texas Rangers": "DAL Cowboys",
    "Toronto Blue Jays": "BUF Bills",
    "Washington Nationals": "WAS Commanders"
};
async function fetchMLBScores() {
    console.log('fetchMLBScores function started.');
    const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/scores';
    const params = {
        daysFrom: '1',
        apiKey: '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
    };
    const queryParams = new URLSearchParams(params);
    try {
        const response = await (0, node_fetch_1.default)(`${url}?${queryParams}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'odds.p.rapidapi.com',
                'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e' // Replace with your actual API key
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const scores = await response.json();
        console.log("Scores data:", scores);
        gameScores = scores.map(event => {
            if (!event.scores || !Array.isArray(event.scores)) {
                console.log(`Skipping event due to missing or invalid scores:`, event);
                return null; // Return null for events without valid scores to filter them out later
            }
            const homeTeam = mlbToNflMap[event.home_team] || event.home_team;
            const awayTeam = mlbToNflMap[event.away_team] || event.away_team;
            const homeScore = event.scores.find(s => mlbToNflMap[s.name] === homeTeam || s.name === event.home_team)?.score;
            const awayScore = event.scores.find(s => mlbToNflMap[s.name] === awayTeam || s.name === event.away_team)?.score;
            return {
                home_team: homeTeam,
                away_team: awayTeam,
                home_score: parseInt(homeScore, 10),
                away_score: parseInt(awayScore, 10)
            };
        }).filter(match => match !== null); // Filter out the null entries
        console.log('Scores fetched:', gameScores);
        // Broadcast the scores to all connected clients
        (0, websocket_1.broadcastScores)(gameScores);
    }
    catch (error) {
        console.error('Error fetching MLB scores:', error);
    }
}
// Schedule tasks using cron expressions
// Thursday 11:30 PM
node_cron_1.default.schedule('30 23 * * 4', () => {
    console.log("It's Thursday Bet Poll time, now fetching scores");
    fetchMLBScores();
});
// Sunday 4:15 PM
node_cron_1.default.schedule('15 16 * * 0', () => {
    console.log("It's Sunday Bet Poll 1 time, now fetching scores");
    fetchMLBScores();
});
// Sunday 8:00 PM
node_cron_1.default.schedule('0 20 * * 0', () => {
    console.log("It's Sunday Bet Poll 2 time, now fetching scores");
    fetchMLBScores();
});
// Sunday 11:30 PM
node_cron_1.default.schedule('30 23 * * 0', () => {
    console.log("It's Sunday Bet Poll 3 time, now fetching scores");
    fetchMLBScores();
});
// Monday 11:30 PM
node_cron_1.default.schedule('30 23 * * 1', () => {
    console.log("It's Monday Bet Poll time, now fetching scores");
    fetchMLBScores();
});
// Every day at 10:00 AM
node_cron_1.default.schedule('0 10 * * *', () => {
    console.log("It's Everyday Poll time, now fetching scores");
    fetchMLBScores();
});
console.log('Scheduled tasks are set up.');
