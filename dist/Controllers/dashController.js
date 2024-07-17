"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveWeeklyPicks = exports.fetchMLBData = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const connectDB_1 = require("../microservices/connectDB");
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
const fetchMLBData = async (req, res) => {
    const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/odds';
    const params = {
        regions: 'us',
        markets: 'h2h,spreads',
        oddsFormat: 'american',
    };
    const queryParams = new URLSearchParams(params);
    const betOptions = [];
    try {
        console.log(`Fetching data from: ${url}?${queryParams}`);
        const response = await (0, node_fetch_1.default)(`${url}?${queryParams}`, {
            method: 'GET',
            headers: {
                'x-rapidapi-host': 'odds.p.rapidapi.com',
                'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Full API Data:", JSON.stringify(data, null, 2)); // Log the entire data set received from the API
        data.forEach((event) => {
            console.log('Processing event:', JSON.stringify(event, null, 2));
            if (!event.teams || !Array.isArray(event.teams)) {
                if (event.home_team && event.away_team) {
                    const nflHomeTeam = mlbToNflMap[event.home_team] || event.home_team;
                    const nflAwayTeam = mlbToNflMap[event.away_team] || event.away_team;
                    processBookmakers([nflHomeTeam, nflAwayTeam], event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
                }
            }
            else {
                const nflTeams = event.teams.map((team) => mlbToNflMap[team] || team);
                processBookmakers(nflTeams, event.bookmakers, event.commence_time, event.home_team, event.away_team, betOptions);
            }
        });
        console.log("Processed Bet Options:", JSON.stringify(betOptions, null, 2)); // Log the processed bet options
        res.json(betOptions);
    }
    catch (error) {
        console.error('Error fetching MLB data:', error);
        res.status(500).send('Error fetching MLB data');
    }
};
exports.fetchMLBData = fetchMLBData;
function processBookmakers(nflTeams, bookmakers, commenceTime, homeTeam, awayTeam, betOptions) {
    const nflHomeTeam = mlbToNflMap[homeTeam] || homeTeam;
    const nflAwayTeam = mlbToNflMap[awayTeam] || awayTeam;
    console.log(`Processing bookmakers for ${nflHomeTeam} vs ${nflAwayTeam} at ${commenceTime}`);
    bookmakers.forEach((bookmaker) => {
        if (bookmaker.key === 'draftkings') {
            console.log(`Processing bookmaker: ${bookmaker.key}`);
            bookmaker.markets.forEach((market) => {
                console.log(`Processing market: ${market.key}`);
                market.outcomes.forEach((outcome) => {
                    console.log(`Processing outcome: ${JSON.stringify(outcome, null, 2)}`);
                    const nflTeamName = mlbToNflMap[outcome.name] || outcome.name;
                    const betType = market.key === 'h2h' ? 'ML' : 'Spread';
                    let betValue = market.key === 'h2h' ? outcome.price : outcome.point;
                    if (betValue > 0 && !betValue.toString().startsWith('+')) {
                        betValue = '+' + betValue;
                    }
                    betOptions.push({
                        teamName: nflTeamName,
                        teamRole: nflTeamName === nflHomeTeam ? 'home' : 'away',
                        awayTeam: nflAwayTeam,
                        homeTeam: nflHomeTeam,
                        type: betType,
                        value: betValue,
                        commenceTime: commenceTime
                    });
                });
            });
        }
    });
}
const saveWeeklyPicks = async (req, res) => {
    const { picks } = req.body; // Your NFL transformed data
    try {
        const database = await (0, connectDB_1.connectToDatabase)();
        const picksCollection = database.collection('weeklyPicks');
        await picksCollection.updateOne({ identifier: 'current' }, { $set: { picks: picks, updated: new Date() } }, { upsert: true });
        res.json({ success: true, message: 'Picks saved successfully' });
    }
    catch (error) {
        console.error('Failed to save picks:', error);
        res.status(500).json({ success: false, message: 'Failed to save picks', error: error.toString() });
    }
};
exports.saveWeeklyPicks = saveWeeklyPicks;
