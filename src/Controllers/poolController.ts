// poolController.ts
import { Request, Response } from 'express';
import { connectToDatabase } from '../microservices/connectDB';
import Pool from '../models/Pool'; // Assuming you have a Pool model set up as previously discussed
import bcrypt from 'bcrypt';

// Helper function to find user by username and return the user object
const findUserByUsername = async (username: string) => {
  const db = await connectToDatabase();
  const usersCollection = db.collection('users');
  const user = await usersCollection.findOne({ username: username.toLowerCase() });
  return user;
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

    let hashedPassword = null;
    if (isPrivate && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    
    // Automatically include the admin in the members array upon pool creation
    const newPool = new Pool({
      name,
      admin: adminUser._id, // Set the admin to the adminUser's ObjectId
      adminUsername: adminUsername, // Use the adminUsername directly from the request
      isPrivate,
      password: hashedPassword,
      members: [adminUsername], // Include the admin's ObjectId in the members array
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
export const joinPoolByName = async (req: Request, res: Response) => {
  try {
    const { poolName, username, poolPassword } = req.body;

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

    if (pool.isPrivate && pool.password) {
      const isMatch = await bcrypt.compare(poolPassword, pool.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect password' });
      }
    }

    // Add the user to the pool's members array if not already a member
    if (!pool.members.includes(username)) {
      pool.members.push(username);
      await pool.save();
    }

    res.status(200).json({ message: 'Joined pool successfully', pool });
  } catch (error) {
    res.status(500).json({ message: 'Error joining pool', error });
  }
};


// Admin manages join requests for a private pool
export const manageJoinRequest = async (req: Request, res: Response) => {
  try {
    const { poolId, username, action } = req.body;

    // Find the user by username
    const adminUser = await findUserByUsername(username);
    if (!adminUser) {
      return res.status(404).json({ message: 'Admin user not found' });
    }

    // Find the pool by ID
    const pool = await Pool.findById(poolId);
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found' });
    }

    if (adminUser._id.toString() !== pool.admin.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Perform action based on 'approve' or 'deny'
    // Here you'll need to implement logic based on
    // Assuming you have a 'requests' field in the pool document to track join requests
    const requestingUser = await findUserByUsername(action.username); // 'action' should contain the username of the requesting user
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found' });
    }

    if (action.type === 'approve') {
      // Add user to members array if not already present
      if (!pool.members.includes(requestingUser.username)) {
        pool.members.push(requestingUser.username);
      }
    } else if (action.type === 'deny') {
      // Remove the request from the 'requests' array or set it to denied
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    // Save the pool with updated members or requests
    await pool.save();
    res.status(200).json({ message: `User ${action.type}ed successfully`, pool });
  } catch (error) {
    res.status(500).json({ message: 'Error managing join request', error });
  }
};
