import express from 'express';
import userRoutes from '../src/routes/userRoutes';
import path from 'path';
import picksRoutes from '../src/routes/picksRoutes'; 
import bodyParser from 'body-parser';
import profileRoutes from '../src/routes/profileRoutes';
import poolRoutes from '../src/routes/poolRoutes';
import InjuryRoutes from '../src/routes/InjuryRoutes';
import mongoose from 'mongoose';
import timeWindowRoutes from '../src/routes/timeWindowRoutes';
import weekRoutes from '../src/routes/weekRoutes';
import '../src/microservices/websocket';  
import '../src/microservices/scheduler';
import playoffRoutes from '../src/routes/playoffRoutes'
import dashRoutes from '../src/routes/dashRoutes'
import { fetchNFLschedule } from '../src/Controllers/dashController';
import { fetchTeamsAndWeeks, fetchGamesByFilter } from '../src/Controllers/dashController';
import golfRoutes from '../src/routes/golfRoutes'
import { connectToDatabase } from '../src/microservices/connectDB';
import {autoSelectBestGolferForUser} from '../src/routes/golfRoutes';
import notificationsRoutes from '../src/routes/notificationsRoutes';
require("dotenv").config();
import dotenv from 'dotenv';
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-username');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});
// 1. Middleware to parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require('dotenv').config();

app.use(express.static('public/logos/'));
app.use(express.static('public/infoPics/'));
app.use(express.static('public/CallingCards/'));
app.use(express.static('public/halloweenPics/'));
app.use('/api/notifications', notificationsRoutes);
// 2. Logging middleware\
/*
app.use((req: Request, res: Response, next: NextFunction) => {
  next();
});
*/
// Middleware for logging incoming requests
app.use((req, res, next) => {
 // console.log(`Request URL: ${req.url}`);
  next();
});


// 3. Body parser
app.use(bodyParser.json());

// 4. URL encoded parser
app.use(express.urlencoded({ extended: true }));

// 5. API routes
/*app.get('/', (req, res) => {
  res.send('Welcome to Pick 6!');
}); */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));

});

// Add logging to confirm route registration

app.use('/users', userRoutes);


app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(picksRoutes);
app.use('/api', dashRoutes);
app.use(profileRoutes);
app.use(weekRoutes);
app.use('/api', InjuryRoutes);
app.use('/api', golfRoutes);
app.use('/api', timeWindowRoutes)
app.use(playoffRoutes)
app.post('/api/fetchTeamsAndWeeks', fetchTeamsAndWeeks);
app.post('/api/fetchGamesByFilter', fetchGamesByFilter);

app.post('/api/fetchNFLSchedule', fetchNFLschedule);
app.use('/uploads', express.static('uploads'));
app.use('/pools', poolRoutes);
app.use('/', poolRoutes);   
// 6. Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


app.use(bodyParser.json({ limit: '10mb' })); // Reduced from 500mb
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));



app.get('/', (req, res) => {
// req.session.isAuth = true;
})


const options = {
  serverSelectionTimeoutMS: 5000, // Reduce the time the driver waits for server selection
  socketTimeoutMS: 45000, // Adjust socket timeout 
};
//console.log('MONGODB_URI:', process.env.MONGODB_URI);
const mongoUri = process.env.MONGODB_URI as string;
mongoose.connect(mongoUri, options);

