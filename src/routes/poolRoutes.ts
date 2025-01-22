// src/routes/poolRoutes.ts

import express from 'express';
import { createPool, joinPoolByName, leavePool} from '../Controllers/poolController';
import Pool from '../models/Pool';
import { connectToDatabase } from '../microservices/connectDB';
import { isConstructorDeclaration } from 'typescript';
//import { ObjectId } from 'mongodb';

const router = express.Router();

async function getNextOrderIndex(username: string, database: any) {
  const poolsCollection = database.collection('pools');
  const userPools = await poolsCollection.find({
      'members.username': username.toLowerCase()
  }).toArray();
  
  return userPools.length; // New pools get added at the end
}
// Route to create a new pool
router.post('/create', createPool);

// Route to handle join pool requests
router.post('/joinByName', joinPoolByName);
// Route for admins to manage join requests

// Route to leave a pool
router.post('/leave/:username/:poolName', leavePool); // Add the leave pool route


router.get('/get-all', async (req, res) => {
  try {
    const pools = await Pool.find();
    res.json(pools.map(pool => pool.toObject())); // 'adminUsername' is now a direct property of the pool object
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pools', error });
  }
});
router.post('/reorder', async (req, res) => {
  const { username, poolName, direction } = req.body;
  
  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      // Get all user's pools
      const pools = await poolsCollection.find({
          'members.username': username.toLowerCase()
      }).toArray();

      // Sort by current orderIndex
      pools.sort((a, b) => {
          const memberA = a.members.find(m => m.username.toLowerCase() === username.toLowerCase());
          const memberB = b.members.find(m => m.username.toLowerCase() === username.toLowerCase());
          return (memberA?.orderIndex || 0) - (memberB?.orderIndex || 0);
      });

      // Find current pool index
      const currentIndex = pools.findIndex(p => p.name === poolName);
      if (currentIndex === -1) {
          return res.status(404).json({ success: false, message: 'Pool not found' });
      }

      // Calculate new index
      let newIndex;
      if (direction === 'up' && currentIndex > 0) {
          newIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < pools.length - 1) {
          newIndex = currentIndex + 1;
      } else {
          return res.status(400).json({ success: false, message: 'Invalid move direction' });
      }

      // Swap orderIndexes
      const pool1 = pools[currentIndex];
      const pool2 = pools[newIndex];
      const member1 = pool1.members.find(m => m.username.toLowerCase() === username.toLowerCase());
      const member2 = pool2.members.find(m => m.username.toLowerCase() === username.toLowerCase());

      if (!member1 || !member2) {
          return res.status(404).json({ success: false, message: 'Member not found in pools' });
      }

      // Update both pools
      await poolsCollection.updateOne(
          { 
              name: poolName,
              'members.username': username.toLowerCase()
          },
          { $set: { 'members.$.orderIndex': member2.orderIndex } }
      );

      await poolsCollection.updateOne(
          { 
              name: pools[newIndex].name,
              'members.username': username.toLowerCase()
          },
          { $set: { 'members.$.orderIndex': member1.orderIndex } }
      );

      res.json({ 
          success: true, 
          message: 'Pool order updated successfully',
          newOrder: pools.map(p => p.name)
      });

  } catch (error: any) {
      console.error('Error reordering pools:', error);
      res.status(500).json({ success: false, message: error.message });
  }
});
// In poolRoutes.ts
router.get('/userPools/:username', async (req, res) => {
  try {
      const username = req.params.username.toLowerCase();
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      // Get all pools for user
      const pools = await poolsCollection.find({
          'members.username': username
      }).toArray();

      // Sort pools in backend before sending
      const sortedPools = pools.sort((a, b) => {
          const memberA = a.members.find(m => m.username.toLowerCase() === username);
          const memberB = b.members.find(m => m.username.toLowerCase() === username);
          
          // Ensure orderIndex exists, use MAX_SAFE_INTEGER if missing
          const orderA = typeof memberA?.orderIndex === 'number' ? memberA.orderIndex : Number.MAX_SAFE_INTEGER;
          const orderB = typeof memberB?.orderIndex === 'number' ? memberB.orderIndex : Number.MAX_SAFE_INTEGER;
          
          if (orderA !== orderB) {
              return orderA - orderB;
          }
          
          // Secondary sort by pool name
          return a.name.localeCompare(b.name);
      });

      // Send sorted pools with order validation
      res.json(sortedPools.map((pool, index) => ({
          ...pool,
          displayOrder: index, // Add explicit display order
          members: pool.members.map(member => ({
              ...member,
              orderIndex: member.username.toLowerCase() === username ? 
                  (member.orderIndex ?? index) : member.orderIndex
          }))
      })));

  } catch (error) {
      console.error('Error fetching pools for user:', error);
      res.status(500).send('Internal server error');
  }
});

