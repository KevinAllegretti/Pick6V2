import * as cron from 'node-cron';
import fetch from 'node-fetch';
//checkityceckcgeck
//import { fetchAndSaveInjuries } from './src/InjuryRoutes.ts';
import { updateUserPoints, updateUserStats, saveResultsToServer, 
    deleteResultsFromServer, getAllPicks, getBetResult, calculatePointsForResult, 
    savePicksToLastWeek,   updateThursdayDeadline,
    updateTuesdayStartTime, deletePicksFromServer, saveSurvivorPicks} from './serverUtils';
    import { fetchAndSaveInjuries } from './InjuryServices';
    import { deleteInjuriesFromServer } from '../routes/InjuryRoutes';
    import { incrementWeek } from './serverUtils';
    import { getCurrentWeek } from './serverUtils';
import { connectToDatabase } from './connectDB';
import { eliminateUsersWithoutPicks } from './serverUtils';
let gameScores: any[] = [];
async function fetchAndSavePGAChampionshipOdds() {
  console.log('Fetching PGA Championship odds from FanDuel...');
  
  // Step 1: Get the API key
  const apiKey = 'e22c201b39907f6f0b2cb61e9edb6e64'; // Use your existing API key
  
  try {
    // Step 2: First get a list of in-season sports to find the golf key
    const sportsResponse = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'odds.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    if (!sportsResponse.ok) {
      throw new Error(`HTTP error! Status: ${sportsResponse.status}`);
    }
    
    const sportsData = await sportsResponse.json();
    
    // Specifically look for PGA Championship
    const pgaChampionship = sportsData.find((sport: any) => 
      sport.key.includes('pga_championship') || 
      (sport.title && sport.title.includes('PGA Championship'))
    );
    
    if (!pgaChampionship) {
      console.log('PGA Championship not found in available tournaments.');
      return;
    }
    
    console.log(`Found PGA Championship: ${pgaChampionship.title}, key: ${pgaChampionship.key}`);
    
    // Use the 'outrights' market
    const market = 'outrights';
    console.log(`Fetching ${pgaChampionship.title} odds with market: ${market}`);
    
    const oddsResponse = await fetch(`https://api.the-odds-api.com/v4/sports/${pgaChampionship.key}/odds/?apiKey=${apiKey}&regions=us&markets=${market}&oddsFormat=american&bookmakers=fanduel`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'odds.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    if (!oddsResponse.ok) {
      throw new Error(`HTTP error fetching odds! Status: ${oddsResponse.status}`);
    }
    
    const oddsData = await oddsResponse.json();
    
    if (oddsData.length === 0) {
      console.log(`No odds data available from FanDuel for market '${market}'.`);
      return;
    }
    
    console.log(`==========================================`);
    console.log(`FANDUEL ODDS FOR: ${pgaChampionship.title.toUpperCase()}`);
    console.log(`==========================================`);
    console.log(`Retrieved data for ${oddsData.length} events`);
    
    // Process the odds data - find the FanDuel bookmaker and extract golfer odds
    let golferOdds: any[] = [];
    
    oddsData.forEach((event: any) => {
      const startTime = new Date(event.commence_time);
      console.log(`\nTournament: ${pgaChampionship.title}`);
      console.log(`Start time: ${startTime.toLocaleString()}`);
      
      // Find FanDuel among the bookmakers
      const fanduel = event.bookmakers.find((bm: any) => 
        bm.key === 'fanduel' || bm.title.toLowerCase().includes('fanduel')
      );
      
      if (!fanduel) {
        console.log('FanDuel odds not available for this event.');
        return;
      }
      
      console.log(`Bookmaker: ${fanduel.title}`);
      console.log(`Last update: ${new Date(fanduel.last_update).toLocaleString()}`);
      
      // Process each market
      fanduel.markets.forEach((market: any) => {
        console.log(`Market: ${market.key}`);
        
        // Sort outcomes by odds
        const sortedOutcomes = [...market.outcomes].sort((a: any, b: any) => {
          // Sort by odds (lower number = higher probability in American odds)
          const aOdds = parseInt(a.price);
          const bOdds = parseInt(b.price);
          
          if (aOdds > 0 && bOdds > 0) {
            return aOdds - bOdds; // Both positive, lower is better
          } else if (aOdds < 0 && bOdds < 0) {
            return bOdds - aOdds; // Both negative, more negative (lower) is better
          } else {
            return aOdds < 0 ? -1 : 1; // Negative beats positive
          }
        });
        
        // Populate golfer odds array
        golferOdds = sortedOutcomes.map((outcome: any, idx: number) => {
          const oddsValue = `${outcome.price > 0 ? '+' : ''}${outcome.price}`;
          console.log(`${idx+1}. ${outcome.name.padEnd(30)}: ${oddsValue}`);
          
          return {
            rank: idx + 1,
            name: outcome.name,
            odds: outcome.price,
            oddsDisplay: oddsValue
          };
        });
      });
    });
    
    // Log API usage info
    console.log(`\nAPI Headers Information:`);
    console.log(`x-requests-remaining: ${oddsResponse.headers.get('x-requests-remaining')}`);
    console.log(`x-requests-used: ${oddsResponse.headers.get('x-requests-used')}`);
    
    if (golferOdds.length === 0) {
      console.log('No golfer odds available from FanDuel.');
      return;
    }
    
    // Save to database
    const database = await connectToDatabase();
    const pgaOddsCollection = database.collection('pgaChampionshipOdds');
    
    // Create a simplified document with just the tournament info and golfer odds
    const oddsDocument = {
      tournament: pgaChampionship.title,
      tournamentKey: pgaChampionship.key,
      startTime: new Date(oddsData[0].commence_time),
      bookmaker: 'FanDuel',
      fetchedAt: new Date(),
      golferOdds: golferOdds
    };
    
    // Save to the database
    const result = await pgaOddsCollection.insertOne(oddsDocument);
    
    console.log(`\nSaved PGA Championship FanDuel odds to database with ID: ${result.insertedId}`);
    
    return oddsDocument;
    
  } catch (error) {
    console.error('Error fetching PGA Championship odds:', error);
  }
}

