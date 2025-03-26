// src/routes/playoffRoutes.ts
import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import { getCurrentWeek } from '../microservices/serverUtils';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Initialize playoffs for all pools that have hasPlayoffs=true
// Initialize playoffs for all pools that have hasPlayoffs=true
router.post('/api/playoffs/initialize', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
    // Only proceed if we're at week 14 (always start playoffs at week 14)
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
          // INSTEAD, initialize with zero records:
          win: 0,
          loss: 0,
          push: 0
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

// First, define proper interfaces for our data structures
interface PlayoffPlayerHistory {
  week: number;
  points: number;
  position: string;
  opponent?: string;
  opponentPoints?: number;
  matchId?: string;
  roundNumber?: number;
  advanced?: boolean;
}
// Add these to your existing interfaces in the routes file

// Update HistoricalPlayer interface
interface HistoricalPlayer {
  username: string;
  seed: number;
  points: number;
  position: string;
  isAdvancing: boolean;
  eliminated: boolean;
  // Add this line:
  inCurrentWeekMatch?: boolean; // Flag to indicate if player is in a current week match
}

// Update CurrentPlayer interface
interface CurrentPlayer {
  id: any;
  username: string;
  seed: number;
  points: number;
  isAdvancing: boolean;
  hasBye: boolean;
  eliminated: boolean;
  position: string;
  // Add this line:
  inCurrentWeekMatch?: boolean; // Flag to indicate if player is in a current week match
}

// Update ProcessedMatch interface if needed
interface ProcessedMatch {
  id: string;
  round: number;
  week: number;
  player1: HistoricalPlayer | CurrentPlayer | null;
  player2: HistoricalPlayer | CurrentPlayer | null;
  winner: string | null;
  nextMatch: string;
  history: MatchHistoryData | null;
}

interface MatchHistoryData {
  week: number;
  round: number;
  matchId: string;
  winner: {
    username: string;
    seed: number;
    points: number;
    position: string;
  };
  loser: {
    username: string;
    seed: number;
    points: number;
    position: string;
  };
}

interface ProcessedMatch {
  id: string;
  round: number;
  week: number;
  player1: HistoricalPlayer | CurrentPlayer | null;
  player2: HistoricalPlayer | CurrentPlayer | null;
  winner: string | null;
  nextMatch: string;
  history: MatchHistoryData | null;
}


// Modify the router.get('/api/playoffs/:poolName/bracket') function

// Modify the router.get('/api/playoffs/:poolName/bracket') function

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
    
    // Get the player count for this bracket
    const playerCount = pool.playoffMembers ? pool.playoffMembers.length : 0;
    
    // Process matches to include historical data
    const processedMatches = pool.playoffBracket.map(match => {
      // Find current players in this position
      const player1 = pool.playoffMembers?.find(m => m.position === match.player1Position);
      const player2 = pool.playoffMembers?.find(m => m.position === match.player2Position);
      
      // Look up historical data for this match
      const historyFromPlayer1 = findHistoryForMatch(pool.playoffMembers, match.matchId, match.week, match.player1Position);
      const historyFromPlayer2 = findHistoryForMatch(pool.playoffMembers, match.matchId, match.week, match.player2Position);
      
      // Create the processed match object with defaults
      const processedMatch: ProcessedMatch = {
        id: match.matchId || '',
        round: match.round || 0,
        week: match.week || 0,
        player1: null,
        player2: null,
        winner: match.winner || null,
        nextMatch: match.nextMatchPosition || '',
        history: null
      };
      
      // Create match history for completed matches
      if (match.winner && match.week < currentWeek && historyFromPlayer1 && historyFromPlayer2) {
        // Determine winner and loser history
        const winnerHistory = match.winner === match.player1Position ? historyFromPlayer1 : historyFromPlayer2;
        const loserHistory = match.winner === match.player1Position ? historyFromPlayer2 : historyFromPlayer1;
        
        // Find the members these histories belong to
        const winnerMember = findMemberByHistory(pool.playoffMembers, winnerHistory);
        const loserMember = findMemberByHistory(pool.playoffMembers, loserHistory);
        
        if (winnerMember && loserMember) {
          processedMatch.history = {
            week: match.week,
            round: match.round,
            matchId: match.matchId,
            winner: {
              username: winnerMember.username || '',
              seed: winnerMember.seed || 0,
              points: winnerHistory.points || 0,
              position: winnerHistory.position || ''
            },
            loser: {
              username: loserMember.username || '',
              seed: loserMember.seed || 0,
              points: loserHistory.points || 0,
              position: loserHistory.position || ''
            }
          };
        }
      }
      
      // Set player data for this match
      if (match.week < currentWeek) {
        // Use historical data for past weeks
        if (historyFromPlayer1) {
          const member = findMemberByHistory(pool.playoffMembers, historyFromPlayer1);
          if (member) {
            // Check if this member is also in a current week match
            const isInCurrentWeekMatch = pool.playoffBracket
              .filter(m => m.week === currentWeek)
              .some(m => 
                (m.player1Position === member.position || m.player2Position === member.position)
              );
              
            processedMatch.player1 = {
              username: member.username || '',
              seed: member.seed || 0,
              points: historyFromPlayer1.points || 0,
              position: historyFromPlayer1.position || '',
              isAdvancing: !!historyFromPlayer1.advanced,
              eliminated: !historyFromPlayer1.advanced,
              inCurrentWeekMatch: isInCurrentWeekMatch
            };
          }
        }
        
        if (historyFromPlayer2) {
          const member = findMemberByHistory(pool.playoffMembers, historyFromPlayer2);
          if (member) {
            // Check if this member is also in a current week match
            const isInCurrentWeekMatch = pool.playoffBracket
              .filter(m => m.week === currentWeek)
              .some(m => 
                (m.player1Position === member.position || m.player2Position === member.position)
              );
              
            processedMatch.player2 = {
              username: member.username || '',
              seed: member.seed || 0,
              points: historyFromPlayer2.points || 0,
              position: historyFromPlayer2.position || '',
              isAdvancing: !!historyFromPlayer2.advanced,
              eliminated: !historyFromPlayer2.advanced,
              inCurrentWeekMatch: isInCurrentWeekMatch
            };
          }
        }
      } else {
        // Use current data for current week
        if (player1) {
          processedMatch.player1 = {
            id: player1.user,
            username: player1.username || '',
            seed: player1.seed || 0,
            points: player1.weeklyPoints || 0,
            isAdvancing: !!player1.isAdvancing,
            hasBye: !!player1.hasBye,
            eliminated: !!player1.eliminatedInWeek,
            position: player1.position || '',
            inCurrentWeekMatch: match.week === currentWeek
          };
        }
        
        if (player2) {
          processedMatch.player2 = {
            id: player2.user,
            username: player2.username || '',
            seed: player2.seed || 0,
            points: player2.weeklyPoints || 0,
            isAdvancing: !!player2.isAdvancing,
            hasBye: !!player2.hasBye,
            eliminated: !!player2.eliminatedInWeek,
            position: player2.position || '',
            inCurrentWeekMatch: match.week === currentWeek
          };
        }
      }
      
      return processedMatch;
    });
    
    // When building members data, identify if the member is in a current week match
    const membersWithCurrentWeekFlag = (pool.playoffMembers || []).map(member => {
      // Check if this member is in any current week match
      const isInCurrentWeekMatch = pool.playoffBracket
        .filter(match => match.week === currentWeek)
        .some(match => 
          match.player1Position === member.position || 
          match.player2Position === member.position
        );
      
      return {
        id: member.user,
        username: member.username || '',
        seed: member.seed || 0,
        position: member.position || '',
        weeklyPoints: member.weeklyPoints || 0,
        isAdvancing: !!member.isAdvancing,
        hasBye: !!member.hasBye,
        eliminated: !!member.eliminatedInWeek,
        eliminatedInWeek: member.eliminatedInWeek,
        inCurrentWeekMatch: isInCurrentWeekMatch,
        stats: {
          win: member.win || 0,
          loss: member.loss || 0,
          push: member.push || 0
        },
        history: (member.pointsHistory || []).map(h => ({
          week: h.week || 0,
          points: h.points || 0,
          position: h.position || '',
          opponent: h.opponent || '',
          opponentPoints: h.opponentPoints || 0,
          matchId: h.matchId || '',
          roundNumber: h.roundNumber || 0,
          advanced: !!h.advanced
        }))
      };
    });
    
    // Build the final response
    const bracketData = {
      currentWeek,
      rounds: generateRoundsBasedOnPlayerCount(playerCount),
      matches: processedMatches,
      members: membersWithCurrentWeekFlag,
      isCompleted: !!pool.playoffCompleted,
      champion: pool.playoffChampion ? {
        username: pool.playoffChampion.username || '',
        seed: pool.playoffChampion.seed || 0,
        winningPoints: pool.playoffChampion.winningPoints || 0,
        dateWon: pool.playoffChampion.dateWon || new Date(),
        win: pool.playoffChampion.win || 0,
        loss: pool.playoffChampion.loss || 0,
        push: pool.playoffChampion.push || 0
      } : null
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



// Helper function to find history entry for a specific match
function findHistoryForMatch(members, matchId, week, position) {
  if (!members || !matchId || !week) return null;
  
  for (const member of members) {
    if (member.pointsHistory && member.pointsHistory.length > 0) {
      const historyEntry = member.pointsHistory.find(h => 
        h.matchId === matchId && 
        h.week === week && 
        h.position === position
      );
      
      if (historyEntry) {
        return historyEntry;
      }
    }
  }
  
  return null;
}

// Helper function to find a member by their history entry
function findMemberByHistory(members, historyEntry) {
  if (!members || !historyEntry) return null;
  
  return members.find(member => 
    member.pointsHistory && 
    member.pointsHistory.some(h => 
      h.matchId === historyEntry.matchId && 
      h.week === historyEntry.week && 
      h.position === historyEntry.position
    )
  );
}



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

  
  // Add a new API endpoint to check if a pool is in playoff mode
router.get('/api/playoffs/isPlayoff/:poolName', async (req, res) => {
    try {
      const { poolName } = req.params;
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      
      const pool = await poolsCollection.findOne({ name: poolName });
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Pool not found' });
      }
      
      // Check if the pool has playoffs and is in playoff mode (week >= 14)
      const currentWeek = await getCurrentWeek();
      const isPlayoffMode = pool.hasPlayoffs && currentWeek >= 14 && currentWeek <= 17;
      
      res.json({
        success: true,
        poolName,
        isPlayoffMode,
        playoffCurrentWeek: pool.playoffCurrentWeek || null
      });
    } catch (error) {
      console.error('Error checking playoff status:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // New API endpoint to get a user's playoff picks
router.get('/api/playoffs/:poolName/picks/:username', async (req, res) => {
    try {
      const { poolName, username } = req.params;
      
      const database = await connectToDatabase();
      const userPicksCollection = database.collection('userPicks');
      const poolsCollection = database.collection('pools');
      
      // First, verify this is a playoff pool
      const pool = await poolsCollection.findOne({ name: poolName, hasPlayoffs: true });
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Playoff pool not found' });
      }
      
      // Fetch the user's playoff picks
      const userPicks = await userPicksCollection.findOne({
        username: username.toLowerCase(),
        poolName: `playoff_${poolName}`,
        week: pool.playoffCurrentWeek
      });
      
      // Return the picks or empty arrays if none found
      res.json({
        success: true,
        username,
        poolName,
        week: pool.playoffCurrentWeek,
        picks: userPicks?.picks || [],
        immortalLock: userPicks?.immortalLock || []
      });
    } catch (error) {
      console.error('Error fetching playoff picks:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
// Advance playoffs to the next round
// Updated advancement logic to properly handle player positions
// This should be added to your router.post('/api/playoffs/advance') endpoint

// Modified canAdvancePlayoffs function to allow final advancement
// This fixes the issue where the final match can't be processed
function canAdvancePlayoffs(playerCount: number, currentWeek: number): boolean {
  if (playerCount <= 8) {
    // 6-8 player brackets run weeks 14-16
    // Changed to include week 16 so the final match can be processed
    return currentWeek >= 14 && currentWeek <= 16;
  } else {
    // 9-10 player brackets run weeks 14-17
    // Changed to include week 17 so the final match can be processed
    return currentWeek >= 14 && currentWeek <= 17;
  }
}

// Updated advance playoffs route to handle the final week correctly
// In playoffRoutes.ts
/*
router.post('/api/playoffs/advance', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
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
      advancedToWeek?: number | string;
      playoffWinner?: string;
    }
      
    const results: PoolResult[] = [];
    
    for (const pool of pools) {
      // Determine if we can advance based on player count
      const playerCount = pool.playoffMembers ? pool.playoffMembers.length : 0;
      
      // Check if this is the final week for this bracket size
      const isFinalWeek = (playerCount <= 8 && currentWeek === 16) || 
                         (playerCount > 8 && currentWeek === 17);
      
      if (!canAdvancePlayoffs(playerCount, currentWeek)) {
        results.push({ 
          poolName: pool.name, 
          success: false, 
          message: `Cannot advance playoffs - current week is ${currentWeek}, final playoff week for this bracket size is ${getFinalWeekNumber(playerCount)}` 
        });
        continue;
      }
      
      // Process each match in the current week
      const currentMatches = pool.playoffBracket.filter(match => match.week === currentWeek);
      
      // Debug log - before processing
      console.log(`Processing week ${currentWeek} for pool ${pool.name} with ${currentMatches.length} matches`);
      console.log('Player positions before advancing:');
      pool.playoffMembers.forEach(member => {
        console.log(`${member.username} (Seed ${member.seed}): position=${member.position}, isAdvancing=${member.isAdvancing}`);
      });
      
      for (const match of currentMatches) {
        const player1 = pool.playoffMembers.find(m => m.position === match.player1Position);
        const player2 = pool.playoffMembers.find(m => m.position === match.player2Position);
        
        if (!player1 || !player2) {
          console.log(`Match ${match.matchId} has missing player(s): player1=${player1?.username || 'missing'}, player2=${player2?.username || 'missing'}`);
          continue; 
        }
        
        // Before determining the winner, save the current match data to history for both players
        // Initialize pointsHistory array if it doesn't exist
        if (!player1.pointsHistory) player1.pointsHistory = [];
        if (!player2.pointsHistory) player2.pointsHistory = [];
        
        // Add current week's data to history
        player1.pointsHistory.push({
          week: currentWeek,
          points: player1.weeklyPoints || 0,
          position: player1.position,
          opponent: player2.username,
          opponentPoints: player2.weeklyPoints || 0,
          matchId: match.matchId,
          roundNumber: match.round,
          advanced: false // Will update this after determining the winner
        });
        
        player2.pointsHistory.push({
          week: currentWeek,
          points: player2.weeklyPoints || 0,
          position: player2.position,
          opponent: player1.username,
          opponentPoints: player1.weeklyPoints || 0,
          matchId: match.matchId,
          roundNumber: match.round,
          advanced: false // Will update this after determining the winner
        });
        
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
        
        console.log(`Match ${match.matchId} winner: ${winner.username} (${winner.position})`);
        
        // Update match with winner position
        match.winner = winner.position;
        
        // Update player advancing status
        player1.isAdvancing = player1.position === winner.position;
        player2.isAdvancing = player2.position === winner.position;
        
        // Update the advanced flag in the history entries
        const player1HistoryEntry = player1.pointsHistory.find(
          h => h.week === currentWeek && h.matchId === match.matchId
        );
        if (player1HistoryEntry) {
          player1HistoryEntry.advanced = player1.isAdvancing;
        }
        
        const player2HistoryEntry = player2.pointsHistory.find(
          h => h.week === currentWeek && h.matchId === match.matchId
        );
        if (player2HistoryEntry) {
          player2HistoryEntry.advanced = player2.isAdvancing;
        }
        
        // Mark players as eliminated if not advancing
        if (!player1.isAdvancing) {
          player1.eliminatedInWeek = currentWeek;
        }
        if (!player2.isAdvancing) {
          player2.eliminatedInWeek = currentWeek;
        }
        
        // Check if this is the finals match (has nextMatchPosition === "WINNER")
        const isFinalMatch = match.nextMatchPosition === "WINNER";
        
        if (isFinalMatch) {
          // This was the final match - set the playoff winner and championship details
          pool.playoffWinner = winner.user;
          pool.playoffChampion = {
            username: winner.username,
            seed: winner.seed,
            winningPoints: winner.weeklyPoints || 0,
            dateWon: new Date(),
            win: winner.win || 0,
            loss: winner.loss || 0,
            push: winner.push || 0
          };
          console.log(`Setting playoff winner to ${winner.username}`);
        } else if (match.nextMatchPosition !== "WINNER") {
          // Only move advancing player if not the finals
          // Find the next match
          const nextMatch = pool.playoffBracket.find(m => 
            m.player1Position === match.nextMatchPosition || 
            m.player2Position === match.nextMatchPosition
          );
          
          if (nextMatch) {
            console.log(`Moving ${winner.username} to next position: ${match.nextMatchPosition}`);
            
            // Update winner's position for next week
            const oldPosition = winner.position;
            winner.position = match.nextMatchPosition;
            
            // Important: Log the position change to help debugging
            console.log(`Changed ${winner.username}'s position from ${oldPosition} to ${match.nextMatchPosition}`);
            
            // Set player ID in next match
            if (nextMatch.player1Position === match.nextMatchPosition) {
              nextMatch.player1Id = winner.user;
            } else {
              nextMatch.player2Id = winner.user;
            }
          } else {
            console.error(`Could not find next match for position ${match.nextMatchPosition}`);
          }
        }
      }
      
      // Debug log - after processing
      console.log('Player positions after advancing:');
      pool.playoffMembers.forEach(member => {
        console.log(`${member.username} (Seed ${member.seed}): position=${member.position}, isAdvancing=${member.isAdvancing}, eliminated=${!!member.eliminatedInWeek}`);
      });
      
      // Reset weekly points ONLY for advancing players who will play in the next round
      pool.playoffMembers.forEach(member => {
        // Only reset points for players who are advancing to the next round 
        // and are not the champion (if this is the final week)
        if (member.isAdvancing && !isFinalWeek) {
          member.weeklyPoints = 0;
        }
      });
      
      // Special handling for the final week
      if (isFinalWeek) {
        // Mark the playoffs as completed instead of advancing the week
        await poolsCollection.updateOne(
          { _id: pool._id },
          { 
            $set: { 
              playoffMembers: pool.playoffMembers,
              playoffBracket: pool.playoffBracket,
              playoffWinner: pool.playoffWinner || undefined,
              playoffChampion: pool.playoffChampion || undefined,
              playoffCompleted: true
            }
          }
        );
        
        results.push({ 
          poolName: pool.name, 
          success: true, 
          message: `Playoffs completed! Champion: ${pool.playoffChampion ? pool.playoffChampion.username : 'Unknown'}`,
          advancedToWeek: 'completed',
          playoffWinner: pool.playoffChampion ? pool.playoffChampion.username : undefined
        });
      } else {
        // Normal case - advance to next week
        const nextWeek = currentWeek + 1;
        
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
    }
    
    res.json({ 
      success: true, 
      message: `Processed ${pools.length} playoff pools from week ${currentWeek}`, 
      results 
    });
  } catch (error) {
    console.error('Error advancing playoffs:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});*/

// POST route to advance playoffs to the next round
router.post('/api/playoffs/advance', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
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
      advancedToWeek?: number | string;
      playoffWinner?: string;
    }
      
    const results: PoolResult[] = [];
    
    for (const pool of pools) {
      // Determine if we can advance based on player count
      const playerCount = pool.playoffMembers ? pool.playoffMembers.length : 0;
      
      // Check if this is the final week for this bracket size
      const isFinalWeek = (playerCount <= 8 && currentWeek === 16) || 
                         (playerCount > 8 && currentWeek === 17);
      
      if (!canAdvancePlayoffs(playerCount, currentWeek)) {
        results.push({ 
          poolName: pool.name, 
          success: false, 
          message: `Cannot advance playoffs - current week is ${currentWeek}, final playoff week for this bracket size is ${getFinalWeekNumber(playerCount)}` 
        });
        continue;
      }
      
      // Process each match in the current week
      const currentMatches = pool.playoffBracket.filter(match => match.week === currentWeek);
      
      // Debug log - before processing
      console.log(`Processing week ${currentWeek} for pool ${pool.name} with ${currentMatches.length} matches`);
      console.log('Player positions before advancing:');
      pool.playoffMembers.forEach(member => {
        console.log(`${member.username} (Seed ${member.seed}): position=${member.position}, isAdvancing=${member.isAdvancing}`);
      });
      
      for (const match of currentMatches) {
        const player1 = pool.playoffMembers.find(m => m.position === match.player1Position);
        const player2 = pool.playoffMembers.find(m => m.position === match.player2Position);
        
        if (!player1 || !player2) {
          console.log(`Match ${match.matchId} has missing player(s): player1=${player1?.username || 'missing'}, player2=${player2?.username || 'missing'}`);
          continue; 
        }
        
        // Before determining the winner, save the current match data to history for both players
        // Initialize pointsHistory array if it doesn't exist
        if (!player1.pointsHistory) player1.pointsHistory = [];
        if (!player2.pointsHistory) player2.pointsHistory = [];
        
        // Add current week's data to history
        player1.pointsHistory.push({
          week: currentWeek,
          points: player1.weeklyPoints || 0,
          position: player1.position,
          opponent: player2.username,
          opponentPoints: player2.weeklyPoints || 0,
          matchId: match.matchId,
          roundNumber: match.round,
          advanced: false // Will update this after determining the winner
        });
        
        player2.pointsHistory.push({
          week: currentWeek,
          points: player2.weeklyPoints || 0,
          position: player2.position,
          opponent: player1.username,
          opponentPoints: player1.weeklyPoints || 0,
          matchId: match.matchId,
          roundNumber: match.round,
          advanced: false // Will update this after determining the winner
        });
        
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
        
        console.log(`Match ${match.matchId} winner: ${winner.username} (${winner.position})`);
        
        // Update match with winner position
        match.winner = winner.position;
        
        // Update player advancing status
        player1.isAdvancing = player1.position === winner.position;
        player2.isAdvancing = player2.position === winner.position;
        
        // Update the advanced flag in the history entries
        const player1HistoryEntry = player1.pointsHistory.find(
          h => h.week === currentWeek && h.matchId === match.matchId
        );
        if (player1HistoryEntry) {
          player1HistoryEntry.advanced = player1.isAdvancing;
        }
        
        const player2HistoryEntry = player2.pointsHistory.find(
          h => h.week === currentWeek && h.matchId === match.matchId
        );
        if (player2HistoryEntry) {
          player2HistoryEntry.advanced = player2.isAdvancing;
        }
        
        // Store original position before advancing to next match
        const originalWinnerPosition = winner.position;
        
        // Mark players as eliminated if not advancing
        if (!player1.isAdvancing) {
          player1.eliminatedInWeek = currentWeek;
        }
        if (!player2.isAdvancing) {
          player2.eliminatedInWeek = currentWeek;
        }
        
        // Check if this is the finals match (has nextMatchPosition === "WINNER")
        const isFinalMatch = match.nextMatchPosition === "WINNER";
        
        if (isFinalMatch) {
          // This was the final match - set the playoff winner and championship details
          pool.playoffWinner = winner.user;
          pool.playoffChampion = {
            username: winner.username,
            seed: winner.seed,
            winningPoints: winner.weeklyPoints || 0,
            dateWon: new Date(),
            win: winner.win || 0,
            loss: winner.loss || 0,
            push: winner.push || 0
          };
          console.log(`Setting playoff winner to ${winner.username}`);
        } else if (match.nextMatchPosition !== "WINNER") {
          // Only move advancing player if not the finals
          // Find the next match
          const nextMatch = pool.playoffBracket.find(m => 
            m.player1Position === match.nextMatchPosition || 
            m.player2Position === match.nextMatchPosition
          );
          
          if (nextMatch) {
            console.log(`Moving ${winner.username} to next position: ${match.nextMatchPosition}`);
            
            // Store position history for reference
            if (!winner.positionHistory) winner.positionHistory = [];
            winner.positionHistory.push({
              week: currentWeek,
              originalPosition: originalWinnerPosition,
              newPosition: match.nextMatchPosition,
              matchId: match.matchId
            });
            
            // Update winner's position for next week
            const oldPosition = winner.position;
            winner.position = match.nextMatchPosition;
            
            // Important: Log the position change to help debugging
            console.log(`Changed ${winner.username}'s position from ${oldPosition} to ${match.nextMatchPosition}`);
            
            // Set player ID in next match
            if (nextMatch.player1Position === match.nextMatchPosition) {
              nextMatch.player1Id = winner.user;
            } else {
              nextMatch.player2Id = winner.user;
            }
          } else {
            console.error(`Could not find next match for position ${match.nextMatchPosition}`);
          }
        }
      }
      
      // Debug log - after processing
      console.log('Player positions after advancing:');
      pool.playoffMembers.forEach(member => {
        console.log(`${member.username} (Seed ${member.seed}): position=${member.position}, isAdvancing=${member.isAdvancing}, eliminated=${!!member.eliminatedInWeek}`);
      });
      
      // Reset weekly points ONLY for advancing players who will play in the next round
      pool.playoffMembers.forEach(member => {
        // Only reset points for players who are advancing to the next round 
        // and are not the champion (if this is the final week)
        if (member.isAdvancing && !isFinalWeek) {
          // Store the current points in history before resetting
          if (!member.pointsHistory) member.pointsHistory = [];
          
          // Reset weekly points
          member.weeklyPoints = 0;
        }
      });
      
      // Special handling for the final week
      if (isFinalWeek) {
        // Mark the playoffs as completed instead of advancing the week
        await poolsCollection.updateOne(
          { _id: pool._id },
          { 
            $set: { 
              playoffMembers: pool.playoffMembers,
              playoffBracket: pool.playoffBracket,
              playoffWinner: pool.playoffWinner || undefined,
              playoffChampion: pool.playoffChampion || undefined,
              playoffCompleted: true
            }
          }
        );
        
        results.push({ 
          poolName: pool.name, 
          success: true, 
          message: `Playoffs completed! Champion: ${pool.playoffChampion ? pool.playoffChampion.username : 'Unknown'}`,
          advancedToWeek: 'completed',
          playoffWinner: pool.playoffChampion ? pool.playoffChampion.username : undefined
        });
      } else {
        // Normal case - advance to next week
        const nextWeek = currentWeek + 1;
        
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
    }
    
    res.json({ 
      success: true, 
      message: `Processed ${pools.length} playoff pools from week ${currentWeek}`, 
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
// Reverse the advancement of playoffs to the previous round
router.post('/api/playoffs/reverseAdvance', async (req, res) => {
  try {
    const currentWeek = await getCurrentWeek();
    
    // Only allow reversing during playoff weeks (except week 14 which is the first playoff week)
    if (currentWeek < 15 || currentWeek > 17) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot reverse advance playoffs - current week is ${currentWeek}, can only reverse during weeks 15-17` 
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
      reversedToWeek?: number;
    }
      
    const results: PoolResult[] = [];
    
    for (const pool of pools) {
      const previousWeek = currentWeek - 1;
      
      // Get the matches from the previous week
      const previousMatches = pool.playoffBracket.filter(match => match.week === previousWeek);
      
      // Revert player positions and advancement status
      for (const match of previousMatches) {
        // Find players in the current match
        const winningPlayer = pool.playoffMembers.find(m => m.position === match.winner);
        
        if (winningPlayer) {
          // Find the original positions
          const originalPosition = match.player1Position === match.winner ? 
            match.player1Position : match.player2Position;
          
          // Reset the player's position
          winningPlayer.position = originalPosition;
          
          // Reset the advancement status for both players in the match
          const player1 = pool.playoffMembers.find(m => 
            m.position === match.player1Position || 
            (m.eliminatedInWeek === previousWeek && 
             (match.player1Position === match.player1Position || match.player1Position === match.player2Position))
          );
          
          const player2 = pool.playoffMembers.find(m => 
            m.position === match.player2Position || 
            (m.eliminatedInWeek === previousWeek && 
             (match.player2Position === match.player1Position || match.player2Position === match.player2Position))
          );
          
          if (player1) {
            player1.isAdvancing = false;
            if (player1.eliminatedInWeek === previousWeek) {
              delete player1.eliminatedInWeek;
            }
          }
          
          if (player2) {
            player2.isAdvancing = false;
            if (player2.eliminatedInWeek === previousWeek) {
              delete player2.eliminatedInWeek;
            }
          }
          
          // Reset the winner in the match
          delete match.winner;
          
          // Reset any nextMatch assignments from this match
          if (match.nextMatchPosition !== "WINNER") {
            const nextMatch = pool.playoffBracket.find(m => 
              m.player1Position === match.nextMatchPosition || 
              m.player2Position === match.nextMatchPosition
            );
            
            if (nextMatch) {
              if (nextMatch.player1Position === match.nextMatchPosition) {
                delete nextMatch.player1Id;
              } else {
                delete nextMatch.player2Id;
              }
            }
          } else {
            // If this was the final match, remove the playoff winner
            delete pool.playoffWinner;
          }
        }
      }
      
      // If there were byes in the previous week, restore those
      for (const member of pool.playoffMembers) {
        if (member.hasBye && previousWeek === 14) {
          member.isAdvancing = true;
        }
      }
      
      // Update the pool in the database
      await poolsCollection.updateOne(
        { _id: pool._id },
        { 
          $set: { 
            playoffMembers: pool.playoffMembers,
            playoffBracket: pool.playoffBracket,
            playoffCurrentWeek: previousWeek,
          },
          $unset: {
            playoffWinner: ""
          }
        }
      );
      
      results.push({ 
        poolName: pool.name, 
        success: true, 
        reversedToWeek: previousWeek
      }); 
    } 
    
    res.json({ 
      success: true, 
      message: `Reversed ${pools.length} playoff pools from week ${currentWeek} to week ${currentWeek - 1}`, 
      results 
    });
  } catch (error) {
    console.error('Error reversing playoff advancement:', error);
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
// Create bracket structure based on player count - fixed for 6 players
function createBracketForPlayerCount(playerCount: number): BracketMatch[] {
  const bracket: BracketMatch[] = [];
  
  if (playerCount === 6) {
    // 6 player bracket (3 weeks: 14, 15, 16)
    // First round (Week 14) - 2 matches with 2 players getting byes
    bracket.push(
      { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P1" },
      { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M2_P1" }
    );
    
    // Semifinals (Week 15) - 2 matches
    bracket.push(
      { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
      { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" }
    );
    
    // Finals (Week 16) - 1 match
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "WINNER" }
    );
  }
  // Create bracket structure for 7 players
  else if (playerCount === 7) {
    // First round (Week 14) - 3 matches with seed 1 getting a bye
// First round (Week 14) - 3 matches with seed 1 getting a bye
bracket.push(
  { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M2_P1" },
  { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M2_P2" },
  { matchId: "R1_M3", round: 1, week: 14, player1Position: "R1_M3_P1", player2Position: "R1_M3_P2", nextMatchPosition: "R2_M1_P2" }
);
    // Semifinals (Week 15) - 2 matches (seed 1 enters here)
    bracket.push(
      { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
      { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" }
    );
    
    // Finals (Week 16) - 1 match
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "WINNER" }
    );
  }
  else if (playerCount === 8) {
    // 8 player bracket (3 weeks: 14, 15, 16)
    // First round (Week 14) - Quarterfinals - 4 matches
// First round (Week 14) - Quarterfinals - 4 matches
bracket.push(
  { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P1" },
  { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M1_P2" },
  { matchId: "R1_M3", round: 1, week: 14, player1Position: "R1_M3_P1", player2Position: "R1_M3_P2", nextMatchPosition: "R2_M2_P1" },
  { matchId: "R1_M4", round: 1, week: 14, player1Position: "R1_M4_P1", player2Position: "R1_M4_P2", nextMatchPosition: "R2_M2_P2" }
);
    
    // Semifinals (Week 15) - 2 matches
    bracket.push(
      { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
      { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" }
    );
    
    // Finals (Week 16) - 1 match
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "WINNER" }
    );
  }
  else if (playerCount === 9) {
    // 9 player bracket (4 weeks: 14, 15, 16, 17)
    // First round (Week 14) - Only 1 match (seeds 8 vs 9)
  // First round (Week 14) - Only 1 match (seeds 8 vs 9)
bracket.push(
  { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P2" }
);

// Quarterfinals (Week 15) - 4 matches
bracket.push(
  { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
  { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
  { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
  { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
);
    
    // Semifinals (Week 16) - 2 matches
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "R4_M1_P1" },
      { matchId: "R3_M2", round: 3, week: 16, player1Position: "R3_M2_P1", player2Position: "R3_M2_P2", nextMatchPosition: "R4_M1_P2" }
    );
    
    // Finals (Week 17) - 1 match
    bracket.push(
      { matchId: "R4_M1", round: 4, week: 17, player1Position: "R4_M1_P1", player2Position: "R4_M1_P2", nextMatchPosition: "WINNER" }
    );
  }
  else if (playerCount === 10) {
    // 10 player bracket (4 weeks: 14, 15, 16, 17)
    // First round (Week 14) - 2 matches (seeds 7-10 play in first round)
   // First round (Week 14) - 2 matches (seeds 7-10 play in first round)
bracket.push(
  { matchId: "R1_M1", round: 1, week: 14, player1Position: "R1_M1_P1", player2Position: "R1_M1_P2", nextMatchPosition: "R2_M1_P2" },
  { matchId: "R1_M2", round: 1, week: 14, player1Position: "R1_M2_P1", player2Position: "R1_M2_P2", nextMatchPosition: "R2_M4_P2" }
);
    
    // Quarterfinals (Week 15) - 4 matches
    bracket.push(
      { matchId: "R2_M1", round: 2, week: 15, player1Position: "R2_M1_P1", player2Position: "R2_M1_P2", nextMatchPosition: "R3_M1_P1" },
      { matchId: "R2_M2", round: 2, week: 15, player1Position: "R2_M2_P1", player2Position: "R2_M2_P2", nextMatchPosition: "R3_M1_P2" },
      { matchId: "R2_M3", round: 2, week: 15, player1Position: "R2_M3_P1", player2Position: "R2_M3_P2", nextMatchPosition: "R3_M2_P1" },
      { matchId: "R2_M4", round: 2, week: 15, player1Position: "R2_M4_P1", player2Position: "R2_M4_P2", nextMatchPosition: "R3_M2_P2" }
    );
    
    // Semifinals (Week 16) - 2 matches
    bracket.push(
      { matchId: "R3_M1", round: 3, week: 16, player1Position: "R3_M1_P1", player2Position: "R3_M1_P2", nextMatchPosition: "R4_M1_P1" },
      { matchId: "R3_M2", round: 3, week: 16, player1Position: "R3_M2_P1", player2Position: "R3_M2_P2", nextMatchPosition: "R4_M1_P2" }
    );
    
    // Finals (Week 17) - 1 match
    bracket.push(
      { matchId: "R4_M1", round: 4, week: 17, player1Position: "R4_M1_P1", player2Position: "R4_M1_P2", nextMatchPosition: "WINNER" }
    );
  }
  
  return bracket;
}
  

  // Helper function to generate the appropriate rounds based on player count
function generateRoundsBasedOnPlayerCount(playerCount: number) {
  if (playerCount <= 6) {
    // 6 player brackets (3 rounds: weeks 14, 15, 16)
    return [
      { round: 1, week: 14, name: 'First Round' },
      { round: 2, week: 15, name: 'Semi finals' },
      { round: 3, week: 16, name: 'Finals' }
    ];
  } else if (playerCount === 7) {
    // 7 player brackets (3 rounds: weeks 14, 15, 16)
    return [
      { round: 1, week: 14, name: 'First Round' },
      { round: 2, week: 15, name: 'Semi finals' },
      { round: 3, week: 16, name: 'Finals' }
    ];
  } else if (playerCount === 8) {
    // 8 player brackets (3 rounds: weeks 14, 15, 16)
    return [
      { round: 1, week: 14, name: 'Quarter finals' },
      { round: 2, week: 15, name: 'Semi finals' },
      { round: 3, week: 16, name: 'Finals' }
    ];
  } else {
    // 9-10 player brackets (4 rounds: weeks 14, 15, 16, 17)
    return [
      { round: 1, week: 14, name: 'First Round' },
      { round: 2, week: 15, name: 'Quarter finals' },
      { round: 3, week: 16, name: 'Semi finals' },
      { round: 4, week: 17, name: 'Finals' }
    ];
  }
}


// Function to determine if a bracket has completed based on player count and current week
function hasPlayoffsCompleted(playerCount: number, currentWeek: number): boolean {
  if (playerCount <= 8) {
    return currentWeek > 16; // 6-8 player brackets end at week 16
  } else {
    return currentWeek > 17; // 9-10 player brackets end at week 17
  }
}

// Function to get the final week number based on player count
function getFinalWeekNumber(playerCount: number): number {
  if (playerCount <= 8) {
    return 16; // 6-8 player brackets end at week 16
  } else {
    return 17; // 9-10 player brackets end at week 17
  }
}

// Function to check if the pool is in the correct week for initialization
function isCorrectInitializationWeek(currentWeek: number): boolean {
  return currentWeek === 14; // All playoff brackets start in week 14
}

// Helper function to determine initial player position based on seed and player count
function getInitialPosition(seed: number, totalPlayers: number): string {
  // 6-player bracket positions
  if (totalPlayers === 6) {
    switch(seed) {
      case 1: return "R2_M1_P2"; // Seed 1 has a bye in Week 14
      case 2: return "R2_M2_P2"; // Seed 2 has a bye in Week 14
      case 3: return "R1_M1_P1"; // Seed 3 plays in Week 14 
      case 4: return "R1_M2_P1"; // Seed 4 plays in Week 14
      case 5: return "R1_M2_P2"; // Seed 5 plays in Week 14
      case 6: return "R1_M1_P2"; // Seed 6 plays in Week 14
      default: return "";
    }
  }

  // 7-player bracket positions
// 7-player bracket positions
// 7-player bracket positions
if (totalPlayers === 7) {
  switch(seed) {
    case 1: return "R2_M1_P1"; // Seed 1 has a bye in Week 14
    case 2: return "R1_M1_P1"; // Seed 2 plays Seed 7
    case 7: return "R1_M1_P2"; // Seed 7 plays Seed 2
    case 3: return "R1_M2_P1"; // Seed 3 plays Seed 6
    case 6: return "R1_M2_P2"; // Seed 6 plays Seed 3
    case 4: return "R1_M3_P1"; // Seed 4 plays Seed 5
    case 5: return "R1_M3_P2"; // Seed 5 plays Seed 4
    default: return "";
  }
}

  // 8-player bracket positions (quarterfinals)
// 8-player bracket positions
if (totalPlayers === 8) {
  switch(seed) {
    case 1: return "R1_M1_P1"; // Seed 1 plays seed 8 in Week 14
    case 8: return "R1_M1_P2"; // Seed 8 plays seed 1 in Week 14
    case 4: return "R1_M2_P1"; // Seed 4 plays seed 5 in Week 14
    case 5: return "R1_M2_P2"; // Seed 5 plays seed 4 in Week 14
    case 3: return "R1_M3_P1"; // Seed 3 plays seed 6 in Week 14
    case 6: return "R1_M3_P2"; // Seed 6 plays seed 3 in Week 14
    case 2: return "R1_M4_P1"; // Seed 2 plays seed 7 in Week 14
    case 7: return "R1_M4_P2"; // Seed 7 plays seed 2 in Week 14
    default: return "";
  }
}

  // 9-10 player bracket (follow original logic)
  // More complex seeding with First Round and Quarterfinals
 // 9-player bracket positions
if (totalPlayers === 9) {
  switch(seed) {
    case 1: return "R2_M1_P1"; // Seed 1 has a bye in Week 14
    case 8: return "R1_M1_P1"; // Seed 8 plays in Week 14 vs 9
    case 9: return "R1_M1_P2"; // Seed 9 plays in Week 14 vs 8
    case 4: return "R2_M2_P1"; // Seed 4 has a bye in Week 14
    case 5: return "R2_M2_P2"; // Seed 5 has a bye in Week 14
    case 2: return "R2_M3_P1"; // Seed 2 has a bye in Week 14
    case 7: return "R2_M3_P2"; // Seed 7 has a bye in Week 14
    case 3: return "R2_M4_P1"; // Seed 3 has a bye in Week 14
    case 6: return "R2_M4_P2"; // Seed 6 has a bye in Week 14
    default: return "";
  }
}

// 10-player bracket positions
if (totalPlayers === 10) {
  switch(seed) {
    case 1: return "R2_M1_P1"; // Seed 1 has a bye in Week 14
    case 8: return "R1_M1_P1"; // Seed 8 plays in Week 14 vs 9
    case 9: return "R1_M1_P2"; // Seed 9 plays in Week 14 vs 8
    case 4: return "R2_M2_P1"; // Seed 4 has a bye in Week 14
    case 5: return "R2_M2_P2"; // Seed 5 has a bye in Week 14
    case 3: return "R2_M3_P1"; // Seed 3 has a bye in Week 14
    case 6: return "R2_M3_P2"; // Seed 6 has a bye in Week 14
    case 2: return "R2_M4_P1"; // Seed 2 has a bye in Week 14
    case 7: return "R1_M2_P1"; // Seed 7 plays in Week 14 vs 10
    case 10: return "R1_M2_P2"; // Seed 10 plays in Week 14 vs 7
    default: return "";
  }
}

  return "";
}

// Check if a player has a bye based on seed and total players
function hasByeForSeed(seed: number, totalPlayers: number): boolean {
  // For 10 players: Seeds 1-6 have byes in Week 14
  if (totalPlayers === 10) {
    return seed <= 6;
  }
  
  // For 9 players: Seeds 1-7 have byes
  if (totalPlayers === 9) {
    return seed <= 7;
  }
  
  // For 8 players: No byes - all play in quarterfinals
  if (totalPlayers === 8) {
    return false;
  }
  
  // For 7 players: Only seed 1 has a bye
  if (totalPlayers === 7) {
    return seed === 1;
  }
  
  // For 6 players: Seeds 1-2 have byes
  if (totalPlayers === 6) {
    return seed <= 2;
  }
  
  return false;
}
export default router;
