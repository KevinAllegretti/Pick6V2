// src/routes/poolRoutes.ts

import express from 'express';
import {leavePool} from '../Controllers/poolController';
import Pool from '../models/Pool';
import { connectToDatabase } from '../microservices/connectDB';
import { getCurrentWeek } from '../microservices/serverUtils';
import { ObjectId } from 'mongodb';
import { saveVendingMachinePoints, getVendingSpotlightData } from '../microservices/serverUtils';

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


// Function to get next available index for new pool/member
async function getNextOrderIndex(poolsCollection: any, username: string) {
    const userPools = await poolsCollection.find({
        'members.username': username.toLowerCase()
    }).toArray();
    
    if (userPools.length === 0) return 0;
    
    const maxIndex = Math.max(...userPools.map(pool => {
        const member = pool.members.find(m => 
            m.username.toLowerCase() === username.toLowerCase()
        );
        return member?.orderIndex ?? -1;
    }));
    
    return maxIndex + 1;
}


interface BaseMember {
    user: ObjectId;
    username: string;
    orderIndex: number;
}

// Classic pool member type
interface ClassicMember extends BaseMember {
    points: number;
    picks: never[];
    win: number;
    loss: number;
    push: number;
}

// Survivor pool member type
interface SurvivorMember extends BaseMember {
    isEliminated: boolean;
}

// Update the createMemberByMode function to include golf mode
const createMemberByMode = (user: any, username: string, orderIndex: number, mode: 'classic' | 'survivor' | 'golf'): ClassicMember | SurvivorMember | GolfMember => {
    const baseMember = {
        user: user._id,
        username: username.toLowerCase(),
        orderIndex,
    };

    if (mode === 'survivor') {
        return {
            ...baseMember,
            isEliminated: false
        };
    } else if (mode === 'golf') {
        return {
            ...baseMember,
            picks: [],
            golferSelections: []
        };
    }

    return {
        ...baseMember,
        points: 0,
        picks: [],
        win: 0,
        loss: 0,
        push: 0
    };
};

// Define GolfMember interface
interface GolfMember extends BaseMember {
    picks: any[];
    golferSelections: any[];
}

/*
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

        // Create admin member with appropriate schema based on mode
        const adminMember = createMemberByMode(admin, adminUsername, 0, mode || 'classic');

        const newPool = {
            name,
            isPrivate,
            admin: admin._id,
            adminUsername: adminUsername.toLowerCase(),
            password: isPrivate ? password : undefined,
            members: [adminMember],
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
});*/

/*
router.post('/create', async (req, res) => {
    try {
        // Add hasPlayoffs to the destructured properties
        const { name, isPrivate, adminUsername, mode, password, hasPlayoffs } = req.body;

        // Log the incoming request
        console.log('Creating pool with params:', { 
            name, 
            isPrivate, 
            adminUsername, 
            mode, 
            hasPassword: !!password, 
            hasPlayoffs 
        });

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");
        const poolsCollection = db.collection("pools");

        const admin = await usersCollection.findOne({ username: adminUsername.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Create admin member with appropriate schema based on mode
        const adminMember = {
            user: admin._id,
            username: adminUsername.toLowerCase(),
            points: 0,
            picks: [],
            win: 0,
            loss: 0,
            push: 0,
            orderIndex: 0
        };

        // Include hasPlayoffs in the new pool object
        const newPool = {
            name,
            isPrivate,
            admin: admin._id,
            adminUsername: adminUsername.toLowerCase(),
            password: isPrivate ? password : undefined,
            members: [adminMember],
            mode: mode || 'classic',
            // Only set hasPlayoffs when mode is classic
            hasPlayoffs: mode === 'classic' ? !!hasPlayoffs : false
        };

        console.log('Creating pool with model:', {
            ...newPool,
            password: newPool.password ? '***' : undefined // Hide password in logs
        });

        const result = await poolsCollection.insertOne(newPool);
        
        // After creating the pool, normalize all indices
        await normalizePoolOrder(poolsCollection, adminUsername);

        // Log the created pool ID and whether hasPlayoffs was set
        console.log('Pool created with ID:', result.insertedId, 'hasPlayoffs:', !!hasPlayoffs);

        res.status(201).json({ 
            message: 'Pool created successfully',
            pool: {
                ...newPool,
                _id: result.insertedId
            }
        });

    } catch (error: any) {
        console.error('Error creating pool:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Pool name already exists' });
        }
        res.status(500).json({ message: 'Error creating pool', error });
    }
});*/

