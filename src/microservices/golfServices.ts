import fetch from 'node-fetch';
import { connectToDatabase } from './connectDB';

export async function fetchAndSaveMastersData(): Promise<{ success: boolean, id?: string, status?: string, error?: any }> {
  console.log('Fetching Masters Tournament information and saving to database...');
  
  const tournamentId = '014'; // Masters tournament ID
  const tournamentName = 'Masters Tournament';
  const apiKey = 'e5859daf3amsha3927ab000fb4a3p1b5686jsndea26f3d7448';
  const year = '2025';
  
  try {
    const database = await connectToDatabase();
    const mastersCollection = database.collection('golfTournaments');
    
    console.log(`Fetching Masters data with ID: ${tournamentId}...`);
    
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
        const formattedLeaderboard = leaderboard.map(player => {
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
              
              // Generate display format - always use "E" for score of 0
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
          
          // Log each player's score for debugging
          console.log(`${player?.firstName || ""} ${player?.lastName || ""}: Raw=${player?.total || player?.score}, Parsed=${score}, Display=${scoreDisplay}`);
          
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
        const mastersDocument: TournamentDocument = {
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
        const result = await mastersCollection.insertOne(mastersDocument);
        
        console.log(`\n==========================================`);
        console.log(`MASTERS TOURNAMENT LEADERBOARD SAVED`);
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
    
    // If no leaderboard is available, let's create a mock leaderboard for testing
    console.log('No leaderboard data available. Creating mock Masters leaderboard for testing.');
    
    // Mock leaderboard with a mix of scores (under par, over par, and even)
    const mockLeaderboard: FormattedGolfer[] = [
      {
        firstName: "Scottie",
        lastName: "Scheffler",
        name: "Scottie Scheffler",
        score: -12,
        scoreDisplay: "-12",
        position: "1",
        status: "active"
      },
      {
        firstName: "Rory",
        lastName: "McIlroy",
        name: "Rory McIlroy",
        score: -7,
        scoreDisplay: "-7",
        position: "2",
        status: "active"
      },
      {
        firstName: "Xander",
        lastName: "Schauffele",
        name: "Xander Schauffele",
        score: -10,
        scoreDisplay: "-10",
        position: "3",
        status: "active"
      },
      {
        firstName: "Bryson",
        lastName: "DeChambeau",
        name: "Bryson DeChambeau",
        score: 4, // Over par (positive)
        scoreDisplay: "+4",
        position: "4",
        status: "active"
      },
      {
        firstName: "Ludwig",
        lastName: "Åberg",
        name: "Ludwig Åberg",
        score: 0, // Even par
        scoreDisplay: "E",
        position: "5",
        status: "active"
      },
      {
        firstName: "Justin",
        lastName: "Thomas",
        name: "Justin Thomas",
        score: -3,
        scoreDisplay: "-3",
        position: "6",
        status: "active"
      },
      {
        firstName: "Collin",
        lastName: "Morikawa",
        name: "Collin Morikawa",
        score: -5,
        scoreDisplay: "-5",
        position: "7",
        status: "active"
      },
      {
        firstName: "Jon",
        lastName: "Rahm",
        name: "Jon Rahm",
        score: 2, // Over par (positive)
        scoreDisplay: "+2",
        position: "8",
        status: "active"
      }
    ];
    
    // Save the mock tournament data
    const mockMastersDocument: TournamentDocument = {
      tournamentName,
      tournamentId,
      year,
      fetchedAt: new Date(),
      status: 'in-progress', // Set as in-progress for testing
      data: {
        leaderboard: mockLeaderboard
      }
    };
    
    // Save to database
    const result = await mastersCollection.insertOne(mockMastersDocument);
    
    console.log(`\n==========================================`);
    console.log(`MOCK MASTERS LEADERBOARD SAVED`);
    console.log(`==========================================`);
    console.log(`Tournament: ${tournamentName}`);
    console.log(`Status: in-progress (mock)`);
    console.log(`Players: ${mockLeaderboard.length}`);
    
    // Log the mock leaderboard
    console.log(`\nMock Leaderboard:`);
    mockLeaderboard.forEach((player, idx) => {
      console.log(`${idx+1}. ${player.name.padEnd(25)} ${player.scoreDisplay}`);
    });
    
    // Process golf picks with the mock leaderboard data
    console.log('\nProcessing golf picks with mock leaderboard...');
    await processGolfPicks(mockLeaderboard);
    
    // Log a verification calculation
    console.log('\nVerification of score calculation:');
    console.log('Example for a user with all 6 golfers:');
    console.log('- Scottie Scheffler: -12');
    console.log('- Rory McIlroy: -7');
    console.log('- Xander Schauffele: -10');
    console.log('- Bryson DeChambeau: +4');
    console.log('- Ludwig Åberg: E (0)');
    console.log('- Justin Thomas: -3');
    console.log('Expected total: -12 + (-7) + (-10) + 4 + 0 + (-3) = -28');
    
    return { success: true, id: result.insertedId.toString(), status: 'in-progress' };
    
  } catch (error) {
    console.error('Error fetching and saving Masters data:', error);
    return { success: false, error };
  }
}


//GOLFFFF
// Define interfaces for API responses and processing
export interface GolferData {
    firstName?: string;
    lastName?: string;
    total?: number | string;
    score?: number | string;
    position?: string;
    status?: string;
  }
  
  export interface FormattedGolfer {
    firstName: string;
    lastName: string;
    name: string;
    score: number;
    scoreDisplay: string;
    position: string;
    status: string;
  }
  
  export interface TournamentInfo {
    tournId: string;
    name: string;
    status: string;
    dates: {
      start: string;
      end: string;
    };
  }
  
  export interface TournamentDocument {
    tournamentName: string;
    tournamentId: string;
    year: string;
    fetchedAt: Date;
    status: string;
    tournamentInfo?: TournamentInfo;
    data: any;
  }
  
  export async function fetchAndSavePGAChampionshipData(): Promise<{ success: boolean, id?: string, status?: string, error?: any }> {
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
  // Process golf picks with real leaderboard data
  export async function processGolfPicks(golfScores: FormattedGolfer[]): Promise<void> {
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
          const golferResults: any = [];
          
          for (const golfer of golfers) {
            const golferName = golfer.golferName;
            
            // Find this golfer in the leaderboard data with improved name matching
            const golferData = golfScores.find(entry => {
              // Normalize both names for comparison to handle special characters
              const entryNameNormalized = entry.name.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              const golferNameNormalized = golferName.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
              
              // Log comparison (debug only)
              console.log(`Comparing: "${entryNameNormalized}" with "${golferNameNormalized}"`);
              
              // Check for exact match or partial inclusion
              return entryNameNormalized === golferNameNormalized || 
                     entryNameNormalized.includes(golferNameNormalized) || 
                     golferNameNormalized.includes(entryNameNormalized);
            });
            
            if (golferData) {
              // Log successful match
              console.log(`Found match for ${golferName}: ${golferData.name} with score ${golferData.score} (${golferData.scoreDisplay})`);
              
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
              console.log(`Added ${golferData.score} to total. Running total: ${totalScore}`);
            } else {
              console.log(`⚠️ NO MATCH FOUND for ${golferName}! This golfer will be skipped in scoring.`);
              
              // Add to results with undefined score
              golferResults.push({
                golferName,
                score: 0,
                scoreDisplay: "E",
                position: "",
                round: golfer.round
              });
            }
          }
          
          // List all golfers and their scores before saving
          console.log(`Golfer breakdown for ${username}:`);
          golferResults.forEach((g: any) => {
            console.log(`- ${g.golferName}: ${g.score !== null ? g.score : 'not found'} (${g.scoreDisplay})`);
          });
          console.log(`Final total before saving: ${totalScore}`);
          
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
  
  

// Mock leaderboard data - just basic scores for popular golfers
export const mockGolfScores = [
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
  
  /*
  // Function to fetch and save PGA Championship odds from FanDuel only
export async function fetchAndSavePGAChampionshipOdds() {
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
}*/

// Simple fix using 'any' type to avoid TypeScript errors
export async function fetchAndSavePGAChampionshipOdds() {
  console.log('Fetching PGA Championship odds from FanDuel...');
  
  const apiKey = 'e22c201b39907f6f0b2cb61e9edb6e64';
  
  try {
    // Step 1: Get available sports
    const sportsResponse = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`);
    
    if (!sportsResponse.ok) {
      throw new Error(`HTTP error! Status: ${sportsResponse.status}`);
    }
    
    const sportsData: any[] = await sportsResponse.json();
    
    // Find PGA Championship
    const pgaChampionship = sportsData.find((sport) => 
      sport.key.includes('pga_championship') || 
      (sport.title && sport.title.includes('PGA Championship'))
    );
    
    if (!pgaChampionship) {
      console.log('PGA Championship not found in available tournaments.');
      return null;
    }
    
    console.log(`Found PGA Championship: ${pgaChampionship.title}, key: ${pgaChampionship.key}`);
    
    // Fetch odds
    const market = 'outrights';
    console.log(`Fetching ${pgaChampionship.title} odds with market: ${market}`);
    
    const oddsResponse = await fetch(`https://api.the-odds-api.com/v4/sports/${pgaChampionship.key}/odds/?apiKey=${apiKey}&regions=us&markets=${market}&oddsFormat=american`);
    
    if (!oddsResponse.ok) {
      throw new Error(`HTTP error fetching odds! Status: ${oddsResponse.status}`);
    }
    
    const oddsData: any[] = await oddsResponse.json();
    
    if (oddsData.length === 0) {
      console.log(`No odds data available for market '${market}'.`);
      return null;
    }
    
    console.log(`==========================================`);
    console.log(`ODDS FOR: ${pgaChampionship.title.toUpperCase()}`);
    console.log(`==========================================`);
    console.log(`Retrieved data for ${oddsData.length} events`);
    
    // Process the odds data - check ALL bookmakers
    const allBookmakers = new Set<string>();
    let selectedBookmaker: any = null;
    let selectedBookmakerName = '';
    
    // Process each event
    oddsData.forEach((event: any) => {
      console.log(`\nEvent: ${event.sport_key}`);
      if (event.commence_time) {
        console.log(`Start time: ${new Date(event.commence_time).toLocaleString()}`);
      }
      if (event.home_team) console.log(`Home team: ${event.home_team}`);
      if (event.away_team) console.log(`Away team: ${event.away_team || 'N/A'}`);
      
      // List ALL available bookmakers
      console.log(`\nAll available bookmakers (${event.bookmakers.length}):`);
      event.bookmakers.forEach((bm: any) => {
        allBookmakers.add(bm.title);
        console.log(`- ${bm.title} (key: ${bm.key})`);
      });
      
      // Look for FanDuel specifically
      const fanduel = event.bookmakers.find((bm: any) => 
        bm.key === 'fanduel' || 
        bm.title.toLowerCase().includes('fanduel')
      );
      
      if (fanduel) {
        console.log('\nFOUND FANDUEL ODDS!');
        selectedBookmaker = fanduel;
        selectedBookmakerName = 'FanDuel';
      } else {
        // If no FanDuel, try other major bookmakers
        const preferredBookmakers = [
          { name: 'DraftKings', keys: ['draftkings'] },
          { name: 'BetMGM', keys: ['betmgm'] },
          { name: 'Caesars', keys: ['caesars'] },
          { name: 'PointsBet', keys: ['pointsbet'] }
        ];
        
        for (const preferred of preferredBookmakers) {
          const bookmaker = event.bookmakers.find((bm: any) => 
            preferred.keys.includes(bm.key.toLowerCase()) || 
            preferred.keys.some((key: string) => bm.title.toLowerCase().includes(key))
          );
          
          if (bookmaker) {
            console.log(`\nUsing ${preferred.name} odds instead of FanDuel.`);
            selectedBookmaker = bookmaker;
            selectedBookmakerName = preferred.name;
            break;
          }
        }
        
        // If still no bookmaker found, use the first one available
        if (!selectedBookmaker && event.bookmakers.length > 0) {
          selectedBookmaker = event.bookmakers[0];
          selectedBookmakerName = selectedBookmaker.title;
          console.log(`\nUsing ${selectedBookmakerName} odds as fallback.`);
        }
      }
    });
    
    if (!selectedBookmaker) {
      console.log('No bookmaker data found for this event.');
      return null;
    }
    
    console.log(`\nSelected Bookmaker: ${selectedBookmakerName}`);
    if (selectedBookmaker.last_update) {
      console.log(`Last update: ${new Date(selectedBookmaker.last_update).toLocaleString()}`);
    }
    
    // Process markets from the selected bookmaker
    console.log(`\nAvailable markets (${selectedBookmaker.markets.length}):`);
    selectedBookmaker.markets.forEach((market: any) => {
      console.log(`- ${market.key} (outcomes: ${market.outcomes.length})`);
    });
    
    // Select the appropriate market
    const targetMarket = selectedBookmaker.markets.find((m: any) => 
      m.key === 'outrights' || m.key === 'h2h' || m.key.includes('winner')
    ) || selectedBookmaker.markets[0];
    
    if (!targetMarket) {
      console.log('No suitable market found.');
      return null;
    }
    
    console.log(`\nSelected Market: ${targetMarket.key}`);
    
    // Sort outcomes by odds
    const sortedOutcomes = [...targetMarket.outcomes].sort((a: any, b: any) => {
      const aOdds = parseInt(a.price);
      const bOdds = parseInt(b.price);
      
      if (aOdds > 0 && bOdds > 0) {
        return aOdds - bOdds;
      } else if (aOdds < 0 && bOdds < 0) {
        return bOdds - aOdds;
      } else {
        return aOdds < 0 ? -1 : 1;
      }
    });
    
    // Populate golfer odds array
    const golferOdds = sortedOutcomes.map((outcome: any, idx: number) => {
      const oddsValue = `${outcome.price > 0 ? '+' : ''}${outcome.price}`;
      console.log(`${idx+1}. ${outcome.name.padEnd(30)}: ${oddsValue}`);
      
      return {
        rank: idx + 1,
        name: outcome.name,
        odds: outcome.price,
        oddsDisplay: oddsValue,
        bookmaker: selectedBookmakerName
      };
    });
    
    if (golferOdds.length === 0) {
      console.log('No golfer odds available.');
      return null;
    }
    
    // Save to database
    const database = await connectToDatabase();
    const pgaOddsCollection = database.collection('pgaChampionshipOdds');
    
    // Create document
    const oddsDocument = {
      tournament: pgaChampionship.title,
      tournamentKey: pgaChampionship.key,
      bookmaker: selectedBookmakerName,
      marketKey: targetMarket.key,
      startTime: oddsData[0].commence_time ? new Date(oddsData[0].commence_time) : new Date(),
      fetchedAt: new Date(),
      golferOdds: golferOdds,
      availableBookmakers: Array.from(allBookmakers)
    };
    
    // Save to database
    const result = await pgaOddsCollection.insertOne(oddsDocument);
    
    console.log(`\nSaved ${selectedBookmakerName} odds for ${pgaChampionship.title} to database with ID: ${result.insertedId}`);
    
    return {
      success: true,
      id: result.insertedId.toString(),
      bookmaker: selectedBookmakerName,
      tournament: pgaChampionship.title,
      oddsCount: golferOdds.length
    };
    
  } catch (error: any) {
    console.error('Error fetching PGA Championship odds:', error);
    return {
      success: false,
      error: error.message
    };
  }
}