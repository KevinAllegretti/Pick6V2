// src/routes/playoffRoutes.ts
import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import { getCurrentWeek } from '../microservices/serverUtils';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Initialize playoffs for all pools that have hasPlayoffs=true
router.post('/api/playoffs/initialize', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
    // Only proceed if we're at week 14
    if (currentWeek !== 14) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot initialize playoffs - current week is ${currentWeek}, playoffs start in week 14` 
      });
    }
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    
    // Get all classic pools with hasPlayoffs=true
    const pools = await poolsCollection.find({ 
      mode: 'classic', 
      hasPlayoffs: true,
      playoffCurrentWeek: { $exists: false } // Only initialize pools that haven't been initialized yet
    }).toArray();
    
    interface PoolResult {
        poolName: string;
        success: boolean;
        message?: string;      // Used in the first result object
        memberCount?: number;  // Used in the second result object
        // Include any other properties used elsewhere
        advancedToWeek?: number;
        processedMembers?: number;
      }
      const results: PoolResult[] = [];
    
    for (const pool of pools) {
      // Sort members by points to determine seeding
      const topMembers = [...pool.members]
        .sort((a, b) => {
          if (a.points !== b.points) return b.points - a.points;
          if (a.win !== b.win) return b.win - a.win;
          if (a.loss !== b.loss) return a.loss - b.loss;
          return b.push - a.push;
        })
        .slice(0, 10);
        
      // Check if we have minimum 6 members
      if (topMembers.length < 6) {
        // Not enough members for playoffs
        await poolsCollection.updateOne(
          { _id: pool._id },
          { $set: { hasPlayoffs: false } }
        );
        
        results.push({ 
          poolName: pool.name, 
          success: false, 
          message: 'Not enough members (minimum 6 required)' 
        });
        continue;
      }
      
      // Create the playoff members array with reset points
      const playoffMembers = topMembers.map((member, index) => {
        const seed = index + 1;
        const hasBye = hasByeForSeed(seed, topMembers.length);
        const position = getInitialPosition(seed, topMembers.length);
        
        return {
          user: member.user,
          username: member.username,
          seed,
          position,
          weeklyPoints: 0,
          hasBye,
          isAdvancing: hasBye, // Players with byes automatically advance
          picks: [],
          win: member.win,
          loss: member.loss,
          push: member.push
        };
      });
      
      // Create the playoff bracket structure
      const playoffBracket = createBracketForPlayerCount(topMembers.length);
      
      // Update pool with playoff information
      await poolsCollection.updateOne(
        { _id: pool._id },
        { 
          $set: { 
            playoffMembers,
            playoffBracket,
            playoffCurrentWeek: currentWeek
          }
        }
      );
      
      results.push({ 
        poolName: pool.name, 
        success: true, 
        memberCount: playoffMembers.length 
      });
    }
    
    res.json({ 
      success: true, 
      message: `Processed ${pools.length} pools for playoffs`, 
      results 
    });
  } catch (error) {
    console.error('Error initializing playoffs:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get playoff bracket for a specific pool
router.get('/api/playoffs/:poolName/bracket', async (req, res) => {
  try {
    const { poolName } = req.params;
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    
    const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
    
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Playoff pool not found' });
    }
    
    // Get the current playoff week
    const currentWeek = pool.playoffCurrentWeek || 14;
    
    // Format the bracket data for the frontend
    const bracketData = {
      currentWeek,
      rounds: [
        { round: 1, week: 14, name: 'First Round' },
        { round: 2, week: 15, name: 'Quarterfinals' },
        { round: 3, week: 16, name: 'Semifinals' },
        { round: 4, week: 17, name: 'Finals' }
      ],
      matches: pool.playoffBracket.map(match => {
        const player1 = pool.playoffMembers.find(m => m.position === match.player1Position);
        const player2 = pool.playoffMembers.find(m => m.position === match.player2Position);
        
        return {
          id: match.matchId,
          round: match.round,
          week: match.week,
          player1: player1 ? {
            id: player1.user,
            username: player1.username,
            seed: player1.seed,
            points: player1.weeklyPoints,
            isAdvancing: player1.isAdvancing,
            hasBye: player1.hasBye,
            eliminated: !!player1.eliminatedInWeek
          } : null,
          player2: player2 ? {
            id: player2.user,
            username: player2.username,
            seed: player2.seed,
            points: player2.weeklyPoints,
            isAdvancing: player2.isAdvancing,
            hasBye: player2.hasBye,
            eliminated: !!player2.eliminatedInWeek
          } : null,
          winner: match.winner,
          nextMatch: match.nextMatchPosition
        };
      }),
      members: pool.playoffMembers.map(member => ({
        id: member.user,
        username: member.username,
        seed: member.seed,
        position: member.position,
        weeklyPoints: member.weeklyPoints,
        isAdvancing: member.isAdvancing,
        hasBye: member.hasBye,
        eliminated: !!member.eliminatedInWeek,
        eliminatedInWeek: member.eliminatedInWeek,
        stats: {
          win: member.win,
          loss: member.loss,
          push: member.push
        }
      }))
    };
    
    res.json({ success: true, bracket: bracketData });
  } catch (error) {
    console.error('Error fetching playoff bracket:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



// Save playoff picks for a user
router.post('/api/playoffs/:poolName/picks', async (req, res) => {
  try {
    const { poolName } = req.params;
    const { picks } = req.body;
    const username = req.headers['x-username'] as string;
    
    if (!username) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    const userPicksCollection = database.collection('userPicks');
    const timeWindowCollection = database.collection('timewindows');
    
    const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
    
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Playoff pool not found' });
    }
    
    // Check if picks can be submitted (before Thursday deadline)
    const timeWindow = await timeWindowCollection.findOne({});
    
    if (!timeWindow) {
      return res.status(404).json({ success: false, message: 'Time window not found' });
    }
    
    const now = new Date();
    const thursdayDeadline = new Date(timeWindow.thursdayDeadline);
    
    if (now > thursdayDeadline) {
      return res.status(400).json({ success: false, message: 'Picks submission deadline has passed' });
    }
    
    // Find the member in the playoff pool
    const member = pool.playoffMembers.find(m => 
      m.username.toLowerCase() === username.toLowerCase() && 
      !m.eliminatedInWeek &&
      !m.hasBye
    );
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found in playoff pool or not eligible to submit picks' 
      });
    }
    
    // Save picks to userPicks collection
    await userPicksCollection.updateOne(
      { 
        username: username.toLowerCase(),
        poolName: `playoff_${poolName}`,
        week: pool.playoffCurrentWeek
      },
      {
        $set: {
          picks,
          immortalLock: []  // No immortal locks in playoffs
        }
      },
      { upsert: true }
    );
    
    res.json({ success: true, message: 'Playoff picks saved successfully' });
  } catch (error) {
    console.error('Error saving playoff picks:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Process playoff results at the end of the week
router.post('/api/playoffs/processResults', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
    // Only allow processing during playoff weeks
    if (currentWeek < 14 || currentWeek > 17) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot process playoff results - current week is ${currentWeek}, playoffs are weeks 14-17` 
      });
    }
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    const userPicksCollection = database.collection('userPicks');
    const resultsCollection = database.collection('betResultsGlobal');
    
    // Get all playoff pools for the current week
    const pools = await poolsCollection.find({ 
      hasPlayoffs: true,
      playoffCurrentWeek: currentWeek
    }).toArray();
    interface PoolResult {
        poolName: string; 
        success: boolean;
        message?: string;
        memberCount?: number;
        advancedToWeek?: number;
        processedMembers?: number; // Add this property
      }
      
      const results: PoolResult[] = [];
    
    for (const pool of pools) {
      // Process results for all active playoff members
      for (const member of pool.playoffMembers) {
        if (!member.eliminatedInWeek && !member.hasBye) {
          let weeklyPoints = 0;
          
          // Get the user's picks from userPicks collection
          const userPicks = await userPicksCollection.findOne({
            username: member.username.toLowerCase(),
            poolName: `playoff_${pool.name}`, // Fixed variable here
            week: currentWeek
          });
          
          if (userPicks && userPicks.picks && userPicks.picks.length > 0) {
            // Get the latest results from betResultsGlobal
            const resultsDoc = await resultsCollection.findOne({ identifier: 'currentResults' });
            
            if (resultsDoc && resultsDoc.results) {
              // Calculate points for each pick
              for (const pick of userPicks.picks) {
                const matchingResult = resultsDoc.results.find(r => 
                  r.username.toLowerCase() === member.username.toLowerCase() &&
                  r.teamName === pick.teamName &&
                  r.betValue === pick.value
                );
                
                if (matchingResult) {
                  weeklyPoints += matchingResult.points || 0;
                }
              }
            }
          }
          
          // Update member's weekly points
          member.weeklyPoints = weeklyPoints;
        }
      }
      
      // Save the updated pool
      await poolsCollection.updateOne(
        { _id: pool._id },
        { 
          $set: { 
            playoffMembers: pool.playoffMembers 
          }  
        }
      );
      
      results.push({ 
        poolName: pool.name, 
        success: true,
        processedMembers: pool.playoffMembers.filter(m => !m.eliminatedInWeek && !m.hasBye).length
      });
    }
    
    res.json({ 
      success: true, 
      message: `Processed results for ${pools.length} playoff pools`, 
      results 
    });
  } catch (error) {
    console.error('Error processing playoff results:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Advance playoffs to the next round
router.post('/api/playoffs/advance', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
    // Only allow advancing during playoff weeks
    if (currentWeek < 14 || currentWeek > 16) { // Can't advance past week 17
      return res.status(400).json({ 
        success: false, 
        message: `Cannot advance playoffs - current week is ${currentWeek}, playoffs advance during weeks 14-16` 
      });
    }
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    
    // Get all playoff pools for the current week
    const pools = await poolsCollection.find({ 
      hasPlayoffs: true,
      playoffCurrentWeek: currentWeek
    }).toArray();
    
    interface PoolResult {
        poolName: string; 
        success: boolean;
        message?: string;
        memberCount?: number;
        advancedToWeek?: number; // Add this property
      }
      
      const results: PoolResult[] = [];
    
    for (const pool of pools) {
      // Process each match in the current week
      const currentMatches = pool.playoffBracket.filter(match => match.week === currentWeek);
      
      for (const match of currentMatches) {
        const player1 = pool.playoffMembers.find(m => m.position === match.player1Position);
        const player2 = pool.playoffMembers.find(m => m.position === match.player2Position);
        
        if (!player1 || !player2) continue;
        
        // Determine winner based on points or seed tiebreaker
        let winner;
        if (player1.weeklyPoints > player2.weeklyPoints) {
          winner = player1;
        } else if (player2.weeklyPoints > player1.weeklyPoints) {
          winner = player2;
        } else {
          // In case of a tie, higher seed advances
          winner = player1.seed < player2.seed ? player1 : player2;
        }
        
        // Update match with winner
        match.winner = winner.position;
        
        // Update player advancing status
        player1.isAdvancing = player1.position === winner.position;
        player2.isAdvancing = player2.position === winner.position;
        
        // Mark players as eliminated if not advancing
        if (!player1.isAdvancing) {
          player1.eliminatedInWeek = currentWeek;
        }
        if (!player2.isAdvancing) {
          player2.eliminatedInWeek = currentWeek;
        }
        
        // Move advancing player to next position if not the finals
        if (match.nextMatchPosition !== "WINNER") {
          // Find the next match
          const nextMatch = pool.playoffBracket.find(m => 
            m.player1Position === match.nextMatchPosition || 
            m.player2Position === match.nextMatchPosition
          );
          
          if (nextMatch) {
            // Update winner's position for next week
            winner.position = match.nextMatchPosition;
            
            // Set player ID in next match
            if (nextMatch.player1Position === match.nextMatchPosition) {
              nextMatch.player1Id = winner.user;
            } else {
              nextMatch.player2Id = winner.user;
            }
          }
        } else {
          // This was the final match - set the playoff winner
          pool.playoffWinner = winner.user;
        }
      }
      
      // Reset weekly points for all members
      pool.playoffMembers.forEach(member => {
        member.weeklyPoints = 0;
      });
      
      // Advance to next week
      const nextWeek = currentWeek + 1;
      
      // Update the pool in the database
      await poolsCollection.updateOne(
        { _id: pool._id },
        { 
          $set: { 
            playoffMembers: pool.playoffMembers,
            playoffBracket: pool.playoffBracket,
            playoffCurrentWeek: nextWeek,
            playoffWinner: pool.playoffWinner || undefined
          } 
        }
      );
      
      results.push({ 
        poolName: pool.name, 
        success: true, 
        advancedToWeek: nextWeek
      }); 
    } 
    
    res.json({ 
      success: true, 
      message: `Advanced ${pools.length} playoff pools from week ${currentWeek} to week ${currentWeek + 1}`, 
      results 
    });
  } catch (error) {
    console.error('Error advancing playoffs:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Handle player leaving mid-playoffs
router.post('/api/playoffs/:poolName/handlePlayerLeaving', async (req, res) => {
  try {
    const { poolName } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }
    
    const database = await connectToDatabase();
    const poolsCollection = database.collection('pools');
    
    const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
    
    if (!pool) {
      return res.status(404).json({ success: false, message: 'Playoff pool not found' });
    }
    
    const currentWeek = pool.playoffCurrentWeek;
    
    // Find if the player is in an active match
    const currentMatches = pool.playoffBracket.filter(match => match.week === currentWeek);
    let handled = false;
    
    for (const match of currentMatches) {
      const player1 = pool.playoffMembers.find(m => m.position === match.player1Position);
      const player2 = pool.playoffMembers.find(m => m.position === match.player2Position);
      
      if (!player1 || !player2) continue;
      
      // If either player matches the leaving user, advance the other player
      if (player1.user.toString() === userId.toString()) {
        // Advance player2 automatically
        match.winner = player2.position;
        player2.isAdvancing = true;
        player1.isAdvancing = false;
        player1.eliminatedInWeek = currentWeek;
        
        // Process next match if needed
        if (match.nextMatchPosition !== "WINNER") {
          const nextMatch = pool.playoffBracket.find(m => 
            m.player1Position === match.nextMatchPosition || 
            m.player2Position === match.nextMatchPosition
          );
          
          if (nextMatch) {
            player2.position = match.nextMatchPosition;
            
            if (nextMatch.player1Position === match.nextMatchPosition) {
              nextMatch.player1Id = player2.user;
            } else {
              nextMatch.player2Id = player2.user;
            }
          }
        }
        
        handled = true;
      }
      else if (player2.user.toString() === userId.toString()) {
        // Advance player1 automatically
        match.winner = player1.position;
        player1.isAdvancing = true;
        player2.isAdvancing = false;
        player2.eliminatedInWeek = currentWeek;
        
        // Process next match if needed
        if (match.nextMatchPosition !== "WINNER") {
          const nextMatch = pool.playoffBracket.find(m => 
            m.player1Position === match.nextMatchPosition || 
            m.player2Position === match.nextMatchPosition
          );
          
          if (nextMatch) {
            player1.position = match.nextMatchPosition;
            
            if (nextMatch.player1Position === match.nextMatchPosition) {
              nextMatch.player1Id = player1.user;
            } else {
              nextMatch.player2Id = player1.user;
            }
          }
        }
        
        handled = true;
      }
    }
    
    if (handled) {
      // Save the updated pool
      await poolsCollection.updateOne(
        { _id: pool._id },
        { 
          $set: { 
            playoffMembers: pool.playoffMembers,
            playoffBracket: pool.playoffBracket
          } 
        }
      );
      
      res.json({ 
        success: true, 
        message: 'Player removed from playoff bracket successfully' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Player is not in any active match' 
      });
    }
  } catch (error) {
    console.error('Error handling player leaving playoffs:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
// Check if a player has a bye based on seed and total players
function hasByeForSeed(seed: number, totalPlayers: number): boolean {
    // For 10 players: Seeds 1-6 have byes in Week 14
    if (totalPlayers === 10) {
      return seed <= 6;
    }
    
    // For 9 players: Seeds 1-6 have byes
    if (totalPlayers === 9) {
      return seed <= 6;
    }
    
    // For 8 players: Seeds 1-4 have byes
    if (totalPlayers === 8) {
      return seed <= 4;
    }
    
    // For 7 players: Seeds 1-2 have byes
    if (totalPlayers === 7) {
      return seed <= 2;
    }
    
    // For 6 players: Seeds 1-2 have byes
    if (totalPlayers === 6) {
      return seed <= 2;
    }
    
    return false;
  }
  
// Get initial bracket position based on seed and total players
function getInitialPosition(seed: number, totalPlayers: number): string {
    // 10-player bracket positions (based on the corrected image)
    if (totalPlayers === 10) {
      switch(seed) {
        case 1: return "R2_M1_P1"; // Seed 1 has a bye in Week 14
        case 2: return "R2_M4_P1"; // Seed 2 has a bye in Week 14
        case 3: return "R2_M2_P1"; // Seed 3 has a bye in Week 14
        case 4: return "R2_M3_P1"; // Seed 4 has a bye in Week 14
        case 5: return "R2_M3_P2"; // Seed 5 plays Seed 4 in Week 15
        case 6: return "R2_M2_P2"; // Seed 6 plays Seed 3 in Week 15
        case 7: return "R1_M2_P1"; // Seed 7 plays in Week 14 vs 10
        case 8: return "R1_M1_P1"; // Seed 8 plays in Week 14 vs 9
        case 9: return "R1_M1_P2"; // Seed 9 plays in Week 14 vs 8
        case 10: return "R1_M2_P2"; // Seed 10 plays in Week 14 vs 7
        default: return "";
      }
    }
  
    // 9-player bracket (adjusting same pattern)
    if (totalPlayers === 9) {
      switch(seed) {
        case 1: return "R2_M1_P1"; // Seed 1 has a bye
        case 2: return "R2_M4_P1"; // Seed 2 has a bye
        case 3: return "R2_M2_P1"; // Seed 3 has a bye
        case 4: return "R2_M3_P1"; // Seed 4 has a bye
        case 5: return "R2_M3_P2"; // Seed 5 plays Seed 4 in Week 15
        case 6: return "R2_M2_P2"; // Seed 6 plays Seed 3 in Week 15
        case 7: return "R1_M1_P1"; // Seed 7 plays Week 14 vs 8
        case 8: return "R1_M1_P2"; // Seed 8 plays Week 14 vs 7
        case 9: return "R1_M2_P1"; // Seed 9 plays Week 14 (gets a bye in second match)
        default: return "";
      }
    }
  
    // 8-player bracket
    if (totalPlayers === 8) {
      switch(seed) {
        case 1: return "R2_M1_P1"; // Seed 1 has a bye
        case 2: return "R2_M4_P1"; // Seed 2 has a bye
        case 3: return "R2_M2_P1"; // Seed 3 has a bye
        case 4: return "R2_M3_P1"; // Seed 4 has a bye
        case 5: return "R1_M1_P1"; // Seed 5 plays Week 14 vs 8
        case 6: return "R1_M2_P1"; // Seed 6 plays Week 14 vs 7
        case 7: return "R1_M2_P2"; // Seed 7 plays Week 14 vs 6
        case 8: return "R1_M1_P2"; // Seed 8 plays Week 14 vs 5
        default: return "";
      }
    }
  
    // 7-player bracket
    if (totalPlayers === 7) {
      switch(seed) {
        case 1: return "R2_M1_P1"; // Seed 1 has a bye
        case 2: return "R2_M4_P1"; // Seed 2 has a bye
        case 3: return "R1_M1_P1"; // Seed 3 plays Week 14 vs 6
        case 4: return "R1_M2_P1"; // Seed 4 plays Week 14 vs 5
        case 5: return "R1_M2_P2"; // Seed 5 plays Week 14 vs 4
        case 6: return "R1_M1_P2"; // Seed 6 plays Week 14 vs 3
        case 7: return "R1_M3_P1"; // Seed 7 plays Week 14 (gets a bye in second match)
        default: return "";
      }
    }
  
    // 6-player bracket
    if (totalPlayers === 6) {
      switch(seed) {
        case 1: return "R2_M1_P1"; // Seed 1 has a bye
        case 2: return "R2_M4_P1"; // Seed 2 has a bye
        case 3: return "R1_M1_P1"; // Seed 3 plays Week 14 vs 6
        case 4: return "R1_M2_P1"; // Seed 4 plays Week 14 vs 5
        case 5: return "R1_M2_P2"; // Seed 5 plays Week 14 vs 4
        case 6: return "R1_M1_P2"; // Seed 6 plays Week 14 vs 3
        default: return "";
      }
    }
  
    return "";
  }
  
  

interface BracketMatch {
    matchId: string;
    round: number;
    week: number;
    player1Position: string;
    player2Position: string;
    nextMatchPosition: string;
  }
// Create bracket structure based on player count
// Create bracket structure based on player count
function createBracketForPlayerCount(playerCount: number): BracketMatch[] {
    const bracket: BracketMatch[] = [];
    
    if (playerCount === 10) {
      // First round (Week 14) - 2 matches
      bracket.push(
        { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P2" },
        { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M4_P2" }
      );
      
      // Second round (Week 15) - 4 matches
      bracket.push(
        { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
        { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
        { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
        { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
      );
    }
    else if (playerCount === 9) {
      // First round (Week 14) - 1 match (7 vs 8), seed 9 advances to Week 15
      bracket.push(
        { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P2" },
        { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M4_P2" } // This is a placeholder match for seed 9
      );
      
      // Second round (Week 15) - 4 matches
      bracket.push(
        { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
        { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
        { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
        { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
      );
    }
    else if (playerCount === 8) {
      // First round (Week 14) - 2 matches (5 vs 8, 6 vs 7)
      bracket.push(
        { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P2" },
        { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M4_P2" }
      );
      
      // Second round (Week 15) - 4 matches
      bracket.push(
        { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
        { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
        { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
        { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
      );
    }
    else if (playerCount === 7) {
      // First round (Week 14) - 2 matches (3 vs 6, 4 vs 5), seed 7 to Week 15
      bracket.push(
        { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M2_P2" },
        { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M3_P2" },
        { matchId: "R1_M3", round: 1, week: 14, player1Position: "R1_M3_P1", player2Position: "R1_M3_P2", nextMatchPosition: "R2_M4_P2" } // Placeholder for seed 7
      );
      
      // Second round (Week 15) - 3 matches
      bracket.push(
        { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
        { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
        { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
        { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
      );
    }
    else if (playerCount === 6) {
      // First round (Week 14) - 2 matches (3 vs 6, 4 vs 5)
      bracket.push(
        { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M2_P2" },
        { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M3_P2" }
      );
      
      // Second round (Week 15) - 3 matches (1 vs winner of match, 2 vs winner of match)
      bracket.push(
        { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
        { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
        { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
        { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
      );
    }
    
    // For all player counts, add the semifinals and finals
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "R4_M1_P1" },
      { matchId: "R3_M2", round: 3, week: 16, player1Position: "R3_M2_P1", player2Position: "R3_M2_P2", nextMatchPosition: "R4_M1_P2" },
      { matchId: "R4_M1", round: 4, week: 17, player1Position: "R4_M1_P1", player2Position: "R4_M1_P2", nextMatchPosition: "WINNER" }
    );
    
    return bracket;
  }
  

  
export default router;