router.post('/create', async (req, res) => {
    try {
        const { name, isPrivate, adminUsername, mode, password, hasPlayoffs } = req.body;

        // Log the incoming request
        console.log('Creating pool with params:', { 
            name, 
            isPrivate, 
            adminUsername, 
            mode, 
            hasPassword: !!password, 
            hasPlayoffs 
        });

        const db = await connectToDatabase();
        const usersCollection = db.collection("users");
        const poolsCollection = db.collection("pools");

        const admin = await usersCollection.findOne({ username: adminUsername.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ message: 'Admin user not found' });
        }

        // Create admin member with appropriate schema based on mode
        const adminMember = createMemberByMode(admin, adminUsername, 0, mode || 'classic');

        // Base pool object
        const newPool = {
            name,
            isPrivate,
            admin: admin._id,
            adminUsername: adminUsername.toLowerCase(),
            password: isPrivate ? password : undefined,
            members: [adminMember],
            mode: mode || 'classic',
            // Only set hasPlayoffs when mode is classic
            hasPlayoffs: mode === 'classic' ? !!hasPlayoffs : false
        };

        // Add golf-specific fields if needed
        if (mode === 'golf') {
            Object.assign(newPool, {
                idleTime: true,      // Start in idle time (users can join)
                draftTime: false,    // Not in draft time yet
                playTime: false,     // Not in play time yet
                draftOrder: []       // Initialize empty draft order
            });
        }

        console.log('Creating pool with model:', {
            ...newPool,
            password: newPool.password ? '***' : undefined // Hide password in logs
        });

        const result = await poolsCollection.insertOne(newPool);
        
        // After creating the pool, normalize all indices
        await normalizePoolOrder(poolsCollection, adminUsername);

        // Log the created pool ID
        console.log('Pool created with ID:', result.insertedId);

        res.status(201).json({ 
            message: 'Pool created successfully',
            pool: {
                ...newPool,
                _id: result.insertedId
            }
        });

    } catch (error: any) {
        console.error('Error creating pool:', error);
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Pool name already exists' });
        }
        res.status(500).json({ message: 'Error creating pool', error });
    }
});

async function checkEliminationStatus(poolsCollection: any, poolName: string, username: string): Promise<boolean> {
    const pool = await poolsCollection.findOne({
        name: poolName,
        mode: 'survivor',
        'eliminatedMembers.username': username.toLowerCase()
    });
    return pool !== null;
}
/*
router.post('/joinByName', async (req, res) => {
    try {
        const { poolName, username, poolPassword } = req.body;
        
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

            // Create member based on pool mode
            const newMember = createMemberByMode(user, username, 0, pool.mode);

            // If survivor pool, check for previous elimination
            if (pool.mode === 'survivor') {
                const isEliminated = await checkEliminationStatus(poolsCollection, poolName, username);
                if (isEliminated) {
                    (newMember as SurvivorMember).isEliminated = true;
                }
            }

            await poolsCollection.updateOne(
                { name: poolName },
                { $push: { members: newMember } as any}
            );
        }

        const updatedPool = await poolsCollection.findOne({ name: poolName });
        res.status(200).json({ 
            message: 'Joined pool successfully', 
            pool: updatedPool
        });

    } catch (error) {
        console.error('Error joining pool:', error);
        res.status(500).json({ message: 'Error joining pool', error });
    }
});*/

