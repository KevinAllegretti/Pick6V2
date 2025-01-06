import * as cron from 'node-cron';
import fetch from 'node-fetch';
//import { fetchAndSaveInjuries } from './src/InjuryRoutes.ts';
import { updateUserPoints, updateUserStats, saveResultsToServer, 
    deleteResultsFromServer, getAllPicks, getBetResult, calculatePointsForResult, 
    savePicksToLastWeek,   updateThursdayDeadline,
    updateTuesdayStartTime, deletePicksFromServer} from './serverUtils';
    import { fetchAndSaveInjuries } from './InjuryServices';
    import { deleteInjuriesFromServer } from '../routes/InjuryRoutes';
import { connectToDatabase } from './connectDB';
let gameScores: any[] = [];

const mlbToNflMap: { [key: string]: string } = {
    "Arizona Diamondbacks": "Arizona Cardinals",
    "Atlanta Braves": "Atlanta Falcons",
    "Baltimore Orioles": "Baltimore Ravens",
    "Boston Red Sox": "New England Patriots",
    "Chicago Cubs": "Chicago Bears",
    "Chicago White Sox": "Chicago Bears",
    "Cincinnati Reds": "Cincinnati Bengals",
    "Cleveland Guardians": "Cleveland Browns",
    "Colorado Rockies": "Denver Broncos",
    "Detroit Tigers": "Detroit Lions",
    "Houston Astros": "Houston Texans",
    "Kansas City Royals": "Kanasas City Chiefs",
    "Los Angeles Angels": "Los Angeles Chargers",
    "Los Angeles Dodgers": "Los Angeles Rams",
    "Miami Marlins": "Miami Dolphins",
    "Milwaukee Brewers": "Green Bay Packers",
    "Minnesota Twins": "Minnesota Vikings",
    "New York Yankees": "New York Giants",
    "New York Mets": "New York Jets",
    "Oakland Athletics": "San Francisco 49ers",
    "Philadelphia Phillies": "Philadelpha Eagles",
    "Pittsburgh Pirates": "Pittsburgh Steelers",
    "San Francisco Giants": "San Francisco 49ers",
    "Seattle Mariners": "Seattle Seahawks",
    "Tampa Bay Rays": "Tampa Bay Buccaneers",
    "Texas Rangers": "Dallas Cowboys",
    "Toronto Blue Jays": "Bufallo Bills",
    "Washington Nationals": "Washington Commanders"
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
/*
  async function fetchNFLScores() {
    console.log('fetchMLBScores function started.');
  
    const url = 'https://odds.p.rapidapi.com/v4/sports/americanfootball_nfl/scores';
    const params = {
      daysFrom: '1',
      apiKey: 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448'
    };
    const queryParams = new URLSearchParams(params);
  
    try {
      const response = await fetch(`${url}?${queryParams}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'odds.p.rapidapi.com',
          'x-rapidapi-key': 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448'
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
      console.error('Error fetching NFL scores:', error);
    }
  }*/

    async function fetchNFLScores() {
      console.log('fetchNFLScores function started.');
      
      const url = 'https://odds.p.rapidapi.com/v4/sports/americanfootball_nfl/scores';
      const params = {
        daysFrom: '2',
        apiKey: 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448'
      };
      const queryParams = new URLSearchParams(params);
    
      try {
        const response = await fetch(`${url}?${queryParams}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'odds.p.rapidapi.com',
            'x-rapidapi-key': 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448'
          }
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
    
        const scores = await response.json();
        console.log("Scores data:", scores);
    
        // Filter out ongoing games based on `completed` field
        const completedGames = scores.filter(event => event.completed === true);
    
        gameScores = completedGames.map(event => {
          if (!event.scores || !Array.isArray(event.scores)) {
            console.log(`Skipping event due to missing or invalid scores:`, event);
            return null;
          }
    
          // Map team names if necessary, else use NFL names directly
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
        }).filter(match => match !== null);  // Remove any null entries
    
        console.log('Completed scores fetched:', gameScores);
    
        await updateScores(gameScores);
      } catch (error) {
        console.error('Error fetching NFL scores:', error);
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





  /*
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

        // Check if the pick is already in allResults
        const resultAlreadyProcessed = allResults.find(
            r => r.username === username && r.poolName === poolName && r.teamName === teamName && r.betValue === betValue
        );

        if (resultAlreadyProcessed) {
            console.log(`Result already processed for ${teamName}, skipping...`);
            return;
        }

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
*/
/*
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

  const homeTeamScore = match.home_score;
  const awayTeamScore = match.away_score;
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  console.log(`Processing pick: ${betValue}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Home Team Score: ${homeTeamScore}, Away Team Score: ${awayTeamScore}`);

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

      // Get the bet result using the updated function, now passing homeTeam and awayTeam
      const { result, odds } = getBetResult(betValue, homeTeamScore, awayTeamScore, teamName, homeTeam, awayTeam);
      const points = calculatePointsForResult({ result, odds, type: isImmortalLock ? 'ImmortalLock' : undefined });

      // Check if the pick is already in allResults
      const resultAlreadyProcessed = allResults.find(
          r => r.username === username && r.poolName === poolName && r.teamName === teamName && r.betValue === betValue
      );

      if (resultAlreadyProcessed) {
          console.log(`Result already processed for ${teamName}, skipping...`);
          return;
      }

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
}*/

async function processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, isImmortalLock) {
  const { teamName, value: betValue } = pickEntry;
  
  // Find the match in the gameScores
  const match = gameScores.find(m => m.home_team === teamName || m.away_team === teamName);

  if (!match) {
      console.log(`No game score available for ${teamName}, skipping...`);
      return;
  }

  // Optionally add a check to ensure the game has completed
  if (typeof match.completed !== 'undefined' && !match.completed) {
      console.log(`Game for ${teamName} is still ongoing, skipping...`);
      return;
  }

  if (!betValue) {
      console.error('Invalid betValue for pickEntry:', pickEntry);
      return;
  }

  // Ensure scores are valid numbers
  const homeTeamScore = parseInt(match.home_score, 10);
  const awayTeamScore = parseInt(match.away_score, 10);
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  // Check for valid scores
  if (isNaN(homeTeamScore) || isNaN(awayTeamScore)) {
      console.error(`Invalid scores for match between ${homeTeam} and ${awayTeam}. Skipping...`);
      return;
  }

  console.log(`Processing pick: ${betValue}, Home Team: ${homeTeam}, Away Team: ${awayTeam}, Home Team Score: ${homeTeamScore}, Away Team Score: ${awayTeamScore}`);

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

      // Get the bet result using the updated function, now passing homeTeam and awayTeam
      const { result, odds } = getBetResult(betValue, homeTeamScore, awayTeamScore, teamName, homeTeam, awayTeam);
      const points = calculatePointsForResult({ result, odds, type: isImmortalLock ? 'ImmortalLock' : undefined });

      // Check if the pick is already in allResults
      const resultAlreadyProcessed = allResults.find(
          r => r.username === username && r.poolName === poolName && r.teamName === teamName && r.betValue === betValue
      );

      if (resultAlreadyProcessed) {
          console.log(`Result already processed for ${teamName}, skipping...`);
          return;
      }

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


const url1 = 'http://localhost:3000/api/saveWeeklyPicks';
const url2 = 'http://localhost:3000/api/fetchMLBData';
const url3 = 'http://localhost:3000/api/fetchNFLDataOneWeekOut';
 // || ;

const fetchMLBData = async () => {
    const response = await fetch(url2, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch MLB data: ${response.status} - ${errorText}`);
      throw new Error('Failed to fetch MLB data');
    }
    const betOptions = await response.json();
    console.log('Scheduled bet options:', betOptions);
  
    // Return the betOptions to be used for saving
    return betOptions;
  };
  
  const fetchNFLDataOneWeekOut = async () => {
    const response = await fetch(url3, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch NFL data: ${response.status} - ${errorText}`);
      throw new Error('Failed to fetch NFL data');
    }
    const betOptions = await response.json();
    console.log('Scheduled bet options:', betOptions);
  
    // Return the betOptions to be used for saving
    return betOptions;
  };
  
  const saveWeeklyPicks = async (betOptions: any) => {
    const response = await fetch(url1, {
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





const url5 = 'http://localhost:3000/api/saveNFLSchedule'
const saveNFLSchedule = async (betOptions: any) => {
  const chunkSize = 50; // Define the chunk size
  const totalChunks = Math.ceil(betOptions.length / chunkSize);

  console.log(`Total items: ${betOptions.length}`);
  console.log(`Total chunks: ${totalChunks}`);

  for (let i = 0; i < totalChunks; i++) {
    const chunk = betOptions.slice(i * chunkSize, (i + 1) * chunkSize);
    console.log(`Saving chunk ${i + 1}/${totalChunks}, size: ${Buffer.byteLength(JSON.stringify(chunk))} bytes`);

    try {
      const response = await fetch(url5, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ picks: chunk })
      });

      if (!response.ok) {
        throw new Error('Failed to save weekly picks');
      }

      const data = await response.json();
      if (data.success) {
        console.log(`Chunk ${i + 1} of ${totalChunks} saved successfully`);
      } else {
        console.error(`Error saving chunk ${i + 1} of ${totalChunks}`);
      }
    } catch (error) {
      console.error(`Failed to save chunk ${i + 1}:`, error);
    }
  }
};

/*
cron.schedule('54 12 * * 4', () => {
  console.log("Its thursday, gettin scores");
  
fetchNFLScores();
});*/

const url4 = 'http://localhost:3000/api/fetchNFLschedule';

const fetchNFLschedule = async () => {
const response = await fetch( url4, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

if (!response.ok) {
  throw new Error('Failed to fetch MLB data');
}

const betOptions = await response.json();
const dataSize = Buffer.byteLength(JSON.stringify(betOptions));
console.log(`Data size: ${dataSize} bytes`);
// Return the betOptions to be used for saving
return betOptions;
};

cron.schedule('0 8 * * 1', () => {
  console.log("MON It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 8 * * 2', () => {
  console.log("TUESDAY It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 8 * * 3', () => {
  console.log(" WED It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 8 * * 4', () => {
  console.log(" THURSDAY It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 0 * * 2', async () => { // every tuesday
  try {
    const betOptions = await fetchNFLDataOneWeekOut();
    await saveWeeklyPicks(betOptions);
  } catch (error) {
    console.error('Scheduled job failed:', error);
  }
});

cron.schedule('0 7 * * 1', () => {
  console.log("monday morning injruy sweep");
  deleteInjuriesFromServer();
})

//pushed back for cardinals
cron.schedule('0 0 * * 2', () => {
  console.log("It's Tuesday 12:00 AM, now deleting results");
  deleteResultsFromServer();
  deletePicksFromServer();
  console.log("Updating Thursday deadline to the upcoming Thursday");
  updateThursdayDeadline();
});


//changed from 0 19 * * 4 on 11/26 for thanksgiving games
cron.schedule('0 19 * * 4', () => {
  console.log("It's Thursday 7:00 PM, now saving picks to last week");
  savePicksToLastWeek();
  console.log("Updating Tuesday start time to the upcoming Tuesday");
  updateTuesdayStartTime();
});

// Thursday 4:00pm CT
cron.schedule('25 16 * * 3', () => {
  console.log("It's Thursday 4:00 PM");
  fetchNFLScores();
});
cron.schedule('30 20 * * 3', () => {
  console.log("It's Thursday 4:00 PM");
  fetchNFLScores();
});


// Thursday 11:35pm CT
cron.schedule('35 23 * * 4', () => {
  console.log("It's Thursday 11:35 PM");
  fetchNFLScores();
});

// Thursday 11:35pm CT
cron.schedule('55 23 * * 4', () => {
  console.log("It's Thursday 11:35 PM");
  fetchNFLScores();
});


cron.schedule('10 16 * * 6', () => {
  fetchNFLScores();
});

cron.schedule('15 20 * * 6', () => {
  fetchNFLScores();
});

cron.schedule('35 23 * * 6', () => {
  fetchNFLScores();
});

// Sunday 4:15pm CT
cron.schedule('8 17 * * 0', () => {
  console.log("It's Sunday 4:15 PM");
  fetchNFLScores();
});

// Sunday 4:15pm CT
cron.schedule('58 16 * * 6', () => {
  console.log("It's Sunday 4:15 PM");
  fetchNFLScores();
});


cron.schedule('25 20 * * 6', () => {
  console.log("It's Sunday 4:15 PM");
  fetchNFLScores();
});

// Sunday 8:15pm CT
cron.schedule('15 20 * * 0', () => {
  console.log("It's Sunday 8:15 PM");
  fetchNFLScores();
});

cron.schedule('55 19 * * 0', () => {
  console.log("It's Sunday 8:15 PM");
  fetchNFLScores();
});
cron.schedule('30 20 * * 0', () => {
  console.log("It's Sunday 8:15 PM");
  fetchNFLScores();
});


// Sunday 11:40pm CT
cron.schedule('40 23 * * 0', () => {
  console.log("It's Sunday 11:40 PM");
  fetchNFLScores();
});

// Monday 11:45pm CT
cron.schedule('45 23 * * 1', () => {
  console.log("It's Monday 11:45 PM");
  fetchNFLScores();
});

// Monday 11:45pm CT
cron.schedule('58 23 * * 1', () => {
  console.log("It's Monday 11:45 PM");
  fetchNFLScores();
});