/*
// Draft timer checker - runs every 5 seconds
setInterval(async () => {
  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      const golfDraftStateCollection = database.collection('golfDraftState');
      
      // Find all active drafts with expired turns
      const now = new Date();
      const activeDrafts = await golfDraftStateCollection.find({
          isComplete: false,
          turnExpiresAt: { $lt: now }  // Expired turns
      }).toArray();
      
      for (const draft of activeDrafts) {
          const pool = await poolsCollection.findOne({ 
              name: draft.poolName, 
              mode: 'golf', 
              draftTime: true 
          });
          
          if (!pool) continue; // Skip if pool not found or not in draft mode
          
          console.log(`Auto-selecting for expired turn in pool: ${draft.poolName}`);
          
          // Get current user for this turn
          let currentUser = 'Unknown';
          const numberOfDrafters = draft.draftOrder ? draft.draftOrder.length : 0;
          
          if (draft.draftOrder && numberOfDrafters > 0) {
              const isEvenRound = draft.currentRound % 2 === 0;
              
              if (isEvenRound) {
                  const reverseIndex = numberOfDrafters - 1 - draft.currentTurn;
                  if (reverseIndex >= 0 && reverseIndex < numberOfDrafters) {
                      currentUser = draft.draftOrder[reverseIndex];
                  }
              } else {
                  if (draft.currentTurn >= 0 && draft.currentTurn < numberOfDrafters) {
                      currentUser = draft.draftOrder[draft.currentTurn];
                  }
              }
          }
          
          // Auto-select the best available golfer
          await autoSelectBestGolferForUser(currentUser, draft.poolName, draft.currentRound);
      }
  } catch (error) {
      console.error('Error in draft timer checker:', error);
  }
}, 5000);*/


 setInterval(() => {
    console.log('Mongoose connections:', mongoose.connections.length);
    console.log('Connection state:', mongoose.connection.readyState);
    console.log('Memory usage:', process.memoryUsage());
    
    // Check if gameScores arrays exist and their sizes
    try {
      console.log('Checking for memory-consuming global variables...');
      
      // Actually check what's in those gameScores arrays
      try {
        const nflServices = require('../src/microservices/nflServices');
        if (nflServices.getGameScoresInfo) {
          const gameScoresInfo = nflServices.getGameScoresInfo();
          console.log('🏈 NFL gameScores array info:', gameScoresInfo);
          console.log(`🏈 Memory used by gameScores: ~${Math.round(gameScoresInfo.memoryEstimate / 1024)} KB`);
        }
      } catch (nflError: any) {
        console.log('Could not access NFL Services:', nflError.message);
      }

      try {
        const scheduler = require('../src/microservices/scheduler');
        console.log('Scheduler loaded - checking for gameScores array...');
      } catch (schedError: any) {
        console.log('Could not access Scheduler:', schedError.message);
      }

      // Check what modules are actually loaded
      const loadedModules = Object.keys(require.cache).filter(key => 
        key.includes('microservices') || key.includes('nflServices') || key.includes('serverUtils')
      );
      console.log('Loaded microservice modules:', loadedModules.length);
      
      // List the actual modules
      loadedModules.forEach((module, index) => {
        const shortPath = module.split('\\').pop() || module.split('/').pop();
        console.log(`${index + 1}. ${shortPath}`);
      });
      
      // Check for other potential memory hogs
      console.log('Total require.cache modules loaded:', Object.keys(require.cache).length);
      
      // Find the biggest module categories
      const moduleCategories = {};
      Object.keys(require.cache).forEach(modulePath => {
        if (modulePath.includes('node_modules')) {
          const packageName = modulePath.split('node_modules')[1].split('/')[1] || modulePath.split('node_modules')[1].split('\\')[1];
          if (packageName) {
            moduleCategories[packageName] = (moduleCategories[packageName] || 0) + 1;
          }
        }
      });
      
      // Show top 10 packages by module count
      const sortedPackages = Object.entries(moduleCategories)
        .sort(([,a], [,b]) => (b as number) - (a as number)) 
        .slice(0, 10);
        
      console.log('📦 Top packages by module count:');
      sortedPackages.forEach(([pkg, count]) => {
        console.log(`   ${pkg}: ${count} modules`);
      });
      
      // Check Node.js process info
      const used = process.memoryUsage();
      console.log('Detailed memory breakdown:');
      for (let key in used) {
        console.log(`${key}: ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
      }
      
    } catch (e: any) {
      console.log('Could not check memory details:', e.message);
    }
  }, 3000);


export default app;
