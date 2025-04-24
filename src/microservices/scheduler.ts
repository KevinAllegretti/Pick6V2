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
/*
async function fetchAndSaveMastersData() {
  console.log('Fetching Masters Tournament data and saving to database...');
  
  // API key from your previous example
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const tournId = '475'; // Using this as our default Masters tournament ID
  const year = '2025';
  
  try {
    // Connect to the database
    const database = await connectToDatabase();
    const mastersCollection = database.collection('mastersLeaderboard');
    
    console.log('Connected to database, fetching tournament data...');
    
    // No need to get the schedule if we're getting errors
    // We'll just use the known tournament ID directly
    console.log(`Using tournament ID: ${tournId} for Masters Tournament`);
    
    // Fetch the leaderboard with the tournament ID
    const leaderboardResponse = await fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournId}&year=${year}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    if (!leaderboardResponse.ok) {
      throw new Error(`HTTP error fetching leaderboard! Status: ${leaderboardResponse.status}`);
    }
    
    const leaderboardData = await leaderboardResponse.json();
    
    // Log the raw data structure to help debug
    console.log('Leaderboard data structure:', 
      Object.keys(leaderboardData).length > 0 
        ? Object.keys(leaderboardData)
        : 'Empty response'
    );
    
    // Create a document to save
    const masterDocument = {
      tournamentName: 'Masters Tournament',
      tournamentId: tournId,
      year,
      fetchedAt: new Date(),
      data: leaderboardData
    };
    
    // Save to the database
    const result = await mastersCollection.insertOne(masterDocument);
    
    console.log(`\n==========================================`);
    console.log(`MASTERS TOURNAMENT DATA SAVED`);
    console.log(`==========================================`);
    console.log(`Tournament: Masters Tournament`);
    console.log(`Year: ${year}`);
    console.log(`Saved with ID: ${result.insertedId}`);
    
    // Display some key stats if available
    if (leaderboardData.leaderboard && Array.isArray(leaderboardData.leaderboard) && leaderboardData.leaderboard.length > 0) {
      console.log(`\nTop 5 Players:`);
      leaderboardData.leaderboard.slice(0, 5).forEach((player: any, idx: number) => {
        const name = `${player.firstName || ''} ${player.lastName || ''}`.trim();
        const score = player.score || 'E';
        console.log(`${idx+1}. ${name.padEnd(24)} ${score}`);
      });
    } else {
      console.log('\nNo leaderboard data available yet.');
    }
    
    return { success: true, id: result.insertedId };
    
  } catch (error) {
    console.error('Error fetching and saving Masters Tournament data:', error);
    return { success: false, error };
  }
}





// Call once immediately
fetchAndSaveMastersData();*/


