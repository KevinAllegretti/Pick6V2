/*import express from 'express';
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
}
/*
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
}*/
/*
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
        // Target users who have notificationsEnabled: true tag
        filters: [
          { field: "tag", key: "notificationsEnabled", relation: "=", value: "true" }
        ],
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
/*
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
export default router;*/

import express from 'express';
import { connectToDatabase } from '../microservices/connectDB';

const router = express.Router();

// Configuration
const ONESIGNAL_CONFIG = {
  appId: "c0849e89-f474-4aea-8de1-290715275d14",
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
  userAuthKey: process.env.ONESIGNAL_USER_AUTH_KEY
};

// Interfaces
interface NotificationUser {
  username: string;
  notificationsEnabled: boolean;
  onesignalId?: string;
  deviceType?: string;
  lastSeen?: Date;
  notificationUpdated?: Date;
}

interface OneSignalUserData {
  identity: {
    external_id: string;
    onesignal_id?: string;
  };
  properties: {
    tags: Record<string, string | number | boolean>;
    language?: string;
    timezone_id?: string;
    first_active?: number;
    last_active?: number;
  };
  subscriptions: Array<{
    type: string;
    token: string;
    enabled: boolean;
    web_auth?: string;
    web_p256?: string;
    notification_types?: number;
  }>;
}

// ===== ONESIGNAL USER API ENDPOINTS =====

