import fetch from 'node-fetch';
import { connectToDatabase } from './connectDB';
import { updateUserPoints, updateUserStats, saveResultsToServer, 
    deleteResultsFromServer, getAllPicks, getBetResult, calculatePointsForResult, 
    savePicksToLastWeek,   updateThursdayDeadline,
    updateTuesdayStartTime, deletePicksFromServer, saveSurvivorPicks} from './serverUtils';
    import { fetchAndSaveInjuries } from './InjuryServices';
    import { deleteInjuriesFromServer } from '../routes/InjuryRoutes';
    import { incrementWeek } from './serverUtils';
    import { getCurrentWeek } from './serverUtils';
import { eliminateUsersWithoutPicks } from './serverUtils';
let gameScores: any[] = [];

export   async function fetchNFLScores() {
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
    
/*
    export   async function updateScores(gameScores) {
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
    }*/

export async function updateScores(gameScores: any) {
  console.log('gameScores at update:', gameScores);
  let allResults: any[] = []; // Store all results for the current session

  // Get all picks, including playoff picks
  const allPicks = await getAllPicks();
  
  console.log('All picks retrieved, including playoff picks:', allPicks.length);
  
  // Log how many playoff picks we found
  const playoffPicks = allPicks.filter((pick: any) => pick.poolName.startsWith('playoff_'));
  console.log('Playoff picks found:', playoffPicks.length);

  const database = await connectToDatabase();
  const resultsCollection = database.collection('betResultsGlobal');
  const poolsCollection = database.collection('pools'); // ADD THIS LINE

  // Add timestamp for when scores are updated
  const updateTimestamp = new Date(); // ADD THIS LINE

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
  
  // NEW: Update lastScoresUpdate timestamp for all classic pools that had results
  const classicPoolsWithResults = new Set<string>();
  allResults.forEach((result: any) => {
    // Only add classic pools (not playoff, survivor, or golf)
    if (!result.poolName.startsWith('playoff_') && 
        result.poolName !== 'survivor' && 
        !result.poolName.endsWith('_golf')) {
      classicPoolsWithResults.add(result.poolName);
    }
  });
  
  // Update timestamp for each classic pool that had score updates
  for (const poolName of classicPoolsWithResults) {
    try {
      await poolsCollection.updateOne(
        { 
          name: poolName, 
          mode: 'classic' // Only update classic mode pools
        },
        { $set: { lastScoresUpdate: updateTimestamp } }
      );
      console.log(`Updated lastScoresUpdate for classic pool: ${poolName}`);
    } catch (error) {
      console.error(`Error updating timestamp for pool ${poolName}:`, error);
    }
  }
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

export async function processPick(username, poolName, pickEntry, gameScores, allResults, resultsCollection, isImmortalLock = false, isPlayoffPick = false) {
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
export const url1 = 'http://localhost:3000/api/saveWeeklyPicks';
export const url2 = 'http://localhost:3000/api/fetchMLBData';
export const url3 = 'http://localhost:3000/api/fetchNFLDataOneWeekOut';
 // || ;

 export const fetchMLBData = async () => {
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
  
  export const fetchNFLDataOneWeekOut = async () => {
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
  
  export  const saveWeeklyPicks = async (betOptions: any) => {
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





  export const url5 = 'http://localhost:3000/api/saveNFLSchedule'
export const saveNFLSchedule = async (betOptions: any) => {
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


// Mock NFL game data
export const mockNFLGames = [
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
export async function mockFetchNFLScores() {
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
