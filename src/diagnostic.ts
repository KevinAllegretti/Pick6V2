// diagnostic.ts - Test basic connectivity
import axios from 'axios';
import { MongoClient } from 'mongodb';

// Configuration - MODIFY THESE VALUES
const baseUrl = 'http://localhost:3000'; // Your API server URL
const apiEndpoint = '/api/getUserProfile'; // Profile endpoint
const username = 'user1'; // A known valid username
const mongoDbUri = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/'; // Your MongoDB connection URI
const dbName = 'Pick6';

async function testApiConnection() {
  console.log('\n--- TESTING API CONNECTION ---');
  console.log(`Trying to connect to: ${baseUrl}${apiEndpoint}/${username}`);
  
  try {
    const response = await axios.get(`${baseUrl}${apiEndpoint}/${username}`, {
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ API Connection successful!');
    console.log(`Status code: ${response.status}`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    return true;
  } catch (error: any) {
    console.log('❌ API Connection failed!');
    
    if (error.code) {
      console.log(`Error code: ${error.code}`);
    }
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(`Status code: ${error.response.status}`);
      console.log('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.log('No response received from server');
      console.log('Request details:', error.request._currentUrl || error.request.path);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error message:', error.message);
    }
    
    console.log('Full error:', error);
    return false;
  }
}

async function testDbConnection() {
  console.log('\n--- TESTING MONGODB CONNECTION ---');
  console.log(`Trying to connect to: ${mongoDbUri}`);
  
  const client = new MongoClient(mongoDbUri);
  
  try {
    await client.connect();
    console.log('✅ MongoDB Connection successful!');
    
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    console.log(`Found ${collections.length} collections in ${dbName} database:`);
    collections.forEach(col => console.log(`- ${col.name}`));
    
    const userCollection = db.collection('users');
    const userCount = await userCollection.countDocuments();
    console.log(`Users collection has ${userCount} documents`);
    
    // Try to find the test user
    const user = await userCollection.findOne({ username });
    if (user) {
      console.log(`✅ Found test user '${username}' in database`);
    } else {
      console.log(`❌ Couldn't find test user '${username}' in database`);
    }
    
    await client.close();
    return true;
  } catch (error) {
    console.log('❌ MongoDB Connection failed!');
    console.error('Error:', error);
    
    try {
      await client.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return false;
  }
}

async function main() {
  console.log('Starting connection diagnostics...');
  
  const apiSuccess = await testApiConnection();
  const dbSuccess = await testDbConnection();
  
  console.log('\n--- DIAGNOSTIC SUMMARY ---');
  console.log(`API Connection: ${apiSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`MongoDB Connection: ${dbSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
  
  if (!apiSuccess) {
    console.log('\nAPI CONNECTION TROUBLESHOOTING:');
    console.log('1. Is your server running?');
    console.log('2. Check the base URL - make sure protocol (http/https) is included');
    console.log('3. Verify the endpoint path is correct');
    console.log('4. Make sure the username exists in your database');
    console.log('5. Check if your server is configured to accept connections from your IP');
  }
  
  if (!dbSuccess) {
    console.log('\nMONGODB CONNECTION TROUBLESHOOTING:');
    console.log('1. Verify your MongoDB connection string is correct');
    console.log('2. Make sure to include username/password if required');
    console.log('3. Check if your IP is whitelisted in MongoDB Atlas');
    console.log('4. Verify the database name is correct');
  }
}

main().catch(console.error);