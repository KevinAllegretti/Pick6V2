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


// poolRoutes.ts
// Inside your DELETE endpoint in the pool routes
router.delete('/delete/:poolId', async (req, res) => {
  // Extract username from request, sent from client-side
  // You might send this in a custom header or as part of the request body
  // Here's an example if sent in headers
  const usernameHeader = req.headers['x-username']; // Ensure this header is sent from client

  if (typeof usernameHeader !== 'string' || !usernameHeader) {
    return res.status(400).json({ message: 'Username header is required' });
}

// Now we're sure username is a string and not undefined or an array.
const username = usernameHeader.toLowerCase();

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');
    const poolsCollection = db.collection('pools');

    const user = await usersCollection.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { poolId } = req.params;
    const pool = await poolsCollection.findOne({ _id: new ObjectId(poolId) });
    
    if (!pool) {
      return res.status(404).json({ message: 'Pool not found.' });
    }

    // Check if the user is the admin of the pool
    if (pool.admin.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this pool.' });
    }

    // Delete the pool
    await poolsCollection.deleteOne({ _id: new ObjectId(poolId) });
    res.json({ message: 'Pool deleted successfully.' });
  } catch (error) {
    console.error('Error deleting pool:', error);
    res.status(500).json({ message: 'Error deleting pool', error });
  }
});



  
export default router;