async function fetchTournamentsList() {
  console.log('Fetching available golf tournaments...');
  
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const year = '2025';
  
  try {
    // Try the schedule endpoint which should list all tournaments for the year
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
    
    // Log the raw structure to help debug
    console.log('Schedule data structure:', typeof scheduleData);
    console.log('Keys if object:', typeof scheduleData === 'object' ? Object.keys(scheduleData) : 'Not an object');
    
    // Handle different response formats
    let tournaments:any = [];
    
    if (Array.isArray(scheduleData)) {
      tournaments = scheduleData;
      console.log(`Found ${tournaments.length} tournaments in array format`);
    } else if (typeof scheduleData === 'object' && scheduleData !== null) {
      // Check if there's a tournaments/events array in the object
      if (Array.isArray(scheduleData.tournaments)) {
        tournaments = scheduleData.tournaments;
      } else if (Array.isArray(scheduleData.events)) {
        tournaments = scheduleData.events;
      } else if (Array.isArray(scheduleData.schedule)) {
        tournaments = scheduleData.schedule;
      } else {
        // If we can't find an array, use the object keys as possible tournament IDs
        console.log('No tournament array found, attempting to use object keys');
        tournaments = Object.keys(scheduleData).map(key => ({
          tournId: key,
          name: `Tournament ${key}`,
          id: key
        }));
      }
      console.log(`Found ${tournaments.length} tournaments via object extraction`);
    } else {
      console.log('Unexpected schedule data format. Raw data:', scheduleData);
      return { found: false, error: 'Unexpected data format' };
    }
    
    // Now try to use a direct approach to get the Masters Tournament
    console.log('Attempting direct approach with known tournament IDs...');
    
    // List of potential tournament IDs to try for the Masters
    const potentialIds = ['014', '475', '018', '026', '001', '002', '003', '007'];
    
    for (const id of potentialIds) {
      console.log(`Trying tournament ID: ${id}`);
      
      try {
        const tournamentResponse = await fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${id}&year=${year}`, {
          method: 'GET',
          headers: {
            'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
            'x-rapidapi-key': apiKey
          }
        });
        
        if (!tournamentResponse.ok) {
          console.log(`Tournament ID ${id} returned status ${tournamentResponse.status}`);
          continue;
        }
        
        const tournamentData = await tournamentResponse.json();
        
        // Check if this looks like a tournament
        const hasLeaderboard = 
          Array.isArray(tournamentData.leaderboardRows) || 
          Array.isArray(tournamentData.leaderboard);
          
        if (!hasLeaderboard) {
          console.log(`Tournament ID ${id} does not have leaderboard data`);
          continue;
        }
        
        // Try to get tournament name
        const name = tournamentData.tournamentName || tournamentData.name || `Tournament ${id}`;
        
        console.log(`Found tournament with ID ${id}: ${name}`);
        
        // Check if it might be the Masters
        const isMasters = name.toLowerCase().includes('masters');
        const courseName = tournamentData.courseName || '';
        const isAugusta = courseName.toLowerCase().includes('augusta');
        
        if (isMasters || isAugusta) {
          console.log(`This appears to be the Masters Tournament! ID: ${id}, Name: ${name}, Course: ${courseName}`);
          
          return {
            found: true,
            tournament: {
              tournId: id,
              name: name,
              courseName: courseName
            }
          };
        } else {
          console.log(`Tournament ID ${id} is not the Masters: ${name}, ${courseName}`);
        }
      } catch (error:any) {
        console.log(`Error checking tournament ID ${id}:`, error.message);
      }
    }
    
    return { found: false, message: 'Could not find Masters Tournament' };
  } catch (error:any) {
    console.error('Error fetching tournaments list:', error);
    return { found: false, error: error.message };
  }
}

async function fetchAndSaveTournamentData(tournamentId: string, tournamentName: string) {
  console.log(`Fetching data for ${tournamentName} (ID: ${tournamentId})...`);
  
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const year = '2025';
  
  try {
    // Connect to the database
    const database = await connectToDatabase();
    const tournamentsCollection = database.collection('golfTournaments');
    
    const leaderboardResponse = await fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${tournamentId}&year=${year}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
        'x-rapidapi-key': apiKey
      }
    });
    
    if (!leaderboardResponse.ok) {
      throw new Error(`HTTP error fetching leaderboard! Status: ${leaderboardResponse.status}`);
    }
    
    const leaderboardData = await leaderboardResponse.json();
    
    // Create a document to save
    const tournamentDocument = {
      tournamentName,
      tournamentId,
      year,
      fetchedAt: new Date(),
      data: leaderboardData
    };
    
    // Save to the database
    const result = await tournamentsCollection.insertOne(tournamentDocument);
    
    console.log(`\n==========================================`);
    console.log(`TOURNAMENT DATA SAVED: ${tournamentName}`);
    console.log(`==========================================`);
    console.log(`Year: ${year}`);
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Saved with DB ID: ${result.insertedId}`);
    
    // Display some key stats if available
    let players = [];
    if (Array.isArray(leaderboardData.leaderboardRows)) {
      players = leaderboardData.leaderboardRows;
    } else if (Array.isArray(leaderboardData.leaderboard)) {
      players = leaderboardData.leaderboard;
    }
    
    if (players.length > 0) {
      console.log(`\nTop 5 Players:`);
      players.slice(0, 5).forEach((player: any, idx: number) => {
        const name = `${player.firstName || ''} ${player.lastName || ''}`.trim();
        const score = player.total || player.score || 'E';
        console.log(`${idx+1}. ${name.padEnd(24)} ${score}`);
      });
    } else {
      console.log('No leaderboard data available.');
      console.log('Available keys in response:', Object.keys(leaderboardData));
    }
    
    return { success: true, id: result.insertedId };
    
  } catch (error: any) {
    console.error(`Error fetching and saving tournament data:`, error);
    return { success: false, error: error.message };
  }
}

// Main function to orchestrate the process
async function getMastersData() {
  try {
    // First try to find the Masters Tournament ID
    console.log('Step 1: Finding Masters Tournament...');
    const tournamentsResult:any = await fetchTournamentsList();
    
    if (tournamentsResult.found) {
      // Masters found, fetch and save its data
      const mastersId = tournamentsResult.tournament.tournId;
      const mastersName = tournamentsResult.tournament.name;
      
      console.log('Step 2: Fetching Masters Tournament data...');
      await fetchAndSaveTournamentData(mastersId, mastersName);
    } else {
      // If we can't find the Masters, try tournament ID 014 (common Masters ID)
      console.log('Could not definitively identify the Masters. Trying ID 014...');
      await fetchAndSaveTournamentData('014', 'Masters Tournament');
    }
  } catch (error) {
    console.error('Error in Masters data processing:', error);
  }
}

async function findPGAChampionship() {
  console.log('Searching for PGA Championship Tournament...');
  
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const year = '2025';
  
  // List of potential tournament IDs to try for the PGA Championship
  // The PGA Championship is often ID '018' in many golf APIs
  const potentialIds = ['015', '033', '034', '019', '020', '028'];
  
  for (const id of potentialIds) {
    console.log(`Trying tournament ID: ${id}`);
    
    try {
      const tournamentResponse = await fetch(`https://live-golf-data.p.rapidapi.com/leaderboard?orgId=1&tournId=${id}&year=${year}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-host': 'live-golf-data.p.rapidapi.com',
          'x-rapidapi-key': apiKey
        }
      });
      
      if (!tournamentResponse.ok) {
        console.log(`Tournament ID ${id} returned status ${tournamentResponse.status}`);
        continue;
      }
      
      const tournamentData = await tournamentResponse.json();
      
      // Check if this looks like a tournament
      const hasLeaderboard = 
        Array.isArray(tournamentData.leaderboardRows) || 
        Array.isArray(tournamentData.leaderboard);
        
      if (!hasLeaderboard) {
        console.log(`Tournament ID ${id} does not have leaderboard data`);
        continue;
      }
      
      // Try to get tournament name
      const name = tournamentData.tournamentName || tournamentData.name || `Tournament ${id}`;
      
      console.log(`Found tournament with ID ${id}: ${name}`);
      
      // Check if it might be the PGA Championship
      const isPGAChampionship = 
        name.toLowerCase().includes('pga championship') || 
        name.toLowerCase().includes('pga champ');
        
      const courseName = tournamentData.courseName || '';
      
      if (isPGAChampionship) {
        console.log(`This appears to be the PGA Championship! ID: ${id}, Name: ${name}, Course: ${courseName}`);
        
        // Get sample player data to verify
        let players = [];
        if (Array.isArray(tournamentData.leaderboardRows)) {
          players = tournamentData.leaderboardRows;
        } else if (Array.isArray(tournamentData.leaderboard)) {
          players = tournamentData.leaderboard;
        }
        
        if (players.length > 0) {
          console.log(`\nTop 5 Players in PGA Championship:`);
          players.slice(0, 5).forEach((player: any, idx: number) => {
            const name = `${player.firstName || ''} ${player.lastName || ''}`.trim();
            const score = player.total || player.score || 'E';
            console.log(`${idx+1}. ${name.padEnd(24)} ${score}`);
          });
        }
        
        return {
          found: true,
          tournament: {
            tournId: id,
            name: name,
            courseName: courseName
          }
        };
      } else {
        console.log(`Tournament ID ${id} is not the PGA Championship: ${name}, ${courseName}`);
      }
    } catch (error:any) {
      console.log(`Error checking tournament ID ${id}:`, error.message);
    }
  }
  
  console.log('Could not find PGA Championship Tournament among tested IDs');
  return { found: false, message: 'Could not find PGA Championship Tournament' };
}

//findPGAChampionship()
