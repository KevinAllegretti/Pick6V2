import * as cron from 'node-cron';
import fetch from 'node-fetch';
//import { fetchAndSaveInjuries } from './src/InjuryRoutes.ts';
import { updateUserPoints, updateUserStats, saveResultsToServer, 
    deleteResultsFromServer, getAllPicks, getBetResult, calculatePointsForResult, 
    savePicksToLastWeek,   updateThursdayDeadline,
    updateTuesdayStartTime, deletePicksFromServer} from './serverUtils';
    import { fetchAndSaveInjuries } from './InjuryServices';
import { connectToDatabase } from './connectDB';
let gameScores: any[] = [];

const mlbToNflMap: { [key: string]: string } = {
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
      const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'odds.p.rapidapi.com',
          'x-rapidapi-key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e'
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
          return null;
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
      }).filter(match => match !== null);
  
      console.log('Scores fetched:', gameScores);
  
      await updateScores(gameScores);
    } catch (error) {
      console.error('Error fetching MLB scores:', error);
    }
  }


  async function updateScores(gameScores: any[]) {
      console.log('gameScores at update:', gameScores);
      let allResults: any[] = []; // Store all results for the current session
  
      const allPicks = await getAllPicks();
  
      const database = await connectToDatabase();
      const resultsCollection = database.collection('betResultsGlobal');
  
      for (const pick of allPicks) {
          const { username, poolName, picks, immortalLock } = pick;
  
          // Process normal picks
          for (const pickEntry of picks) {
              await processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, false);
          }
  
          // Process immortal lock pick
          if (immortalLock && immortalLock.length > 0) {
              await processPick(username, poolName, immortalLock[0], gameScores, allResults, resultsCollection, true);
          }
      }
  
      console.log('All Results:', allResults);
  
      // Save results to the server
      await saveResultsToServer(allResults);
  }
  
  async function processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, isImmortalLock) {
    const { teamName, value: betValue } = pickEntry;
    const match = gameScores.find(m => m.home_team === teamName || m.away_team === teamName);

    if (!match) {
        console.log(`No game score available for ${teamName}, skipping...`);
        return;
    }

    if (!betValue) {
        console.error('Invalid betValue for pickEntry:', pickEntry);
        return;
    }

    const homeTeamScore = match.home_team === teamName ? match.home_score : match.away_score;
    const awayTeamScore = match.home_team === teamName ? match.away_score : match.home_score;

    console.log(`Processing pick: ${betValue}, Home Team Score: ${homeTeamScore}, Away Team Score: ${awayTeamScore}`);

    try {
        // Check if the result is already in the database
        const existingResult = await resultsCollection.findOne({ 
            identifier: 'currentResults', 
            "results.username": username, 
            "results.poolName": poolName, 
            "results.teamName": teamName, 
            "results.betValue": betValue 
        });

        console.log(`Existing result for ${teamName}:`, existingResult);

        if (existingResult) {
            console.log(`Result already exists for ${teamName}, skipping...`);
            return;
        }

        const { result, odds } = getBetResult(betValue, homeTeamScore, awayTeamScore);
        const points = calculatePointsForResult({ result, odds, type: isImmortalLock ? 'ImmortalLock' : undefined });

        allResults.push({ username, poolName, teamName, betValue, result, points, isImmortalLock });

        // Update user points
        if (points !== 0) {
            console.log(`Updating points for ${username}: ${points} points in pool ${poolName}`);
            await updateUserPoints(username, points, poolName);
        }

        // Determine the increments for win, loss, and push
        let winIncrement = 0, lossIncrement = 0, pushIncrement = 0;
        if (result === 'hit') {
            winIncrement = 1;
        } else if (result === 'miss') {
            lossIncrement = 1;
        } else if (result === 'push') {
            pushIncrement = 1;
        }

        console.log(`Updating stats for ${username} in pool ${poolName} - Wins: ${winIncrement}, Losses: ${lossIncrement}, Pushes: ${pushIncrement}`);
        // Update user stats
        await updateUserStats(username, poolName, winIncrement, lossIncrement, pushIncrement);
    } catch (error) {
        console.error('Error processing bet result:', error);
    }
}

const fetchMLBData = async () => {
    const response = await fetch('http://localhost:3000/api/fetchMLBData' || 'https://pick6.club/api/fetchMLBData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  
    if (!response.ok) {
      throw new Error('Failed to fetch MLB data');
    }
  
    const betOptions = await response.json();
    console.log('Scheduled bet options:', betOptions);
  
    // Return the betOptions to be used for saving
    return betOptions;
  };
  
  const saveWeeklyPicks = async (betOptions: any) => {
    const response = await fetch('http://localhost:3000/api/saveWeeklyPicks' || 'https://pick6.club/api/fetchMLBData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picks: betOptions })
    });
  
    if (!response.ok) {
      throw new Error('Failed to save weekly picks');
    }
  
    const data = await response.json();
    if (data.success) {
      console.log('Picks saved successfully');
    } else {
      console.error('Error saving picks');
    }
  };
  
 cron.schedule('0 0 * * 2', async () => { // every tuesday
    try {
      const betOptions = await fetchMLBData();
      await saveWeeklyPicks(betOptions);
    } catch (error) {
      console.error('Scheduled job failed:', error);
    }
  });

cron.schedule('30 23 * * 4', () => {
    console.log("It's Thursday 11:30 PM, now fetching scores");
    fetchMLBScores();
});

cron.schedule('15 16 * * 0', () => {
    console.log("It's Sunday 4:15 PM, now fetching scores");
    fetchMLBScores();
});

cron.schedule('30 20 * * 0', () => {
    console.log("It's Sunday 8:30 PM, now fetching scores");
    fetchMLBScores();
});

cron.schedule('30 23 * * 0', () => {
    console.log("It's Sunday 11:30 PM, now fetching scores");
    fetchMLBScores();
});

cron.schedule('30 23 * * 1', () => {
    console.log("It's Monday 11:30 PM, now fetching scores");
    fetchMLBScores();
});

cron.schedule('0 0 * * 2', () => {
    console.log("It's Tuesday 12:00 AM, now deleting results");
    deleteResultsFromServer();
    deletePicksFromServer();
    console.log("Updating Thursday deadline to the upcoming Thursday");
    updateThursdayDeadline();
});

cron.schedule('0 19 * * 4', () => {
    console.log("It's Thursday 7:00 PM, now saving picks to last week");
    savePicksToLastWeek();
    console.log("Updating Tuesday start time to the upcoming Tuesday");
    updateTuesdayStartTime();
});

cron.schedule('20 13 * * *', () => {
    console.log("It's 8:00am fetching and saving injuries");
    fetchAndSaveInjuries();
});


cron.schedule('45 14 * * *', () => {
    console.log("It's 8:00am fetching and saving injuries");
    fetchAndSaveInjuries();
});