// Add this to poolRoutes.ts
router.post('/toggleSurvivorLock', async (req, res) => {
    try {
      const { poolName, isLocked } = req.body;
      const database = await connectToDatabase();
      const poolsCollection = database.collection('pools');
      
      // Update the pool's lock status, but ONLY for survivor pools
      const result = await poolsCollection.updateOne(
        { name: poolName, mode: 'survivor' }, // Explicitly check for survivor mode
        { $set: { isLocked } }
      );
      
      if (result.matchedCount === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Pool not found or not a survivor pool' 
        });
      }
      
      res.json({ 
        success: true, 
        message: `Survivor pool ${isLocked ? 'locked' : 'unlocked'} successfully` 
      });
    } catch (error) {
      console.error('Error toggling survivor pool lock:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error toggling survivor pool lock' 
      });
    }
  });
  /*
router.post('/joinByName', async (req, res) => {
    try {
        const { poolName, username, poolPassword } = req.body;
        
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
            // Check if this is a survivor pool
            if (pool.mode === 'survivor') {
                // Check if the user was previously eliminated
                const wasEliminated = pool.eliminatedMembers && 
                                      pool.eliminatedMembers.some(m => 
                                          m.username.toLowerCase() === username.toLowerCase()
                                      );
                
                if (wasEliminated) {
                    // If they were eliminated before, create survivor member with isEliminated=true
                    const newMember = {
                        user: user._id,
                        username: username.toLowerCase(),
                        orderIndex: 0,
                        isEliminated: true // Mark as eliminated
                    };
                    
                    await poolsCollection.updateOne(
                        { name: poolName },
                        { $push: { members: newMember } } as any
                    );
                    
                    console.log(`User ${username} rejoined survivor pool ${poolName} as eliminated`);
                } else {
                    // Normal survivor member (not eliminated)
                    const newMember = {
                        user: user._id,
                        username: username.toLowerCase(),
                        orderIndex: 0,
                        isEliminated: false
                    };
                    
                    await poolsCollection.updateOne(
                        { name: poolName },
                        { $push: { members: newMember } } as any
                    );
                }
            } else {
                // Regular pool member (classic mode)
                const newMember = {
                    user: user._id,
                    username: username.toLowerCase(),
                    points: 0,
                    picks: [],
                    win: 0,
                    loss: 0,
                    push: 0,
                    orderIndex: 0
                };

                await poolsCollection.updateOne(
                    { name: poolName },
                    { $push: { members: newMember } } as any
                );
            }

            // After joining, normalize all indices
            await normalizePoolOrder(poolsCollection, username);
        }

        const updatedPool = await poolsCollection.findOne({ name: poolName });
        res.status(200).json({ 
            message: 'Joined pool successfully', 
            pool: updatedPool
        });

    } catch (error) {
        console.error('Error joining pool:', error);
        res.status(500).json({ message: 'Error joining pool', error });
    }
});*/
router.post('/joinByName', async (req, res) => {
    try {
      const { poolName, username, poolPassword } = req.body;
      
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
  
      // Check if this is a locked survivor pool
      if (pool.mode === 'survivor' && pool.isLocked) {
        return res.status(403).json({ 
          message: 'This survivor pool is locked and not accepting new members' 
        });
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
        // Check if this is a survivor pool
        if (pool.mode === 'survivor') {
          // Check if the user was previously eliminated
          const wasEliminated = pool.eliminatedMembers && 
                                pool.eliminatedMembers.some(m => 
                                    m.username.toLowerCase() === username.toLowerCase()
                                );
          
          if (wasEliminated) {
            // If they were eliminated before, create survivor member with isEliminated=true
            const newMember = {
              user: user._id,
              username: username.toLowerCase(),
              orderIndex: 0,
              isEliminated: true // Mark as eliminated
            };
            
            await poolsCollection.updateOne(
              { name: poolName },
              { $push: { members: newMember } } as any
            );
            
            console.log(`User ${username} rejoined survivor pool ${poolName} as eliminated`);
          } else {
            // Normal survivor member (not eliminated)
            const newMember = {
              user: user._id,
              username: username.toLowerCase(),
              orderIndex: 0,
              isEliminated: false
            };
            
            await poolsCollection.updateOne(
              { name: poolName },
              { $push: { members: newMember } } as any
            );
          }
        } else {
          // Regular pool member (classic mode)
          const newMember = {
            user: user._id,
            username: username.toLowerCase(),
            points: 0,
            picks: [],
            win: 0,
            loss: 0,
            push: 0,
            orderIndex: 0
          };
  
          await poolsCollection.updateOne(
            { name: poolName },
            { $push: { members: newMember } } as any
          );
        }
  
        // After joining, normalize all indices
        await normalizePoolOrder(poolsCollection, username);
      }
  
      const updatedPool = await poolsCollection.findOne({ name: poolName });
      res.status(200).json({ 
        message: 'Joined pool successfully', 
        pool: updatedPool
      });
  
    } catch (error) {
      console.error('Error joining pool:', error);
      res.status(500).json({ message: 'Error joining pool', error });
    }
  });