// Create OneSignal user and subscription
router.post('/onesignal/create-user', async (req, res) => {
  console.log('🔔 Creating OneSignal user...');
  
  try {
    const { username, userData }: { username: string; userData: OneSignalUserData } = req.body;
    
    if (!username || !userData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and userData are required' 
      });
    }

    if (!ONESIGNAL_CONFIG.restApiKey) {
      console.error('❌ OneSignal REST API key not configured');
      return res.status(500).json({
        success: false,
        error: 'OneSignal REST API key not configured'
      });
    }
    
    console.log('📤 Sending to OneSignal API:', {
      username,
      appId: ONESIGNAL_CONFIG.appId,
      hasSubscriptions: userData.subscriptions?.length > 0
    });
    
    // Make the API call to OneSignal User API
    const response = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_CONFIG.appId}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_CONFIG.restApiKey}`
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    console.log('📡 OneSignal API response:', {
      status: response.status,
      success: response.ok,
      hasIdentity: !!result.identity
    });
    
    if (!response.ok) {
      const errorMessage = result.errors?.[0]?.detail || 
                         result.error || 
                         `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('❌ OneSignal API error:', errorMessage);
      return res.status(response.status).json({ 
        success: false, 
        error: errorMessage,
        oneSignalResponse: result
      });
    }
    
    // Extract OneSignal user ID
    const onesignalUserId = result.identity?.onesignal_id;
    
    if (!onesignalUserId) {
      console.error('❌ No OneSignal user ID in response');
      return res.status(500).json({ 
        success: false, 
        error: 'OneSignal user ID not found in response',
        oneSignalResponse: result
      });
    }
    
    // Store in database
    try {
      await storeUserInDatabase(username, onesignalUserId, result);
      console.log('✅ User stored in database');
    } catch (dbError) {
      console.error('⚠️ Database storage failed:', dbError);
      // Don't fail the whole request if DB storage fails
    }
    
    console.log('🎉 OneSignal user created successfully:', onesignalUserId);
    
    res.json({ 
      success: true, 
      onesignalUserId,
      onesignalUser: result,
      message: 'User and subscription created successfully'
    });
    
  } catch (error: any) {
    console.error('❌ OneSignal user creation error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check for existing OneSignal user
router.get('/onesignal/check-user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log('🔍 Checking for existing user:', username);
    
    const db = await connectToDatabase();
    const existingUser = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (existingUser && existingUser.onesignalId) {
      console.log('✅ Found existing user in database');
      return res.json({
        exists: true,
        onesignalId: existingUser.onesignalId,
        source: 'database'
      });
    }
    
    console.log('ℹ️ No existing user found');
    res.json({ exists: false });
    
  } catch (error: any) {
    console.error('❌ Error checking user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update user subscription status
router.post('/onesignal/update-subscription/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { enabled, onesignalId } = req.body;
    
    console.log('🔄 Updating subscription status:', { username, enabled, onesignalId });
    
    const db = await connectToDatabase();
    
    // Update in database
    await db.collection('users').updateOne(
      { username: username.toLowerCase() },
      { 
        $set: { 
          notificationsEnabled: enabled,
          onesignalId: onesignalId || undefined,
          notificationUpdated: new Date()
        }
      }
    );
    
    // Update tags in OneSignal to track subscription status
    if (onesignalId && ONESIGNAL_CONFIG.restApiKey) {
      try {
        await updateOneSignalUserTags(onesignalId, {
          notifications_enabled: enabled,
          last_updated: Math.floor(Date.now() / 1000),
          app_name: "Pick 6",
          user_type: "player"
        });
        console.log('✅ OneSignal tags updated');
      } catch (tagError) {
        console.warn('⚠️ Failed to update OneSignal tags:', tagError);
      }
    }
    
    res.json({ success: true });
    
  } catch (error: any) {
    console.error('❌ Error updating subscription:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send notification to specific user
router.post('/onesignal/send-to-user', async (req, res) => {
  try {
    const { username, title, message, data } = req.body;
    
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (!user || !user.onesignalId) {
      return res.status(404).json({
        success: false,
        error: 'User not found or not subscribed to notifications'
      });
    }
    
    // Send notification via OneSignal User API
    const notificationData = {
      app_id: ONESIGNAL_CONFIG.appId,
      include_aliases: {
        "onesignal_id": [user.onesignalId]
      },
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      data: data || {},
      web_url: data?.url || 'https://pick6.club/dashboard.html',
      chrome_web_icon: 'https://pick6.club/aiP6.png',
      chrome_web_badge: 'https://pick6.club/favicon.png'
    };
    
    const response = await fetch('https://api.onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_CONFIG.restApiKey}`
      },
      body: JSON.stringify(notificationData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.errors?.[0]?.detail || 'Notification send failed');
    }
    
    console.log('📱 Notification sent to user:', username);
    res.json({ success: true, notificationId: result.id });
    
  } catch (error: any) {
    console.error('❌ Error sending notification to user:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ===== HELPER FUNCTIONS =====

async function storeUserInDatabase(username: string, onesignalUserId: string, fullResponse: any): Promise<void> {
  try {
    const db = await connectToDatabase();
    
    await db.collection('users').updateOne(
      { username: username.toLowerCase() },
      { 
        $set: {
          onesignalId: onesignalUserId,
          notificationsEnabled: true,
          onesignalData: fullResponse,
          notificationUpdated: new Date()
        }
      },
      { upsert: false } // Don't create new users, only update existing ones
    );
    
    console.log('💾 User stored in database:', { username, onesignalUserId });
  } catch (error) {
    console.error('❌ Database storage error:', error);
    throw error;
  }
}

async function updateOneSignalUserTags(onesignalId: string, tags: Record<string, any>): Promise<void> {
  if (!ONESIGNAL_CONFIG.restApiKey) {
    throw new Error('OneSignal REST API key not configured');
  }

  const response = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_CONFIG.appId}/users/by/onesignal_id/${onesignalId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${ONESIGNAL_CONFIG.restApiKey}`
    },
    body: JSON.stringify({
      properties: {
        tags: tags
      }
    })
  });
  
  if (!response.ok) {
    const result = await response.json();
    throw new Error(`Failed to update tags: ${result.errors?.[0]?.detail || response.statusText}`);
  }
}

// ===== UPDATED NOTIFICATION FUNCTIONS =====

// ===== UPDATED NOTIFICATION FUNCTIONS =====

// Send notification to all enabled users (updated for User API)
async function sendNotificationToAll(title: string, body: string, data?: any) {
  try {
    const db = await connectToDatabase();
    
    // Get all users with notifications enabled AND OneSignal IDs
    const enabledUsers = await db.collection('users').find({ 
      notificationsEnabled: true,           // Must have notifications enabled
      onesignalId: { 
        $exists: true, 
        $nin: [null, '']  // Must not be null or empty string
      }
    }).toArray();
    
    console.log(`📱 Found ${enabledUsers.length} users with notifications enabled and OneSignal IDs`);
    
    if (enabledUsers.length === 0) {
      console.log('ℹ️ No users have notifications enabled with valid OneSignal IDs');
      return { 
        success: true, 
        sent: 0, 
        message: 'No enabled users found' 
      };
    }
    
    // Log some details about the users (without sensitive info)
    console.log('📊 Users to notify:', enabledUsers.map(user => ({
      username: user.username,
      hasOnesignalId: !!user.onesignalId,
      notificationsEnabled: user.notificationsEnabled
    })));
    
    // Send via OneSignal User API
    const notificationResult = await sendOneSignalNotificationToUsers(title, body, enabledUsers, data);
    
    if (notificationResult) {
      console.log(`✅ Notification sent successfully to ${enabledUsers.length} users`);
      return { 
        success: true, 
        sent: enabledUsers.length, 
        details: notificationResult,
        users: enabledUsers.map(u => ({ username: u.username, onesignalId: u.onesignalId }))
      };
    } else {
      console.log('⚠️ Notification sending failed');
      return { 
        success: false, 
        sent: 0, 
        error: 'OneSignal notification failed',
        enabledUsersCount: enabledUsers.length
      };
    }
    
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    throw error;
  }
}

// Updated OneSignal notification function using User API
async function sendOneSignalNotificationToUsers(title: string, body: string, users: any[], data?: any) {
  if (!ONESIGNAL_CONFIG.restApiKey) {
    console.warn('⚠️ OneSignal REST API key not configured');
    return null;
  }
  
  try {
    // Extract and validate OneSignal IDs from users
    const onesignalIds = users
      .map(user => user.onesignalId)
      .filter(id => id && id.trim() !== ''); // Remove any null/undefined/empty IDs
    
    if (onesignalIds.length === 0) {
      console.warn('⚠️ No valid OneSignal IDs found in user list');
      return null;
    }
    
    // Validate that we have the same number of IDs as enabled users
    if (onesignalIds.length !== users.length) {
      console.warn(`⚠️ Mismatch: ${users.length} users but only ${onesignalIds.length} valid OneSignal IDs`);
    }
    
    console.log(`📤 Sending notification to ${onesignalIds.length} OneSignal devices`);
    console.log(`📝 Title: "${title}"`);
    console.log(`📝 Message: "${body}"`);
    
    // Prepare notification payload for OneSignal User API
    const notificationPayload = {
      app_id: ONESIGNAL_CONFIG.appId,
      include_aliases: {
        "onesignal_id": onesignalIds  // Send to specific OneSignal IDs
      },
      target_channel: "push",
      headings: { en: title },
      contents: { en: body },
      data: data || {},
      web_url: data?.url || 'https://pick6.club/dashboard.html',
      chrome_web_icon: 'https://pick6.club/aiP6.png',
      chrome_web_badge: 'https://pick6.club/favicon.png'
    };
    
    console.log('📡 Sending to OneSignal API with payload:', {
      app_id: notificationPayload.app_id,
      target_count: onesignalIds.length,
      has_data: !!data,
      target_channel: notificationPayload.target_channel
    });
    
    const response = await fetch('https://api.onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_CONFIG.restApiKey}`
      },
      body: JSON.stringify(notificationPayload)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ OneSignal API error:', {
        status: response.status,
        statusText: response.statusText,
        error: result.errors?.[0]?.detail || result.error || 'Unknown error',
        fullResponse: result
      });
      return null;
    }
    
    console.log('✅ OneSignal response success:', {
      id: result.id,
      recipients: result.recipients || 'unknown',
      external_id_count: result.external_id_count,
      errors: result.errors
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ OneSignal API error:', error);
    return null;
  }
}

// ===== HELPER FUNCTION TO VALIDATE USER NOTIFICATION STATUS =====

// Function to check and update user notification eligibility
async function validateUserNotificationStatus(username: string): Promise<boolean> {
  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return false;
    }
    
    const isEligible = user.notificationsEnabled === true && 
                      user.onesignalId && 
                      user.onesignalId.trim() !== '';
    
    console.log(`🔍 User ${username} notification eligibility:`, {
      exists: true,
      notificationsEnabled: user.notificationsEnabled,
      hasOnesignalId: !!user.onesignalId,
      eligible: isEligible
    });
    
    return isEligible;
    
  } catch (error) {
    console.error(`❌ Error validating user ${username}:`, error);
    return false;
  }
}

// Function to get notification stats
async function getNotificationStats() {
  try {
    const db = await connectToDatabase();
    
    const totalUsers = await db.collection('users').countDocuments();
    const enabledUsers = await db.collection('users').countDocuments({ 
      notificationsEnabled: true 
    });
    const usersWithOneSignal = await db.collection('users').countDocuments({ 
      onesignalId: { 
        $exists: true, 
        $nin: [null, ''] 
      }
    });
    const eligibleUsers = await db.collection('users').countDocuments({ 
      notificationsEnabled: true,
      onesignalId: { 
        $exists: true, 
        $nin: [null, ''] 
      }
    });
    
    const stats = {
      totalUsers,
      enabledUsers,
      usersWithOneSignal,
      eligibleUsers,
      enabledPercentage: totalUsers > 0 ? Math.round((enabledUsers / totalUsers) * 100) : 0,
      eligiblePercentage: totalUsers > 0 ? Math.round((eligibleUsers / totalUsers) * 100) : 0
    };
    
    console.log('📊 Notification Statistics:', stats);
    return stats;
    
  } catch (error) {
    console.error('❌ Error getting notification stats:', error);
    return null;
  }
}

// ===== UPDATED ROUTE HANDLERS =====

// Test route with stats
router.post('/test', async (req, res) => {
  try {
    // Get stats first
    const stats = await getNotificationStats();
    
    const result = await sendNotificationToAll(
      '🧪 Pick 6 Test',
      'This is a test notification from the server!',
      { type: 'test', url: '/dashboard.html' }
    );
    
    res.json({ 
      success: true, 
      message: 'Test notification sent', 
      result,
      stats 
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats endpoint
router.get('/stats', async (req, res) => {
  try {
    const stats = await getNotificationStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// ===== EXISTING ROUTES (Updated) =====

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
    // Send to specific user using their OneSignal ID
    if (username) {
      const specificResult = await fetch(`${req.protocol}://${req.get('host')}/api/notifications/onesignal/send-to-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          title: '🎯 Your Pick Won!',
          message: `Great call on ${pickDetails.team}! You earned ${pickDetails.points} points!`,
          data: { type: 'pick_won', pick: pickDetails, url: '/dashboard.html' }
        })
      });
      
      const result = await specificResult.json();
      res.json({ success: true, message: 'Pick won notification sent to user', result });
    } else {
      // Fallback to sending to all users
      const result = await sendNotificationToAll(
        '🎯 Pick Won!',
        `Great call on ${pickDetails.team}! ${pickDetails.points} points earned!`,
        { type: 'pick_won', pick: pickDetails, url: '/dashboard.html' }
      );
      
      res.json({ success: true, message: 'Pick won notification sent to all', result });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
// Add more detailed logging to your /toggle/:username route
router.post('/toggle/:username', async (req, res) => {
  const { username } = req.params;
  const { enabled, playerId } = req.body;
  
  console.log('🔧 [BACKEND] Toggle request received:', { 
    username, 
    enabled, 
    playerId,
    requestBody: req.body 
  });
  
  try {
    const db = await connectToDatabase();
    console.log('🔌 [BACKEND] Database connected successfully');
    
    const updateData: any = { 
      notificationsEnabled: enabled,
      notificationUpdated: new Date()
    };
    
    if (playerId) {
      updateData.onesignalId = playerId;
      console.log('✅ [BACKEND] Including OneSignal ID in update:', playerId);
    } else {
      console.log('⚠️ [BACKEND] No OneSignal ID provided in request');
    }
    
    console.log('📝 [BACKEND] Update data:', updateData);
    console.log('🔍 [BACKEND] Looking for user with username:', username.toLowerCase());
    
    // Check if user exists first
    const existingUser = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (!existingUser) {
      console.log('❌ [BACKEND] User not found:', username.toLowerCase());
      return res.status(404).json({ 
        success: false, 
        error: `User ${username} not found in database` 
      });
    }
    
    console.log('👤 [BACKEND] Found existing user:', {
      username: existingUser.username,
      currentNotificationsEnabled: existingUser.notificationsEnabled,
      currentOnesignalId: existingUser.onesignalId,
      hasOtherFields: Object.keys(existingUser).length
    });
    
    // Perform the update
    const updateResult = await db.collection('users').updateOne(
      { username: username.toLowerCase() },
      { $set: updateData }
    );
    
    console.log('📊 [BACKEND] Update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged
    });
    
    if (updateResult.matchedCount === 0) {
      console.log('❌ [BACKEND] No documents matched the username:', username.toLowerCase());
      return res.status(404).json({ 
        success: false, 
        error: 'User not found during update' 
      });
    }
    
    if (updateResult.modifiedCount === 0) {
      console.log('⚠️ [BACKEND] Document matched but not modified (data might be the same)');
    } else {
      console.log('✅ [BACKEND] Document successfully updated');
    }
    
    // Verify the update by reading the user again
    const updatedUser = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    console.log('🔍 [BACKEND] User after update:', {
      username: updatedUser?.username,
      notificationsEnabled: updatedUser?.notificationsEnabled,
      onesignalId: updatedUser?.onesignalId,
      notificationUpdated: updatedUser?.notificationUpdated
    });
    
    // Update OneSignal tags if we have an ID
    if (playerId && ONESIGNAL_CONFIG.restApiKey) {
      try {
        console.log('🏷️ [BACKEND] Updating OneSignal tags...');
        await updateOneSignalUserTags(playerId, {
          notifications_enabled: enabled,
          last_updated: Math.floor(Date.now() / 1000),
          username: username.toLowerCase()
        });
        console.log('✅ [BACKEND] OneSignal tags updated successfully');
      } catch (tagError) {
        console.warn('⚠️ [BACKEND] Failed to update OneSignal tags:', tagError);
      }
    } else {
      if (!playerId) {
        console.log('⚠️ [BACKEND] No OneSignal ID provided for tag update');
      }
      if (!ONESIGNAL_CONFIG.restApiKey) {
        console.log('⚠️ [BACKEND] OneSignal REST API key not configured');
      }
    }
    
    console.log('🎉 [BACKEND] Toggle operation completed successfully');
    
    res.json({ 
      success: true, 
      message: `Notifications ${enabled ? 'enabled' : 'disabled'} for ${username}`,
      updateResult: {
        matchedCount: updateResult.matchedCount,
        modifiedCount: updateResult.modifiedCount
      },
      userData: {
        notificationsEnabled: updatedUser?.notificationsEnabled,
        hasOnesignalId: !!updatedUser?.onesignalId
      }
    });
    
  } catch (error: any) {
    console.error('❌ [BACKEND] Toggle operation failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack
    });
  }
});
// Get notification status for a user (unchanged)
router.get('/status/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const db = await connectToDatabase();
    const user = await db.collection('users').findOne({ 
      username: username.toLowerCase() 
    });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    res.json({ 
      success: true, 
      notificationsEnabled: user.notificationsEnabled || false,
      hasOnesignalId: !!user.onesignalId,
      lastUpdated: user.notificationUpdated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
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
*/
// Export the notification function for use in scheduler
export { sendNotificationToAll };
export default router;