import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';

const router = express.Router();

// Store notification preferences in your database
interface NotificationUser {
  username: string;
  notificationsEnabled: boolean;
  deviceType?: string;
  lastSeen?: Date;
}

// Send notification to all enabled users
async function sendNotificationToAll(title: string, body: string, data?: any) {
  try {
    const db = await connectToDatabase();
    
    // Get all users with notifications enabled
    // You'll need to add a notificationsEnabled field to your users collection
    const enabledUsers = await db.collection('users').find({ 
      notificationsEnabled: true 
    }).toArray();
    
    console.log(`Sending notification to ${enabledUsers.length} users:`, title);
    
    if (enabledUsers.length === 0) {
      console.log('No users have notifications enabled');
      return { success: true, sent: 0 };
    }
    
    // For now, we'll use OneSignal REST API
    // You could also implement Web Push Protocol here
    const notifications = await sendOneSignalNotification(title, body, data);
    
    return { success: true, sent: enabledUsers.length, details: notifications };
    
  } catch (error) {
    console.error('Error sending notifications:', error);
    throw error;
  }
}
/*
// OneSignal REST API implementation
async function sendOneSignalNotification(title: string, body: string, data?: any) {
  const ONESIGNAL_APP_ID = "c0849e89-f474-4aea-8de1-290715275d14";
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY; // Add this to your .env
  
  console.log('All environment variables:', Object.keys(process.env).filter(key => key.includes('ONESIGNAL')));
  console.log('ONESIGNAL_REST_API_KEY value:', process.env.ONESIGNAL_REST_API_KEY);
  console.log('ONESIGNAL_REST_API_KEY type:', typeof process.env.ONESIGNAL_REST_API_KEY);
  if (!ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal REST API key not configured');
    return null;
  }
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        included_segments: ['All'], // Send to all subscribed users
        headings: { en: title },
        contents: { en: body },
        data: data || {},
        web_url: data?.url || 'https://pick6.club/dashboard.html',
        chrome_web_icon: 'https://pick6.club/aiP6.png',
        chrome_web_badge: 'https://pick6.club/favicon.png'
      })
    });
    
    const result = await response.json();
    console.log('OneSignal response:', result);
    return result;
    
  } catch (error) {
    console.error('OneSignal API error:', error);
    return null;
  }
}*/

async function sendOneSignalNotification(title: string, body: string, data?: any) {
  const ONESIGNAL_APP_ID = "c0849e89-f474-4aea-8de1-290715275d14";
  const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
  
  if (!ONESIGNAL_REST_API_KEY) {
    console.warn('OneSignal REST API key not configured');
    return null;
  }
  
  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
   body: JSON.stringify({
  app_id: ONESIGNAL_APP_ID,
  included_segments: ["Active Subscriptions"], // Use this instead of "All" or "Subscribed Users"
  headings: { en: title },
  contents: { en: body },
  data: data || {},
  web_url: data?.url || 'https://pick6.club/dashboard.html',
  chrome_web_icon: 'https://pick6.club/aiP6.png',
  chrome_web_badge: 'https://pick6.club/favicon.png'
})
    });
    
    const result = await response.json();
    console.log('OneSignal response:', result);
    return result;
    
  } catch (error) {
    console.error('OneSignal API error:', error);
    return null;
  }
}
// Routes
router.post('/test', async (req, res) => {
  try {
    const result = await sendNotificationToAll(
      '🧪 Pick 6 Test',
      'This is a test notification from the server!',
      { type: 'test', url: '/dashboard.html' }
    );
    
    res.json({ success: true, message: 'Test notification sent', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/game-start', async (req, res) => {
  const { gameInfo } = req.body;
  
  try {
    const result = await sendNotificationToAll(
      '🏈 Game Starting!',
      `${gameInfo.awayTeam} @ ${gameInfo.homeTeam} is about to start!`,
      { type: 'game_start', gameId: gameInfo.id, url: '/dashboard.html' }
    );
    
    res.json({ success: true, message: 'Game start notification sent', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/picks-reminder', async (req, res) => {
  try {
    const result = await sendNotificationToAll(
      '⏰ Picks Due Soon!',
      'Don\'t forget to submit your picks before Thursday!',
      { type: 'picks_reminder', url: '/dashboard.html' }
    );
    
    res.json({ success: true, message: 'Picks reminder sent', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/weekly-results', async (req, res) => {
  const { weekNumber, topPicker } = req.body;
  
  try {
    const result = await sendNotificationToAll(
      '📊 Week Results Are In!',
      `Week ${weekNumber} results are ready! Congrats to ${topPicker}!`,
      { type: 'weekly_results', week: weekNumber, url: '/dashboard.html' }
    );
    
    res.json({ success: true, message: 'Weekly results notification sent', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/pick-won', async (req, res) => {
  const { username, pickDetails } = req.body;
  
  try {
    // Send to specific user (you'd implement user-specific targeting)
    const result = await sendNotificationToAll(
      '🎯 Your Pick Won!',
      `Great call on ${pickDetails.team}! You earned ${pickDetails.points} points!`,
      { type: 'pick_won', pick: pickDetails, url: '/dashboard.html' }
    );
    
    res.json({ success: true, message: 'Pick won notification sent', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enable/disable notifications for a user
router.post('/toggle/:username', async (req, res) => {
  const { username } = req.params;
  const { enabled } = req.body;
  
  try {
    const db = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { username },
      { 
        $set: { 
          notificationsEnabled: enabled,
          notificationUpdated: new Date()
        }
      }
    );
    
    res.json({ 
      success: true, 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} for ${username}` 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get notification status for a user
router.get('/status/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ username });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      notificationsEnabled: user.notificationsEnabled || false,
      lastUpdated: user.notificationUpdated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export the notification function for use in scheduler
export { sendNotificationToAll };
export default router;