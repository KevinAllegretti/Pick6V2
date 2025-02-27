
import express from 'express';
import { getCurrentWeek } from '../microservices/serverUtils';

const router = express.Router();

// Get the current week 
router.get('/getCurrentWeek', async (req, res) => {
  try {
    const week: number = await getCurrentWeek();
    res.json({ week });
  } catch (error: any) {
    console.error('Error retrieving current week:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to retrieve current week' 
    });
  }
});


export default router;