router.delete('/delete/:poolName', async (req, res) => {
  const poolName = req.params.poolName//.toLowerCase();
  console.log(`Received delete request for pool with name: '${poolName}'`);

  const usernameHeader = req.headers['x-username'];
  if (typeof usernameHeader !== 'string' || !usernameHeader) {
    console.log('Username header is missing or not a string');
    return res.status(400).json({ message: 'Username header is required' });
  }

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const poolsCollection = db.collection('pools');
    const username = usernameHeader.toLowerCase();
    
    console.log(`Looking for admin user with username: '${username}'`);
    const adminUser = await usersCollection.findOne({ username });
    if (!adminUser) {
      console.log(`Admin user '${username}' not found.`);
      return res.status(404).json({ message: 'Admin user not found' });
    }
    
    console.log(`Looking for pool with name: '${poolName}'`);
    const pool = await poolsCollection.findOne({ name: poolName });
    if (!pool) {
      console.log(`Pool with name '${poolName}' not found.`);
      return res.status(404).json({ message: 'Pool not found' });
    }
    
    console.log(`Found pool with name '${poolName}':`, pool);
    if (pool.admin.toString() !== adminUser._id.toString()) {
      console.log(`User '${username}' is not authorized to delete pool with name '${poolName}'`);
      return res.status(403).json({ message: 'Not authorized to delete this pool' });
    }

    console.log(`Attempting to delete pool with name '${poolName}'`);
    const result = await poolsCollection.deleteOne({ name: poolName });
    console.log(`Delete result for pool with name '${poolName}':`, result);

    if (result.deletedCount === 0) {
      console.log(`No pool was deleted for name '${poolName}'`);
      return res.status(404).json({ message: 'No pool was deleted' });
    }

    console.log(`Pool with name '${poolName}' deleted successfully.`);
    res.json({ message: 'Pool deleted successfully' });
  } catch (error) {
    console.error(`Error deleting pool with name '${poolName}':`, error);
    res.status(500).json({ message: 'Error deleting pool', error });
  }
});