router.get('/getSurvivorStatus/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');

        const pool = await poolsCollection.findOne({
            name: poolName,
            mode: 'survivor',
            'members.username': username.toLowerCase()
        });

        if (!pool) {
            return res.status(404).json({ message: 'Pool or user not found' });
        }

        const member = pool.members.find(m => m.username.toLowerCase() === username.toLowerCase());
        if (!member) {
            return res.status(404).json({ message: 'Member not found in pool' });
        }

        const status = member.isEliminated ? 'eliminated' : 'active';
        res.json({ status });
    } catch (error) {
        console.error('Error fetching survivor status:', error);
        res.status(500).json({ message: 'Error fetching survivor status' });
    }
});
router.get('/getEliminationInfo/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');

        const pool = await poolsCollection.findOne({
            name: poolName,
            mode: 'survivor',
            'eliminatedMembers.username': username.toLowerCase()
        });

        if (!pool) {
            return res.json({ 
                isEliminated: false, 
                eliminationWeek: null,
                message: 'User is still active or not found in this pool'
            });
        }

        const eliminatedMember = pool.eliminatedMembers.find(
            m => m.username.toLowerCase() === username.toLowerCase()
        );

        if (!eliminatedMember) {
            return res.json({ 
                isEliminated: false, 
                eliminationWeek: null,
                message: 'User is still active in this pool'
            });
        }

        res.json({
            isEliminated: true,
            eliminationWeek: eliminatedMember.eliminationWeek || null,
            eliminatedAt: eliminatedMember.eliminatedAt || null
        });
    } catch (error) {
        console.error('Error fetching elimination info:', error);
        res.status(500).json({ message: 'Error fetching elimination information' });
    }
});
// Update a user's survivor status
router.post('/updateSurvivorStatus', async (req, res) => {
    try {
        const { username, poolName, isEliminated } = req.body;
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');

        // Get current week
        const currentWeek = await getCurrentWeek();

        // Define update operations with proper typing
        const updateOperations = [
            {
                updateOne: {
                    filter: {
                        name: poolName,
                        mode: 'survivor',
                        'members.username': username.toLowerCase()
                    },
                    update: {
                        $set: {
                            'members.$.isEliminated': isEliminated
                        }
                    }
                }
            }
        ] as any[]; // Type assertion for the array

        // If eliminating, add to eliminatedMembers array with week information
        if (isEliminated) {
            updateOperations.push({
                updateOne: {
                    filter: { name: poolName },
                    update: {
                        $addToSet: {
                            eliminatedMembers: {
                                username: username.toLowerCase(),
                                eliminatedAt: new Date(),
                                eliminationWeek: currentWeek
                            }
                        }
                    } as any // Type assertion for the $addToSet operation
                }
            });
        }

        const result = await poolsCollection.bulkWrite(updateOperations);

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: 'Pool or user not found' });
        }

        res.json({ 
            success: true, 
            message: `User ${isEliminated ? 'eliminated' : 'reactivated'} successfully`,
            eliminationWeek: isEliminated ? currentWeek : null
        });
    } catch (error) {
        console.error('Error updating survivor status:', error);
        res.status(500).json({ message: 'Error updating survivor status' });
    }
});
/*
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
});*/
// Route for admins to manage join requests
/*
// Route to leave a pool
router.post('/leave/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const db = await connectToDatabase();
        const poolsCollection = db.collection('pools');

        // Remove member from pool
        await poolsCollection.updateOne(
            { name: poolName },
            { $pull: { members: { username: username.toLowerCase() } as any } }
        );

        // After leaving, normalize all indices
        await normalizePoolOrder(poolsCollection, username);

        res.json({ message: 'Successfully left the pool' });
    } catch (error) {
        console.error('Error leaving pool:', error);
        res.status(500).json({ message: 'Error leaving pool', error });
    }
});*/
router.post('/leave/:username/:poolName', async (req, res) => {
    try {
        const { username, poolName } = req.params;
        const db = await connectToDatabase();
        const poolsCollection = db.collection('pools');

        // First, check if the pool and member exist
        const pool = await poolsCollection.findOne({
            name: poolName,
            'members.username': username.toLowerCase()
        });

        if (!pool) {
            return res.status(404).json({ message: 'Pool or member not found' });
        }

        // Remove member from pool with explicit typing
        const updateResult = await poolsCollection.updateOne(
            { name: poolName },
            { $pull: { members: { username: username.toLowerCase() } } } as any
        );

        if (updateResult.modifiedCount === 0) {
            return res.status(400).json({ message: 'Failed to remove member from pool' });
        }

        // After leaving, normalize all indices
        await normalizePoolOrder(poolsCollection, username);

        res.json({ message: 'Successfully left the pool' });
    } catch (error) {
        console.error('Error leaving pool:', error);
        res.status(500).json({ message: 'Error leaving pool', error });
    }
});
router.get('/get-all', async (req, res) => {
  try {
    const pools = await Pool.find();
    res.json(pools.map(pool => pool.toObject())); // 'adminUsername' is now a direct property of the pool object
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pools', error });
  }
});// Helper function for initial pool ordering
async function reorderPoolsForUser(poolsCollection: any, username: string) {
    const userPools = await poolsCollection.find({
        'members.username': username.toLowerCase()
    }).toArray();

    const nonGlobalPools = userPools.filter(p => p.name !== "Global");
    const globalPool = userPools.find(p => p.name === "Global");

    const bulkOps = nonGlobalPools.map((pool, index) => ({
        updateOne: {
            filter: {
                name: pool.name,
                'members.username': username.toLowerCase()
            },
            update: { 
                $set: { 
                    'members.$.orderIndex': index 
                } 
            }
        }
    }));

    if (globalPool) {
        bulkOps.push({
            updateOne: {
                filter: {
                    name: "Global",
                    'members.username': username.toLowerCase()
                },
                update: { 
                    $set: { 
                        'members.$.orderIndex': nonGlobalPools.length 
                    } 
                }
            }
        });
    }

    if (bulkOps.length > 0) {
        await poolsCollection.bulkWrite(bulkOps);
    }
}
// Simplified reorder route without Global pool restrictions
/*
router.post('/reorder', async (req, res) => {
    const { username, poolName, direction } = req.body;
    
    try {
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');

        // Get all user's pools
        const userPools = await poolsCollection.find({
            'members.username': username.toLowerCase()
        }).toArray();

        // Find current pool and its index
        const currentPool = userPools.find(p => p.name === poolName);
        const currentMember = currentPool?.members.find(m => 
            m.username.toLowerCase() === username.toLowerCase()
        );
        
        if (!currentPool || !currentMember) {
            return res.status(404).json({
                success: false,
                message: 'Pool not found'
            });
        }

        const currentIndex = currentMember.orderIndex;
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Check if move is possible
        if (targetIndex < 0 || targetIndex >= userPools.length) {
            return res.status(400).json({
                success: false,
                message: `Cannot move ${direction}, pool is at the ${direction === 'up' ? 'top' : 'bottom'}`
            });
        }

        // Find the pool to swap with
        const targetPool = userPools.find(p => {
            const member = p.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase()
            );
            return member?.orderIndex === targetIndex;
        });

        if (!targetPool) {
            return res.status(404).json({
                success: false,
                message: 'Target position not found'
            });
        }

        // Perform the swap
        await poolsCollection.bulkWrite([
            {
                updateOne: {
                    filter: {
                        name: poolName,
                        'members.username': username.toLowerCase()
                    },
                    update: { $set: { 'members.$.orderIndex': targetIndex } }
                }
            },
            {
                updateOne: {
                    filter: {
                        name: targetPool.name,
                        'members.username': username.toLowerCase()
                    },
                    update: { $set: { 'members.$.orderIndex': currentIndex } }
                }
            }
        ]);

        res.json({
            success: true,
            message: 'Pool order updated successfully'
        });

    } catch (error:any) {
        console.error('Error reordering pools:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during reorder'
        });
    }
});*/

