// poolController.ts
import { Request, Response } from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import Pool from '../models/Pool'; 
import { Collection } from 'mongodb';

// Helper function to find user by username and return the user object
const findUserByUsername = async (username: string) => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ username: username.toLowerCase() });
  return user;
};

interface Member {
  username: string;
}

interface PoolDocument extends Document {
  name: string;
  members: Member[];
}

export const leavePool = async (req: Request, res: Response) => {
  const { username, poolName } = req.params;
  console.log("leaving pool: " + username, poolName)
  try {
    const database = await connectToDatabase();
    const poolsCollection: Collection<PoolDocument> = database.collection('pools');

    const updateResult = await poolsCollection.updateOne(
      { name: poolName },
      { $pull: { members: { username: username } as any } } // Add "as any" to bypass the type error
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found in pool or pool not found' });
    }

    res.json({ message: 'User removed from pool successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error leaving pool', error });
  }
};

export const createPool = async (req: Request, res: Response) => {
  console.log('Request to create pool received:', req.body);
  try {
    let { name, adminUsername, isPrivate, password } = req.body;
    name = name//.toLowerCase(); // Depending on your requirements, you might uncomment this.
    
    // Check if a pool with the same name already exists
    const existingPool = await Pool.findOne({ name });
    if (existingPool) {
      console.log('A pool with this name already exists:', name);
      return res.status(409).json({ message: 'Pool name already taken' });
    }

    // Find the admin user by adminUsername
    const adminUser = await findUserByUsername(adminUsername);
    if (!adminUser) {
      console.log('Admin user not found:', adminUsername);
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log(`Creating pool: ${name} by admin user: ${adminUsername}`);
    const adminMember = {
      user: adminUser._id, // The ObjectId of the admin user
      username: adminUsername,
      points: 0,
      picks: [], 
      win: 0,
      loss: 0,
      push: 0,
    };
    
    // Automatically include the admin in the members array upon pool creation
    const newPool = new Pool({
      name,
      admin: adminUser._id, // Set the admin to the adminUser's ObjectId
      adminUsername: adminUsername, // Use the adminUsername directly from the request
      isPrivate,
      password: password,
      members: [adminMember], // Include the admin's ObjectId in the members array
    });

    const savedPool = await newPool.save();
    console.log('Pool saved to database:', savedPool);
    res.status(201).json({ message: 'Pool created successfully', pool: savedPool });
  } catch (error: any) {
    if (error.code === 11000) {
      // This error code indicates a duplicate key error (i.e., a unique index has been violated)
      return res.status(409).json({ message: 'Pool name already taken' });
    }
    console.error('Error creating pool:', error);
    res.status(500).json({ message: 'Error creating pool', error });
  }
};



// User requests to join a pool
// User requests to join a pool by pool name
// User requests to join a pool by pool name
export const joinPoolByName = async (req: Request, res: Response) => {
  try {
    const { poolName, username, poolPassword, } = req.body;
    console.log({ poolName, username, poolPassword });
    
    // Find the user by username
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the pool by name
    const pool = await Pool.findOne({ name: poolName });
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found' });
    }

    // Check if pool is private and validate password if it is
    if (pool.isPrivate && pool.password) {
      if (poolPassword !== pool.password) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }


    const isMemberAlready = pool.members.some(member => member.user.toString() === user._id.toString());
   if (!isMemberAlready) {
      // Add the user to the pool's members array if not already a member
      const newMember = {
        user: user._id, // Reference to the User document
        username: username,
        points: 0, // Initial points can be set to 0 or some starting value
        picks: [],
        wins: 0, // Initial wins
        losses: 0, // Initial losses
        pushes: 0, // Initial pushes
      };
      pool.members.push(newMember);
      await pool.save();
    }

    res.status(200).json({ message: 'Joined pool successfully', pool });
  } catch (error) {
    console.error('Error joining pool:', error);
    res.status(500).json({ message: 'Error joining pool', error });
  }
};


/*
export const getPoolsForUser = async (req: Request, res: Response) => {
 
};*/