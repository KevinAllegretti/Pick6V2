"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDataForNFL = exports.fetchMLBData = void 0;
const axios = require('axios');
const mlbToNflMap = {
    "New York Yankees": "NY Giants",
    "Los Angeles Dodgers": "LA Rams",
    "Chicago Cubs": "CHI Bears",
    "Houston Astros": "HOU Texans",
    "San Francisco Giants": "SF 49ers",
    "Philadelphia Phillies": "PHI Eagles",
    "Boston Red Sox": "NE Patriots",
    "Atlanta Braves": "ATL Falcons",
    "Miami Marlins": "MIA Dolphins",
    "Seattle Mariners": "SEA Seahawks",
    "Minnesota Twins": "MIN Vikings",
    "Arizona Diamondbacks": "ARI Cardinals",
};
async function fetchMLBData() {
    const url = 'https://odds.p.rapidapi.com/v4/sports/baseball_mlb/odds';
    const params = {
        regions: 'us',
        markets: 'h2h,spreads',
        oddsFormat: 'american',
    };
    try {
        const response = await axios.get(url, {
            params: params,
            headers: {
                'x-rapidapi-host': 'odds.p.rapidapi.com',
                'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e' // Ensure to secure your API key appropriately
            }
        });
        return transformDataForNFL(response.data);
    }
    catch (error) {
        console.error('Failed to fetch MLB data:', error);
        throw error;
    }
}
exports.fetchMLBData = fetchMLBData;
async function transformDataForNFL(data) {
    const betOptions = data.map(event => {
        const nflTeams = event.teams.map(team => mlbToNflMap[team] || team);
        const bets = event.bookmakers
            .filter(bookmaker => bookmaker.key === 'draftkings')
            .flatMap(bookmaker => bookmaker.markets.flatMap(market => market.outcomes.map(outcome => ({
            teamName: mlbToNflMap[outcome.name] || outcome.name,
            type: market.key === 'h2h' ? 'ML' : 'Spread',
            value: market.key === 'h2h' ? outcome.price : outcome.point
        }))));
        return bets;
    });
    return betOptions.flat();
}
exports.transformDataForNFL = transformDataForNFL;
