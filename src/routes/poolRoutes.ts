// src/routes/poolRoutes.ts

import express from 'express';
import { createPool, joinPool, manageJoinRequest } from '../Controllers/poolController';
import Pool from '../models/Pool';

const router = express.Router();

// Route to create a new pool
router.post('/create', createPool);

// Route to handle join pool requests
router.post('/join', joinPool);

// Route for admins to manage join requests
router.post('/manage-join', manageJoinRequest);


router.get('/get-all', async (req, res) => {
    try {
      const pools = await Pool.find(); // Fetch all pools from your database
      res.json(pools);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching pools', error });
    }
  });

  
  
export default router;
