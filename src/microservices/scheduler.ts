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
import{mockFetchNFLScores, fetchNFLScores, fetchNFLDataOneWeekOut} from './nflServices';
import { fetchAndSaveMastersData, fetchAndSavePGAChampionshipData, fetchAndSaveUSOpenData, fetchAndSavePGAChampionshipOdds } from './golfServices';
import { saveVendingMachinePoints } from './serverUtils';
let gameScores: any[] = [];

//saveVendingMachinePoints()
/*
// Set up cron job to run weekly
cron.schedule('41 14 * * 2', () => {
  console.log('Running weekly PGA Championship FanDuel odds update...');
  fetchAndSavePGAChampionshipOdds();
});*/




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


cron.schedule('43 11 * * 5', () => {
  console.log("It's Thursday 4:00 PM");
  saveSurvivorPicks();
});

cron.schedule('32 10 * * 5', () => {
  console.log("Check");
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

cron.schedule('*/20 11-23 15-18 5 *', () => {
  console.log('Fetching PGA Championship data - runs every 20 minutes');
  fetchAndSavePGAChampionshipData();
});

cron.schedule('*/20 11-23 12-15 6 *', () => {
  console.log('Fetching US Open data - runs every 20 minutes during tournament days');
 fetchAndSaveUSOpenData();
});
