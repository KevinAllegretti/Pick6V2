// src/routes/poolRoutes.ts

import express from 'express';
import { createPool, joinPool, manageJoinRequest } from '../Controllers/poolController';
import Pool from '../models/Pool';
import { connectToDatabase } from '../microservices/connectDB';
import { ObjectId } from 'mongodb';

const router = express.Router();

// Route to create a new pool
router.post('/create', createPool);

// Route to handle join pool requests
router.post('/join', joinPool);

// Route for admins to manage join requests
router.post('/manage-join', manageJoinRequest);


router.get('/get-all', async (req, res) => {
  try {
    const pools = await Pool.find();
    res.json(pools.map(pool => pool.toObject())); // 'adminUsername' is now a direct property of the pool object
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pools', error });
  }
});


router.delete('/delete/:poolId', async (req, res) => {
  console.log('All headers:', req.headers); // See all headers to verify the presence and case
  const usernameHeader = req.headers['x-username']; // or 'X-Username' if the case is an issue
  console.log('Username from header:', usernameHeader); // Log the username received in the header

  if (typeof usernameHeader !== 'string' || !usernameHeader) {
    console.log('Username header is missing or not a string'); // Log if there's an issue with the header
    return res.status(400).json({ message: 'Username header is required' });
  }

  const username = usernameHeader.toLowerCase();
  console.log('Username after conversion to lowercase:', username); // Log the converted username

  try {
    const db = await connectToDatabase();
    console.log('Connected to database'); // Log after successful database connection

    const usersCollection = db.collection('users');
    const poolsCollection = db.collection('pools');

    const user = await usersCollection.findOne({ username: username });
    if (!user) {
      console.log('User not found in the database:', username); // Log if the user wasn't found
      return res.status(404).json({ message: 'User not found.' });
    }

    const { poolId } = req.params;

    const pool = await db.collection('pools').findOne({ _id: new ObjectId(poolId) });
    console.log('Pool found with MongoDB native driver:', pool);

        
    if (pool) {
      const deleteResult = await db.collection('pools').deleteOne({ _id: new ObjectId(poolId) });
      console.log('Delete result:', deleteResult);
    }

    if (!pool) {
      console.log('Pool not found with ID:', poolId); // Log if the pool wasn't found
      return res.status(404).json({ message: 'Pool not found.' });
    }

    console.log('Pool found:', pool); // Log the found pool

    if (pool.admin.toString() !== user._id.toString()) {
      console.log('User is not authorized to delete this pool:', username); // Log if the user is not the admin
      return res.status(403).json({ message: 'Not authorized to delete this pool.' });
    }

    await poolsCollection.deleteOne({ _id: new ObjectId(poolId) });
    console.log('Pool deleted successfully:', poolId); // Log successful deletion
    res.json({ message: 'Pool deleted successfully.' });
  } catch (error) {
    console.error('Error deleting pool:', error); // Log any caught errors
    res.status(500).json({ message: 'Error deleting pool', error });
  }
});

  
export default router;
