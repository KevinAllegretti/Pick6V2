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
  mode: 'classic' | 'survivor';
}
export const leavePool = async (req: Request, res: Response) => {
  const { username, poolName } = req.params;
  console.log("leaving pool: " + username, poolName)
  try {
    const database = await connectToDatabase();
    const poolsCollection: Collection<PoolDocument> = database.collection('pools');

    const updateResult = await poolsCollection.updateOne(
      { name: poolName },
      { $pull: { members: { username: username } as any } }
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
    let { name, adminUsername, isPrivate, password, mode } = req.body;
    name = name;
    
    const existingPool = await Pool.findOne({ name });
    if (existingPool) {
      console.log('A pool with this name already exists:', name);
      return res.status(409).json({ message: 'Pool name already taken' });
    }

    const adminUser = await findUserByUsername(adminUsername);
    if (!adminUser) {
      console.log('Admin user not found:', adminUsername);
      return res.status(404).json({ message: 'Admin user not found' });
    }

    console.log(`Creating pool: ${name} by admin user: ${adminUsername}`);
    const adminMember = {
      user: adminUser._id,
      username: adminUsername,
      points: 0,
      picks: [], 
      win: 0,
      loss: 0,
      push: 0,
    };
    
    const newPool = new Pool({
      name,
      admin: adminUser._id,
      adminUsername: adminUsername,
      isPrivate,
      password: password,
      mode: mode || 'classic',
      members: [adminMember],
    });

    const savedPool = await newPool.save();
    console.log('Pool saved to database:', savedPool);
    res.status(201).json({ 
      message: 'Pool created successfully', 
      pool: savedPool 
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Pool name already taken' });
    }
    console.error('Error creating pool:', error);
    res.status(500).json({ message: 'Error creating pool', error });
  }
};



export const joinPoolByName = async (req: Request, res: Response) => {
  try {
    const { poolName, username, poolPassword } = req.body;
    console.log({ poolName, username, poolPassword });
    
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pool = await Pool.findOne({ name: poolName });
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found' });
    }

    if (pool.isPrivate && pool.password) {
      if (poolPassword !== pool.password) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    const isMemberAlready = pool.members.some(member => 
      member.user.toString() === user._id.toString()
    );
    
    if (!isMemberAlready) {
      const newMember = {
        user: user._id,
        username: username,
        points: 0,
        picks: [],
        wins: 0,
        losses: 0,
        pushes: 0,
      };
      pool.members.push(newMember);
      await pool.save();
    }

    res.status(200).json({ 
      message: 'Joined pool successfully', 
      pool: {
        ...pool.toObject(),
        mode: pool.mode
      }
    });
  } catch (error) {
    console.error('Error joining pool:', error);
    res.status(500).json({ message: 'Error joining pool', error });
  }
};


/*
export const getPoolsForUser = async (req: Request, res: Response) => {
 
};*/