// Reorder route
router.post('/reorder', async (req, res) => {
    const { username, poolName, direction } = req.body;
    
    try {
        const database = await connectToDatabase();
        const poolsCollection = database.collection('pools');

        // Get all user's pools
        const userPools = await poolsCollection.find({
            'members.username': username.toLowerCase()
        }).toArray();

        // Sort by current order
        const sortedPools = userPools.sort((a, b) => {
            const indexA = a.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase()
            )?.orderIndex ?? 0;
            const indexB = b.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase()
            )?.orderIndex ?? 0;
            return indexA - indexB;
        });

        // Find current pool's position
        const currentIndex = sortedPools.findIndex(p => p.name === poolName);
        if (currentIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Pool not found'
            });
        }

        // Calculate target index
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        // Validate move
        if (targetIndex < 0 || targetIndex >= sortedPools.length) {
            return res.status(400).json({
                success: false,
                message: `Cannot move ${direction}, pool is at the ${direction === 'up' ? 'top' : 'bottom'}`
            });
        }

        // Swap pools
        [sortedPools[currentIndex], sortedPools[targetIndex]] = 
        [sortedPools[targetIndex], sortedPools[currentIndex]];

        // Update all indices
        const bulkOps = sortedPools.map((pool, index) => ({
            updateOne: {
                filter: {
                    name: pool.name,
                    'members.username': username.toLowerCase()
                },
                update: {
                    $set: {
                        'members.$.orderIndex': index
                    }
                }
            }
        }));

        await poolsCollection.bulkWrite(bulkOps);

        res.json({
            success: true,
            message: 'Pool order updated successfully'
        });

    } catch (error:any) {
        console.error('Error reordering pools:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal server error during reorder'
        });
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
        
        const orderA = typeof memberA?.orderIndex === 'number' ? memberA.orderIndex : -1;
        const orderB = typeof memberB?.orderIndex === 'number' ? memberB.orderIndex : -1;
        
        if (orderA !== orderB) {
            return orderB - orderA; // Reverse the order so higher indices appear first
        }
        
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