/*
// Set up cron job to run weekly
cron.schedule('41 14 * * 2', () => {
  console.log('Running weekly PGA Championship FanDuel odds update...');
  fetchAndSavePGAChampionshipOdds();
});*/

    async function fetchNFLScores() {
      console.log('fetchNFLScores function started.');
      
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
    
        // Filter out ongoing games based on `completed` field
        const completedGames = scores.filter(event => event.completed === true);
    
        gameScores = completedGames.map(event => {
          if (!event.scores || !Array.isArray(event.scores)) {
            console.log(`Skipping event due to missing or invalid scores:`, event);
            return null;
          }
    
          // Map team names if necessary, else use NFL names directly
          const homeTeam = event.home_team;
          const awayTeam =  event.away_team;
          const homeScore = event.scores.find(s =>  s.name === event.home_team)?.score;
          const awayScore = event.scores.find(s =>  s.name === event.away_team)?.score;
    
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
    

    async function updateScores(gameScores) {
      console.log('gameScores at update:', gameScores);
      let allResults = []; // Store all results for the current session
    
      // Get all picks, including playoff picks
      const allPicks = await getAllPicks();
      
      console.log('All picks retrieved, including playoff picks:', allPicks.length);
      
      // Log how many playoff picks we found
      const playoffPicks = allPicks.filter(pick => pick.poolName.startsWith('playoff_'));
      console.log('Playoff picks found:', playoffPicks.length);
    
      const database = await connectToDatabase();
      const resultsCollection = database.collection('betResultsGlobal');
    
      for (const pick of allPicks) {
        const { username, poolName, picks, immortalLock } = pick;
        
        // Check if this is a playoff pick
        const isPlayoffPick = poolName.startsWith('playoff_');
        console.log(`Processing picks for ${username} in pool ${poolName} (Playoff: ${isPlayoffPick})`);
    
        // Process normal picks
        for (const pickEntry of picks) {
          await processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, false, isPlayoffPick);
        }
    
        // Process immortal lock pick
        if (immortalLock && immortalLock.length > 0) {
          await processPick(username, poolName, immortalLock[0], gameScores, allResults, resultsCollection, true, isPlayoffPick);
        }
      }
    
      console.log('All Results:', allResults);
    
      // Save results to the server
      await saveResultsToServer(allResults);
    }



// In your cron job file
export async function updatePlayoffStats(username, originalPoolName, winIncrement = 0, lossIncrement = 0, pushIncrement = 0, pointsIncrement = 0) {
  try {
      console.log(`Updating playoff stats for ${username} in ${originalPoolName}: W:${winIncrement} L:${lossIncrement} P:${pushIncrement} Pts:${pointsIncrement}`);
      
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      
      // Get the current week
      const currentWeek = await getCurrentWeek();
      
      // Find the pool document and update the specific player's stats in the playoffMembers array
      const result = await poolsCollection.updateOne(
          {
              name: originalPoolName,
              hasPlayoffs: true,
              'playoffMembers.username': username.toLowerCase()
          },
          {
              $inc: {
                  'playoffMembers.$.win': winIncrement,
                  'playoffMembers.$.loss': lossIncrement,
                  'playoffMembers.$.push': pushIncrement,
                  'playoffMembers.$.weeklyPoints': pointsIncrement
              }
          }
      );
      
      if (result.modifiedCount === 0) {
          console.warn(`No playoff stats updated for ${username} in ${originalPoolName}`);
      } else {
          console.log(`Successfully updated playoff stats for ${username} in ${originalPoolName}`);
      }
      
      return { success: true };
  } catch (error: any) {
      console.error('Error updating playoff stats:', error);
      return { success: false, message: error.message };
  }
}

// The complete processPick function with the TypeScript fix:

async function processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, isImmortalLock = false, isPlayoffPick = false) {
  const { teamName, value: betValue } = pickEntry;

  // Ensure betValue is in a consistent format
  const betValueString = typeof betValue === 'string' ? betValue : String(betValue);

  // Find the match in the gameScores
  const match = gameScores.find(m => m.home_team === teamName || m.away_team === teamName);

  if (!match) {
      console.log(`No game score available for ${teamName}, skipping...`);
      return;
  }

  if (typeof match.completed !== 'undefined' && !match.completed) {
      console.log(`Game for ${teamName} is still ongoing, skipping...`);
      return;
  }

  if (!betValue) {
      console.error('Invalid betValue for pickEntry:', pickEntry);
      return;
  }

  const homeTeamScore = parseInt(match.home_score, 10);
  const awayTeamScore = parseInt(match.away_score, 10);
  const homeTeam = match.home_team;
  const awayTeam = match.away_team;

  if (isNaN(homeTeamScore) || isNaN(awayTeamScore)) {
      console.error(`Invalid scores for match between ${homeTeam} and ${awayTeam}. Skipping...`);
      return;
  }

  try {
      // For playoff picks, check if the pick's week matches the current week
      if (isPlayoffPick) {
          // Get the current week
          const currentWeek = await getCurrentWeek();
          
          // Get the pick's week from the pick object or from the database
          const database = await connectToDatabase();
          const userPicksCollection = database.collection('userPicks');
          const pickData = await userPicksCollection.findOne({
              username: username,
              poolName: poolName
          });
          
          if (pickData && pickData.week !== currentWeek) {
              console.log(`Skipping playoff pick for ${username} in ${poolName} - wrong week (pick week: ${pickData.week}, current week: ${currentWeek})`);
              return;
          }
      }
      
      // Check if the result is already in the database
      const existingResult = await resultsCollection.findOne({
          identifier: 'currentResults',
          "results.username": username,
          "results.poolName": poolName,
          "results.teamName": teamName,
          "results.betValue": betValue
      });

      if (existingResult) {
          console.log(`Result already exists for ${teamName}, skipping...`);
          return;
      }

      // Get the bet result
      const { result, odds } = getBetResult(betValueString, homeTeamScore, awayTeamScore, teamName, homeTeam, awayTeam);
      const points = calculatePointsForResult({ result, odds, type: isImmortalLock ? 'ImmortalLock' : undefined });

      // For playoff picks, get the original pool name without the prefix
      let originalPoolName = poolName;
      if (isPlayoffPick && poolName.startsWith('playoff_')) {
          originalPoolName = poolName.substring(8); // Remove 'playoff_' prefix
      }

      // Check if the pick is already in allResults
      const resultAlreadyProcessed = allResults.find(
          r => r.username === username && 
               r.poolName === poolName && 
               r.teamName === teamName && 
               r.betValue === betValue
      );

      if (resultAlreadyProcessed) {
          console.log(`Result already processed for ${teamName}, skipping...`);
          return;
      }

      // Add to results array
      allResults.push({ 
          username, 
          poolName, 
          teamName, 
          betValue, 
          result, 
          points, 
          isImmortalLock,
          isPlayoffPick
      });

      // Handle playoff picks differently
      if (isPlayoffPick) {
          console.log(`Processing playoff pick for ${username} in ${poolName} (original pool: ${originalPoolName})`);
          
          // Update stats for playoff record
          let winIncrement = 0, lossIncrement = 0, pushIncrement = 0;
          
          if (result === 'hit') {
              winIncrement = 1;
          } else if (result === 'miss') {
              lossIncrement = 1;
          } else if (result === 'push') {
              pushIncrement = 1;
          }
          
          // Use updatePlayoffStats to update playoff stats directly
          await updatePlayoffStats(
              String(username), 
              originalPoolName, 
              winIncrement, 
              lossIncrement, 
              pushIncrement,
              points
          );
      } else {
          // Check for surviving pool
          const database = await connectToDatabase();
          const poolsCollection = database.collection('pools');
          const pool = await poolsCollection.findOne({ name: poolName });

          // Process regular picks (survivor or classic pools)
          let winIncrement = 0, lossIncrement = 0, pushIncrement = 0;
          
          if (result === 'hit') {
              winIncrement = 1;
          } else if (result === 'miss') {
              lossIncrement = 1;
          } else if (result === 'push') {
              pushIncrement = 1;
          }

          // Update regular stats
          await updateUserStats(username, poolName, winIncrement, lossIncrement, pushIncrement);
          
          // Handle survivor pool elimination
          if (pool && pool.mode === 'survivor') {
              const numericValue = parseFloat(betValueString.replace(/[^-+\d.]/g, ''));
              const isMoneylineBet = Math.abs(numericValue) >= 100;
              
              if (isMoneylineBet && result === 'miss' || isMoneylineBet && result === 'push') {
                  console.log(`Eliminating user ${username} from survivor pool ${poolName} due to moneyline loss`);
                  
                  const currentWeek = await getCurrentWeek();
                  
                  // Update survivor status
                  await poolsCollection.updateOne(
                      {
                          name: poolName,
                          'members.username': username.toLowerCase()
                      },
                      {
                          $set: {
                              'members.$.isEliminated': true
                          }
                      }
                  );

                  // Add to eliminatedMembers array
                  await poolsCollection.updateOne(
                      { name: poolName },
                      {
                          $addToSet: {
                              eliminatedMembers: {
                                  username: username.toLowerCase(),
                                  eliminatedAt: new Date(),
                                  eliminationWeek: currentWeek
                              }
                          }
                      }
                  );
              }
          } else {
              // For regular pools (not survivor), update points
              if (points !== 0) {
                  //await updateUserPoints(username, poolName, String(points));
                  await updateUserPoints(username, points, poolName);
              }
          }
      }
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



cron.schedule('0 0 * * 2', () => {
  console.log("TUESDAY It's 12:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 0 * * 3', () => {
  console.log(" WED It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

cron.schedule('0 0 * * 4', () => {
  console.log(" THURSDAY It's 8:00am fetching and saving injuries");
  fetchAndSaveInjuries();
});

/*cron.schedule('0 0 * * 2', async () => { // every tuesday
  try {
    const betOptions = await fetchNFLDataOneWeekOut();
    await saveWeeklyPicks(betOptions);
  } catch (error) {
    console.error('Scheduled job failed:', error);
  }
});*/

cron.schedule('0 7 * * 1', () => {
  console.log("monday morning injruy sweep");
  deleteInjuriesFromServer();
})

//pushed back for cardinals
cron.schedule('0 0 * * 2', () => {
  console.log("It's Tuesday 12:00 AM, now deleting results");
 // deleteResultsFromServer();
 // deletePicksFromServer();
  console.log("Updating Thursday deadline to the upcoming Thursday");
  updateThursdayDeadline();
});

// Mock NFL game data
const mockNFLGames = [
  {
    completed: true,
    home_team: "Philadelphia Eagles",
    away_team: "Washington Commanders",
    scores: [
      { name: "Philadelphia Eagles", score: "24" },
      { name: "Washington Commanders", score: "31" }
    ]
  },
  {
    completed: true,
    home_team: "Kansas City Chiefs",
    away_team: "Buffalo Bills",
    scores: [
      { name: "Kansas City Chiefs", score: "34" },
      { name: "Buffalo Bills", score: "34" }
    ]
  },
  {
    completed: true,
    home_team: "Miami Dolphins",
    away_team: "Tampa Bay Buccaneers",
    scores: [
      { name: "Miami Dolphins", score: "18" },
      { name: "Tampa Bay Buccaneers", score: "24" }
    ]
  },
  {
    completed: true,
    home_team: "Cincinnati Bengals",
    away_team: "Baltimore Ravens",
    scores: [
      { name: "Cincinnati Bengals", score: "21" },
      { name: "Baltimore Ravens", score: "24" }
    ]
  },
  {
    completed: true,
    home_team: "San Francisco 49ers",
    away_team: "Dallas Cowboys",
    scores: [
      { name: "San Francisco 49ers", score: "27" },
      { name: "Dallas Cowboys", score: "20" }
    ]
  },
  {
    completed: true,
    home_team: "Green Bay Packers",
    away_team: "Detroit Lions",
    scores: [
      { name: "Green Bay Packers", score: "31" },
      { name: "Detroit Lions", score: "24" }
    ]
  },
  {
    completed: true,
    home_team: "Seattle Seahawks",
    away_team: "Los Angeles Rams",
    scores: [
      { name: "Seattle Seahawks", score: "24" },
      { name: "Los Angeles Rams", score: "21" }
    ]
  },
  {
    completed: true,
    home_team: "Jacksonville Jaguars",
    away_team: "Los Angeles Chargers",
    scores: [
      { name: "Jacksonville Jaguars", score: "30" },
      { name: "Los Angeles Chargers", score: "27" }
    ]
  }
];

// Finally, update the mockFetchNFLScores function to add more logging for verification
async function mockFetchNFLScores() {
  console.log('mockFetchNFLScores function started.');

  try {
      // Simulate API response delay
      await new Promise(resolve => setTimeout(resolve, 500));
     
      console.log("Mock Scores data:", mockNFLGames);
     
      // Filter completed games (already all completed in our mock data)
      const completedGames = mockNFLGames.filter(event => event.completed === true);
     
      gameScores = completedGames.map(event => {
          if (!event.scores || !Array.isArray(event.scores)) {
              console.log(`Skipping event due to missing or invalid scores:`, event);
              return null;
          }
         
          const homeTeam = event.home_team;
          const awayTeam = event.away_team;
          const homeScore: any = event.scores.find(s => s.name === event.home_team)?.score;
          const awayScore:any = event.scores.find(s => s.name === event.away_team)?.score;
         
          return {
              home_team: homeTeam,
              away_team: awayTeam,
              home_score: parseInt(homeScore, 10),
              away_score: parseInt(awayScore, 10)
          };
      }).filter(match => match !== null);
     
      console.log('Completed scores fetched:', gameScores);
     
      await updateScores(gameScores);
      
      // After processing, check playoff stats to verify updates
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      const playoffPools = await poolsCollection.find({ 
          hasPlayoffs: true,
          playoffCurrentWeek: { $exists: true, $ne: null }
      }).toArray();
      
      console.log('Checking playoff records after processing:');
      for (const pool of playoffPools) {
          console.log(`Pool ${pool.name} playoff members stats:`);
          pool.playoffMembers.forEach(member => {
              console.log(`- ${member.username}: ${member.win}W/${member.loss}L/${member.push}P - ${member.weeklyPoints} pts`);
          });
      }
  } catch (error) {
      console.error('Error in mock NFL scores:', error);
  }
}


cron.schedule('43 11 * * 5', () => {
  console.log("It's Thursday 4:00 PM");
  saveSurvivorPicks();
});
/*
cron.schedule('46 16 * * 4', () => {
  console.log("It's Thursday 7:05 PM, eliminating users without picks from survivor pools");
  eliminateUsersWithoutPicks();
});
*/
/*

cron.schedule('0 0 * * 2', async () => {
  console.log("It's Tuesday 12:00 AM, incrementing NFL week");
  await incrementWeek();
});






cron.schedule('0 19 * * 4', () => {
  console.log("It's Thursday 7:00 PM, now saving picks to last week");
  savePicksToLastWeek();
  console.log("Updating Tuesday start time to the upcoming Tuesday");
  updateTuesdayStartTime();
});
/*
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
});*/



cron.schedule('46 16 * * 2', () => {
  console.log("It's Thursday 4:00 PM");
  mockFetchNFLScores();
  //test test pm2 reload
});

// Initialize playoffs at week 14
const url6= 'http://localhost:3000';
cron.schedule('19 16 * * 2', async () => {
  const currentWeek = await getCurrentWeek();
  
  if (currentWeek === 14) {
    console.log("Week 14 detected: Initializing playoffs for eligible pools");
    try {
      const response = await fetch(`${url6}/api/playoffs/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize playoffs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Playoffs initialization result:', data);
    } catch (error) {
      console.error('Error initializing playoffs:', error);
    }
  }
});


// Advance playoffs to next round END OF SAME WEEK
cron.schedule('27 17 * * 3', async () => {
  const currentWeek = await getCurrentWeek();
  
  if (currentWeek >= 14 && currentWeek <= 17) {
    console.log(`Advancing playoffs from week ${currentWeek}`);
    try {
      const response = await fetch(`${url6}/api/playoffs/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to advance playoffs: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Playoff advancement result:', data);
    } catch (error) {
      console.error('Error advancing playoffs:', error);
    }
  }
});





//GOLFFFF
// Define interfaces for API responses and processing
interface GolferData {
  firstName?: string;
  lastName?: string;
  total?: number | string;
  score?: number | string;
  position?: string;
  status?: string;
}

interface FormattedGolfer {
  firstName: string;
  lastName: string;
  name: string;
  score: number;
  scoreDisplay: string;
  position: string;
  status: string;
}

interface TournamentInfo {
  tournId: string;
  name: string;
  status: string;
  dates: {
    start: string;
    end: string;
  };
}

interface TournamentDocument {
  tournamentName: string;
  tournamentId: string;
  year: string;
  fetchedAt: Date;
  status: string;
  tournamentInfo?: TournamentInfo;
  data: any;
}

async function fetchAndSavePGAChampionshipData(): Promise<{ success: boolean, id?: string, status?: string, error?: any }> {
  console.log('Fetching PGA Championship Tournament information and saving to database...');
  
  const tournamentId = '033';
  const tournamentName = 'PGA Championship';
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const year = '2025';
  
  try {
    const database = await connectToDatabase();
    const pgaChampionshipCollection = database.collection('golfTournaments');
    
    console.log(`Fetching PGA Championship data with ID: ${tournamentId}...`);
    
    // Try to get the leaderboard for the tournament
    const leaderboardResponse = await fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournamentId}&year=${year}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    // If we can get a leaderboard, process it
    if (leaderboardResponse.ok) {
      const leaderboardData = await leaderboardResponse.json();
      
      // Check if there's actual leaderboard data
      let leaderboard: GolferData[] = [];
      let tournamentStatus = 'upcoming';
      
      // Look for leaderboard data in different possible properties
      if (Array.isArray(leaderboardData.leaderboard)) {
        leaderboard = leaderboardData.leaderboard;
        tournamentStatus = 'in-progress';
      } else if (Array.isArray(leaderboardData.leaderboardRows)) {
        leaderboard = leaderboardData.leaderboardRows;
        tournamentStatus = 'in-progress';
      }
      
      console.log(`Found ${leaderboard.length} players on leaderboard`);
      
      // If we have a leaderboard with players, process it
      if (leaderboard.length > 0) {
        // Format the leaderboard data for our database
        const formattedLeaderboard: FormattedGolfer[] = leaderboard.map(player => {
          // Extract score - handle different API response formats
          let score = 0;
          let scoreDisplay = "E"; // Default display is even par
          
          if (player?.total !== undefined) {
            // Handle "E" for even par
            if (player.total === "E") {
              score = 0;
              scoreDisplay = "E";
            } else {
              // Convert to number if it's a string with a number
              score = typeof player.total === 'number' ? player.total : 
                      parseInt(String(player.total).replace("+", "")) || 0;
              
              // Generate display format
              scoreDisplay = score === 0 ? "E" : (score > 0 ? `+${score}` : `${score}`);
            }
          } else if (player?.score !== undefined) {
            // Parse string score ("+5", "-3", "E")
            const scoreStr = String(player.score);
            if (scoreStr === "E") {
              score = 0;
              scoreDisplay = "E";
            } else {
              score = parseInt(scoreStr.replace("+", "")) || 0;
              scoreDisplay = score === 0 ? "E" : (score > 0 ? `+${score}` : `${score}`);
            }
          }
          
          return {
            firstName: player?.firstName || "",
            lastName: player?.lastName || "",
            name: `${player?.firstName || ""} ${player?.lastName || ""}`.trim(),
            score: score,
            scoreDisplay: scoreDisplay,
            position: player?.position || "",
            status: player?.status || "active"
          };
        });
        
        // Save the tournament data
        const pgaDocument: TournamentDocument = {
          tournamentName,
          tournamentId,
          year,
          fetchedAt: new Date(),
          status: tournamentStatus,
          data: {
            leaderboard: formattedLeaderboard
          }
        };
        
        // Save to database
        const result = await pgaChampionshipCollection.insertOne(pgaDocument);
        
        console.log(`\n==========================================`);
        console.log(`PGA CHAMPIONSHIP LEADERBOARD SAVED`);
        console.log(`==========================================`);
        console.log(`Tournament: ${tournamentName}`);
        console.log(`Status: ${tournamentStatus}`);
        console.log(`Players: ${formattedLeaderboard.length}`);
        
        // Show top 5 players
        if (formattedLeaderboard.length > 0) {
          console.log(`\nTop 5 Players:`);
          formattedLeaderboard.slice(0, 5).forEach((player, idx) => {
            console.log(`${idx+1}. ${player.name.padEnd(25)} ${player.scoreDisplay}`);
          });
        }
        
        // Process golf picks with this real leaderboard data
        await processGolfPicks(formattedLeaderboard);
        
        return { success: true, id: result.insertedId.toString(), status: tournamentStatus };
      }
    }
    
    // If no leaderboard is available yet, proceed with scheduled info
    console.log('No leaderboard data available. Saving tournament schedule info.');
    
    // Get schedule info
    const scheduleResponse = await fetch(`https://live-golf-data.p.rapidapi.com/schedule?year=${year}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    if (!scheduleResponse.ok) {
      throw new Error(`HTTP error fetching schedule! Status: ${scheduleResponse.status}`);
    }
    
    const scheduleData = await scheduleResponse.json();
    
    // Initialize with default values to avoid null errors
    const defaultTournamentInfo: TournamentInfo = {
      tournId: tournamentId,
      name: tournamentName,
      status: 'upcoming',
      dates: {
        start: '2025-05-15T00:00:00Z',
        end: '2025-05-18T00:00:00Z'
      }
    };
    
    // Find PGA Championship in the schedule
    let pgaTournamentInfo: TournamentInfo = defaultTournamentInfo;
    let found = false;
    
    if (Array.isArray(scheduleData)) {
      const foundItem = scheduleData.find(t => t.tournId === tournamentId);
      if (foundItem) {
        pgaTournamentInfo = {
          tournId: foundItem.tournId || tournamentId,
          name: foundItem.name || tournamentName,
          status: foundItem.status || 'upcoming',
          dates: {
            start: foundItem.dates?.start || '2025-05-15T00:00:00Z',
            end: foundItem.dates?.end || '2025-05-18T00:00:00Z'
          }
        };
        found = true;
      }
    } else if (scheduleData && typeof scheduleData === 'object') {
      for (const key in scheduleData) {
        if (Array.isArray(scheduleData[key])) {
          const foundItem = scheduleData[key].find(t => t.tournId === tournamentId);
          if (foundItem) {
            pgaTournamentInfo = {
              tournId: foundItem.tournId || tournamentId,
              name: foundItem.name || tournamentName,
              status: foundItem.status || 'upcoming',
              dates: {
                start: foundItem.dates?.start || '2025-05-15T00:00:00Z',
                end: foundItem.dates?.end || '2025-05-18T00:00:00Z'
              }
            };
            found = true;
            break;
          }
        }
      }
    }
    
    if (!found) {
      console.log('Could not find PGA Championship details in schedule. Using placeholder record.');
    }
    
    // Create a document to save with the schedule information
    const pgaDocument: TournamentDocument = {
      tournamentName,
      tournamentId,
      year,
      fetchedAt: new Date(),
      status: 'upcoming',
      tournamentInfo: pgaTournamentInfo,
      data: { message: 'No leaderboard data available yet. Tournament is scheduled for the future.' }
    };
    
    // Save to the database
    const result = await pgaChampionshipCollection.insertOne(pgaDocument);
    
    console.log(`\n==========================================`);
    console.log(`PGA CHAMPIONSHIP INFO SAVED`);
    console.log(`==========================================`);
    console.log(`Tournament: ${tournamentName}`);
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Year: ${year}`);
    console.log(`Status: Upcoming - Scheduled for May 15-18, 2025`);
    console.log(`Saved with ID: ${result.insertedId.toString()}`);
    
    return { success: true, id: result.insertedId.toString(), status: 'upcoming' };
    
  } catch (error) {
    console.error('Error fetching and saving PGA Championship data:', error);
    return { success: false, error };
  }
}

// Process golf picks with real leaderboard data
/*
async function processGolfPicks(golfScores: FormattedGolfer[]): Promise<void> {
  console.log('Processing golf picks with tournament data...');
  
  try {
    const database = await connectToDatabase();
    const userGolfPicksCollection = database.collection('userGolfPicks');
    const golfResultsCollection = database.collection('golfBetResults');
    const poolsCollection = database.collection('pools');
    
    // Get all golf pools that are in playTime phase
    const golfPools = await poolsCollection.find({
      mode: 'golf',
      playTime: true
    }).toArray();
    
    console.log(`Found ${golfPools.length} golf pools in play phase`);
    
    // Process each pool
    for (const pool of golfPools) {
      console.log(`Processing pool: ${pool.name}`);
      
      // Get all user picks for this pool
      const allUserPicks = await userGolfPicksCollection.find({
        poolName: pool.name
      }).toArray();
      
      console.log(`Found ${allUserPicks.length} users with picks in pool ${pool.name}`);
      
      // Process each user's picks
      for (const userPick of allUserPicks) {
        const username = userPick.username;
        const golfers = userPick.golfers || [];
        
        console.log(`Processing ${golfers.length} golfers for user ${username}`);
        
        // Skip if no golfers selected
        if (golfers.length === 0) continue;
        
        // Calculate scores for each golfer
        let totalScore = 0;
        const golferResults:any = [];
        
        for (const golfer of golfers) {
          const golferName = golfer.golferName;
          
          // Find this golfer in the leaderboard data
          const golferData = golfScores.find(entry => 
            entry.name.toLowerCase() === golferName.toLowerCase()
          );
          
          if (golferData) {
            // Store golfer result
            golferResults.push({
              golferName,
              score: golferData.score,
              scoreDisplay: golferData.scoreDisplay,
              position: golferData.position,
              round: golfer.round
            });
            
            // Store the score directly in the user's pick
            await userGolfPicksCollection.updateOne(
              { 
                username: username.toLowerCase(),
                poolName: pool.name,
                "golfers.golferName": golferName
              },
              {
                $set: {
                  "golfers.$.score": golferData.score,
                  "golfers.$.scoreDisplay": golferData.scoreDisplay,
                  "golfers.$.position": golferData.position
                }
              }
            );
            
            // Add to total score - including positive (over par) scores
            totalScore += golferData.score;
          }
        }
        
        // Calculate average score
        const averageScore = golfers.length > 0 ? totalScore / golfers.length : 0;
        
        // Create score display format for total
        const totalScoreDisplay = totalScore === 0 ? "E" : 
                                (totalScore > 0 ? `+${totalScore}` : 
                                `${totalScore}`);
        
        // Save results to golfBetResults collection
        await golfResultsCollection.updateOne(
          { 
            username: username.toLowerCase(), 
            poolName: pool.name 
          },
          {
            $set: {
              username: username.toLowerCase(),
              poolName: pool.name,
              totalScore,
              totalScoreDisplay,
              averageScore,
              golferResults,
              timestamp: new Date()
            }
          },
          { upsert: true }
        );
        
        // Update pool member's total score
        await poolsCollection.updateOne(
          {
            name: pool.name,
            'members.username': username.toLowerCase()
          },
          {
            $set: {
              'members.$.golfScore': totalScore,
              'members.$.golfScoreDisplay': totalScoreDisplay,
              'members.$.golfSelections': golferResults
            }
          }
        );
        
        console.log(`Updated scores for ${username} in pool ${pool.name}. Total: ${totalScoreDisplay}`);
      }
    }
    
    console.log('Golf scores processed successfully.');
  } catch (error) {
    console.error('Error processing golf picks:', error);
  }
}*/


// Mock leaderboard data - just basic scores for popular golfers
const mockGolfScores = [
  { name: "Scottie Scheffler", score: -12 },
  { name: "Rory McIlroy", score: -7 },
  { name: "Jon Rahm", score: -6 },
  { name: "Brooks Koepka", score: -8 },
  { name: "Jordan Spieth", score: 2 },
  { name: "Dustin Johnson", score: 0 },
  { name: "Justin Thomas", score: -3 },
  { name: "Collin Morikawa", score: -4 },
  { name: "Bryson DeChambeau", score: 4 },
  { name: "Will Zalatoris", score: 7 },
  { name: "Xander Schauffele", score: -10 },
  { name: "Viktor Hovland", score: -5 },
  { name: "Tony Finau", score: -2 },
  { name: "Cameron Smith", score: -1 },
  { name: "Matt Fitzpatrick", score: 1 },
  { name: "Hideki Matsuyama", score: 5 },
  { name: "Tommy Fleetwood", score: 6 },
  { name: "Shane Lowry", score: 8 },
  { name: "Max Homa", score: 9 },
];


async function fetchMockGolfScores() {
  console.log('fetchMockGolfScores function started.');
  
  try {
    // Process each user's golf picks with the mock scores
    await processGolfPicks(mockGolfScores);
    
    console.log('Golf scores processed successfully.');
  } catch (error) {
    console.error('Error in fetchMockGolfScores:', error);
  }
}


// Process golf picks with mock scores
async function processGolfPicks(golfScores) {
  console.log('Processing golf picks with mock scores...');
  
  try {
    const database = await connectToDatabase();
    const userGolfPicksCollection = database.collection('userGolfPicks');
    const golfResultsCollection = database.collection('golfBetResults');
    const poolsCollection = database.collection('pools');
    
    // Get all golf pools that are in playTime phase
    const golfPools = await poolsCollection.find({
      mode: 'golf',
      playTime: true
    }).toArray();
    
    console.log(`Found ${golfPools.length} golf pools in play phase`);
    
    // Process each pool
    for (const pool of golfPools) {
      console.log(`Processing pool: ${pool.name}`);
      
      // Get all user picks for this pool
      const allUserPicks = await userGolfPicksCollection.find({
        poolName: pool.name
      }).toArray();
      
      console.log(`Found ${allUserPicks.length} users with picks in pool ${pool.name}`);
      
      // Process each user's picks
      for (const userPick of allUserPicks) {
        const username = userPick.username;
        const golfers = userPick.golfers || [];
        
        console.log(`Processing ${golfers.length} golfers for user ${username}`);
        
        // Skip if no golfers selected
        if (golfers.length === 0) continue;
        
        // Calculate scores for each golfer
        let totalScore = 0;
        const golferResults: any = [];
        
        for (const golfer of golfers) {
          const golferName = golfer.golferName;
          
          // Find this golfer in the mock scores
          const mockScoreEntry = golfScores.find(entry => 
            entry.name.toLowerCase() === golferName.toLowerCase()
          );
          
          if (mockScoreEntry) {
            // Ensure we have a numeric score (even if API returned "E")
            const score = mockScoreEntry.score;
            const scoreDisplay = score === 0 ? "E" : (score > 0 ? `+${score}` : `${score}`);
            
            // Add to results array
            golferResults.push({
              golferName,
              score,
              scoreDisplay,
              position: mockScoreEntry.position || "",
              round: golfer.round
            });
            
            // Store the score directly in the user's pick
            await userGolfPicksCollection.updateOne(
              { 
                username: username.toLowerCase(),
                poolName: pool.name,
                "golfers.golferName": golferName
              },
              {
                $set: {
                  "golfers.$.score": score,
                  "golfers.$.scoreDisplay": scoreDisplay,
                  "golfers.$.position": mockScoreEntry.position || ""
                }
              }
            );
            
            // Add to total score - include both positive and negative scores
            totalScore += score;
          }
        }
        
        // Calculate average score
        const averageScore = golfers.length > 0 ? totalScore / golfers.length : 0;
        
        // Create score display format for total
        const totalScoreDisplay = totalScore === 0 ? "E" : 
                                (totalScore > 0 ? `+${totalScore}` : 
                                `${totalScore}`);
        
        // Save results to golfBetResults collection
        await golfResultsCollection.updateOne(
          { 
            username: username.toLowerCase(), 
            poolName: pool.name 
          },
          {
            $set: {
              username: username.toLowerCase(),
              poolName: pool.name,
              totalScore,
              totalScoreDisplay,
              averageScore,
              golferResults,
              timestamp: new Date()
            }
          },
          { upsert: true }
        );
        
        // Update pool member's total score
        await poolsCollection.updateOne(
          {
            name: pool.name,
            'members.username': username.toLowerCase()
          },
          {
            $set: {
              'members.$.golfScore': totalScore,
              'members.$.golfScoreDisplay': totalScoreDisplay,
              'members.$.golfSelections': golferResults
            }
          }
        );
        
        console.log(`Updated scores for ${username} in pool ${pool.name}. Total: ${totalScoreDisplay}`);
      }
    }
    
    console.log('Golf scores processed successfully.');
  } catch (error) {
    console.error('Error processing golf picks:', error);
  }
}
 
//fetchMockGolfScores()