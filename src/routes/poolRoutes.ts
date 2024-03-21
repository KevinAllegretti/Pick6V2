// src/routes/poolRoutes.ts

import express from 'express';
import { createPool, joinPool, manageJoinRequest } from '../Controllers/poolController';

const router = express.Router();

// Route to create a new pool
router.post('/create', createPool);

// Route to handle join pool requests
router.post('/join', joinPool);

// Route for admins to manage join requests
router.post('/manage-join', manageJoinRequest);

export default router;
