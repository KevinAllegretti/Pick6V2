// src/routes/poolRoutes.ts

import express from 'express';
import { createPool, joinPoolByName, leavePool} from '../Controllers/poolController';
import Pool from '../models/Pool';
import { connectToDatabase } from '../microservices/connectDB';
import { isConstructorDeclaration } from 'typescript';
import { ObjectId } from 'mongodb';
//import { ObjectId } from 'mongodb';

const router = express.Router();

interface PoolMember {
    user: ObjectId;
    username: string;
    points: number;
    picks: never[];
    win: number;
    loss: number;
    push: number;
    orderIndex: number;
}


async function getNextOrderIndex(username: string, database: any) {
  const poolsCollection = database.collection('pools');
  const userPools = await poolsCollection.find({
      'members.username': username.toLowerCase()
  }).toArray();
  
  return userPools.length; // New pools get added at the end
}
router.post('/create', async (req, res) => {
    try {
        const { name, isPrivate, adminUsername, mode, password } = req.body;

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");
        const poolsCollection = db.collection("pools");

        const admin = await usersCollection.findOne({ username: adminUsername.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Get current pools and their order indices
        const userPools = await poolsCollection.find({
            'members.username': adminUsername.toLowerCase()
        }).toArray();

        // Update Global pool's orderIndex to be the highest
        await poolsCollection.updateOne(
            { 
                name: "Global",
                'members.username': adminUsername.toLowerCase()
            },
            { $set: { 'members.$.orderIndex': userPools.length } }
        );

        // Shift all other non-Global pools up by 1
        await Promise.all(userPools.map(pool => {
            if (pool.name !== "Global") {
                return poolsCollection.updateOne(
                    {
                        name: pool.name,
                        'members.username': adminUsername.toLowerCase()
                    },
                    { $inc: { 'members.$.orderIndex': 1 } }
                );
            }
        }));

        const newPool = {
            name,
            isPrivate,
            admin: admin._id,
            adminUsername: adminUsername.toLowerCase(),
            password: isPrivate ? password : undefined,
            members: [{
                user: admin._id,
                username: adminUsername.toLowerCase(),
                points: 0,
                picks: [],
                win: 0,
                loss: 0,
                push: 0,
                orderIndex: 0
            }],
            mode: mode || 'classic'
        };

        const result = await poolsCollection.insertOne(newPool);
        
        res.status(201).json({ 
            message: 'Pool created successfully',
            pool: {
                ...newPool,
                _id: result.insertedId
            }
        });

    } catch (error:any) {
        console.error('Error creating pool:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Pool name already exists' });
        }
        res.status(500).json({ message: 'Error creating pool', error });
    }
});

router.post('/joinByName', async (req, res) => {
    try {
        const { poolName, username, poolPassword } = req.body;
        console.log({ poolName, username, poolPassword });
        
        const db = await connectToDatabase();
        const usersCollection = db.collection("users");
        const poolsCollection = db.collection("pools");

        const user = await usersCollection.findOne({ username: username.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const pool = await poolsCollection.findOne({ name: poolName });
        if (!pool) {
            return res.status(404).json({ message: 'Pool not found' });
        }

        if (pool.isPrivate && pool.password) {
            if (poolPassword !== pool.password) {
                return res.status(401).json({ message: 'Incorrect password' });
            }
        }

        const isMemberAlready = pool.members.some(member => 
            member.username.toLowerCase() === username.toLowerCase()
        );
        
        if (!isMemberAlready) {
            // Get current pools and their order indices
            const userPools = await poolsCollection.find({
                'members.username': username.toLowerCase()
            }).toArray();

            // Update Global pool's orderIndex to be the highest
            await poolsCollection.updateOne(
                { 
                    name: "Global",
                    'members.username': username.toLowerCase()
                },
                { $set: { 'members.$.orderIndex': userPools.length } }
            );

            // Shift all other non-Global pools up by 1
            await Promise.all(userPools.map(pool => {
                if (pool.name !== "Global") {
                    return poolsCollection.updateOne(
                        {
                            name: pool.name,
                            'members.username': username.toLowerCase()
                        },
                        { $inc: { 'members.$.orderIndex': 1 } }
                    );
                }
            }));

            // New member gets orderIndex 0
            const newMember = {
                user: user._id,
                username: username.toLowerCase(),
                points: 0,
                picks: [] as never[],
                win: 0,
                loss: 0,
                push: 0,
                orderIndex: 0
            };

            // Add member to pool with type assertion
            await poolsCollection.updateOne(
                { name: poolName },
                { $push: { members: newMember } } as any
            );
        }

        // Fetch the updated pool to return
        const updatedPool = await poolsCollection.findOne({ name: poolName });

        res.status(200).json({ 
            message: 'Joined pool successfully', 
            pool: {
                ...updatedPool,
                mode: updatedPool?.mode
            }
        });

    } catch (error) {
        console.error('Error joining pool:', error);
        res.status(500).json({ message: 'Error joining pool', error });
    }
});
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

        // Get all user's pools and current indices
        const userPools = await poolsCollection.find({
            'members.username': username.toLowerCase()
        }).toArray();

        // Get current pool and its index
        const currentPool = userPools.find(p => p.name === poolName);
        if (!currentPool) {
            return res.status(404).json({ success: false, message: 'Pool not found' });
        }

        const currentMember = currentPool.members.find(m => 
            m.username.toLowerCase() === username.toLowerCase()
        );
        
        const currentIndex = currentMember.orderIndex;
        let newIndex;

        if (direction === 'up' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < userPools.length - 1) {
            newIndex = currentIndex + 1;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid move direction' });
        }

        // Find the pool to swap with
        const otherPool = userPools.find(p => 
            p.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase() && 
                m.orderIndex === newIndex
            )
        );

        if (!otherPool) {
            return res.status(404).json({ success: false, message: 'No pool found to swap with' });
        }

        // Update both pools' orderIndices
        await poolsCollection.updateOne(
            { 
                name: poolName,
                'members.username': username.toLowerCase()
            },
            { $set: { 'members.$.orderIndex': newIndex } }
        );

        await poolsCollection.updateOne(
            { 
                name: otherPool.name,
                'members.username': username.toLowerCase()
            },
            { $set: { 'members.$.orderIndex': currentIndex } }
        );

        res.json({ 
            success: true, 
            message: 'Pool order updated successfully'
        });

    } catch (error:any) {
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