// Function to normalize pool order (lower index = lower position)
async function normalizePoolOrder(poolsCollection: any, username: string) {
    try {
        const userPools = await poolsCollection.find({
            'members.username': username.toLowerCase()
        }).toArray();

        // Sort in ascending order (lower orderIndex first)
        const sortedPools = userPools.sort((a, b) => {
            const indexA = a.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase()
            )?.orderIndex ?? Infinity;
            const indexB = b.members.find(m => 
                m.username.toLowerCase() === username.toLowerCase()
            )?.orderIndex ?? Infinity;
            return indexA - indexB;
        });

        // Create bulk operations to update all indices
        const bulkOps = sortedPools.map((pool, index) => ({
            updateOne: {
                filter: {
                    name: pool.name,
                    'members.username': username.toLowerCase()
                },
                update: {
                    $set: {
                        'members.$.orderIndex': index
                    }
                }
            }
        }));

        if (bulkOps.length > 0) {
            await poolsCollection.bulkWrite(bulkOps);
        }

        return true;
    } catch (error) {
        console.error('Error normalizing pool order:', error);
        return false;
    }
}
// API routes for VendingSpotlight feature
// Add these routes to your Express server

// Route to get vending spotlight data for a specific pool
router.get('/api/getVendingSpotlight', async (req, res) => {
    try {
        const { poolName, week } = req.query;
        
        if (!poolName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Pool name is required' 
            });
        }
        
        const database = await connectToDatabase();
        const vendingCollection = database.collection('vendingMachinePoints');
        
        // Use previous week if not specified (current week - 1)
        let targetWeek: any = week;
        if (!targetWeek) {
            const currentWeek = await getCurrentWeek();
            targetWeek = Math.max(1, currentWeek - 1); // Ensure we don't go below week 1
        } else {
            targetWeek = parseInt(targetWeek);
        }
        
        //console.log(`API: Getting vending spotlight for pool ${poolName}, week ${targetWeek}`);
        
        // Get hottest picker for this pool and week
        const hottest = await vendingCollection.findOne({
            poolName,
            week: targetWeek,
            type: 'hottest'
        });
        
        // Get biggest loser for this pool and week
        const biggestLoser = await vendingCollection.findOne({
            poolName,
            week: targetWeek,
            type: 'biggest_loser'
        });
        
        res.json({
            success: true,
            data: {
                hottest,
                biggestLoser,
                week: targetWeek
            }
        });
        
    } catch (error) {
        console.error('Error in getVendingSpotlight API:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// Route to manually trigger vending machine points calculation (for testing)
router.post('/api/calculateVendingPoints', async (req, res) => {
    try {
        await saveVendingMachinePoints();
        
        res.json({
            success: true,
            message: 'Vending machine points calculated and saved successfully'
        });
        
    } catch (error) {
        console.error('Error calculating vending points:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate vending points'
        });
    }
});

// Route to get vending spotlight data for all pools (admin use)
router.get('/api/getAllVendingSpotlight', async (req, res) => {
    try {
        const { week } = req.query;
        
        const database = await connectToDatabase();
        const vendingCollection = database.collection('vendingMachinePoints');
        
        // Use current week if not specified
        let targetWeek: any = week;
        if (!targetWeek) {
            const currentWeek = await getCurrentWeek();
            targetWeek = currentWeek;
        } else {
            targetWeek = parseInt(targetWeek);
        }
        
        // Get all vending data for the specified week
        const vendingData = await vendingCollection.find({
            week: targetWeek
        }).toArray();
        
        // Group by pool name
        const groupedData = {};
        vendingData.forEach(item => {
            if (!groupedData[item.poolName]) {
                groupedData[item.poolName] = {};
            }
            groupedData[item.poolName][item.type] = item;
        });
        
        res.json({
            success: true,
            data: groupedData,
            week: targetWeek
        });
        
    } catch (error) {
        console.error('Error in getAllVendingSpotlight API:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Route to clear vending machine data for a specific week (admin use)
router.delete('/api/clearVendingData/:week', async (req, res) => {
    try {
        const { week } = req.params;
        const targetWeek = parseInt(week);
        
        if (isNaN(targetWeek)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid week number'
            });
        }
        
        const database = await connectToDatabase();
        const vendingCollection = database.collection('vendingMachinePoints');
        
        const result = await vendingCollection.deleteMany({ week: targetWeek });
        
        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} vending records for week ${targetWeek}`
        });
        
    } catch (error) {
        console.error('Error clearing vending data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear vending data'
        });
    }
});



export default router;