router.post('/updateUserPointsInPoolByName', async (req, res) => {
  const { username, additionalPoints, poolName } = req.body; // Using additionalPoints directly sent from client
  console.log("Received data for updating points:", req.body);

  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      // Attempt to increment the points for the specified user within the specified pool
      const updateResult = await poolsCollection.updateOne(
          { name: poolName, "members.username": username },
          { $inc: { "members.$.points": additionalPoints } }  // Directly increment points
      );

      /*
      if (updateResult.matchedCount === 0) {
          return res.status(404).json({ success: false, message: "No matching pool or user found" });
      } */
      if (updateResult.modifiedCount === 0) {
          return res.status(406).json({ success: false, message: "No points updated, user might already have the updated value" });
      }

      res.json({ success: true, message: "User points updated successfully in pool" });
  } catch (error:any) {
      console.error("Error updating points:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/setUserPointsInPoolByName', async (req, res) => {
  const { username, points, poolName } = req.body;
  console.log("Received data for setting points:", req.body);

  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      // Set the points for the specified user in the specified pool
      const updateResult = await poolsCollection.updateOne(
          { name: poolName, "members.username": username },
          { $set: { "members.$.points": points } }  // Directly set points to the new value
      );

      if (updateResult.matchedCount === 0) {
          return res.status(404).json({ success: false, message: "No matching pool or user found" });
      }
      if (updateResult.modifiedCount === 0) {
          return res.status(406).json({ success: false, message: "No points updated, possible data issue or unchanged value" });
      }

      res.json({ success: true, message: "User points set successfully in pool" });
  } catch (error:any) {
      console.error("Error setting points:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/updateUserStatsInPoolByName', async (req, res) => {
  const { username, poolName, winIncrement, lossIncrement, pushIncrement } = req.body;
  //console.log("Received data for updating stats:", req.body);

  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      const updateResult = await poolsCollection.updateOne(
          { name: poolName, "members.username": username },
          { 
              $inc: { 
                  "members.$.win": winIncrement,
                  "members.$.loss": lossIncrement,
                  "members.$.push": pushIncrement
              } 
          }
      );

      if (updateResult.modifiedCount === 0) {
          return res.status(406).json({ success: false, message: "No stats updated, possible data issue or unchanged value" });
      }

      res.json({ success: true, message: "User stats updated successfully in pool" });
  } catch (error:any) {
      console.error("Error updating stats:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/resetUserStatsInPoolByName', async (req, res) => {
  const { username, poolName } = req.body;
  //console.log("Received data for resetting stats:", req.body);

  try {
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      const updateResult = await poolsCollection.updateOne(
          { name: poolName, "members.username": username },
          { 
              $set: { 
                  "members.$.win": 0,
                  "members.$.loss": 0,
                  "members.$.push": 0 
              } 
          }
      );

      if (updateResult.matchedCount === 0) {
          return res.status(404).json({ success: false, message: "No matching pool or user found" });
      }

      res.json({ success: true, message: "User stats reset successfully in pool" });
  } catch (error:any) {
      console.error("Error resetting stats:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/getChatMessages', async (req, res) => {
  const { poolName } = req.query;
  //console.log("Fetching chat messages for pool:", poolName);

  try {
      const database = await connectToDatabase();
      const chatsCollection = database.collection('chats');

      const query = poolName ? { poolName } : { poolName: null };
      const messages = await chatsCollection.find(query).sort({ timestamp: 1 }).toArray();
      res.json({ success: true, messages });
  } catch (error:any) {
      console.error("Error fetching chat messages:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sendChatMessage', async (req, res) => {
  const { username, poolName, message } = req.body;
  console.log("Received chat message:", req.body);

  try {
      const database = await connectToDatabase();
      const chatsCollection = database.collection('chats');

      const newMessage = {
          username,
          poolName: poolName || null,
          message,
          timestamp: new Date()
      };

      await chatsCollection.insertOne(newMessage);
      res.json({ success: true, message: "Message sent successfully" });
  } catch (error:any) {
      console.error("Error sending chat message:", error);
      res.status(500).json({ success: false, message: error.message });
  }
});

// In your routes file (src/routes/poolRoutes.ts)
router.get('/userPoolInfo/:username', async (req, res) => {
  try {
      const username = req.params.username.toLowerCase();
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');

      // Find pools where the members array contains the username
      const pools = await poolsCollection.find({
          'members.username': username
      }).toArray();

      // Extract relevant information
      const poolInfo = pools.map(pool => {
          const member = pool.members.find(member => member.username === username);
          return {
              poolName: pool.name,
              rank: pool.members.sort((a, b) => b.points - a.points).findIndex(m => m.username === username) + 1,
              points: member.points
          };
      });

      res.json(poolInfo);
  } catch (error:any) {
      console.error('Error fetching pool information for user:', error);
      res.status(500).send('Internal server error');
  }
});

export default router;
