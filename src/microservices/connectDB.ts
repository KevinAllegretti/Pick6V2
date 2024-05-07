//connectDB.ts
import { MongoClient } from 'mongodb';

// If MONGODB_URI is not set, the fallback URI will be used (You should have a real URI here).
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/'; 

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function connectToDatabase() {
  try {
    await clientPromise;

    // Get the database object
    const db = client.db('Pick6');

    // Set up unique index for the username field in the users collection
    await db.collection('users').createIndex({ username: 1 }, { unique: true });

    return db;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}

const mongoose = require('mongoose');
const options = {
  serverSelectionTimeoutMS: 30000, // Timeout after 30 seconds
  socketTimeoutMS: 45000 // Close sockets after 45 seconds of inactivity
};
mongoose.connect('mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/', options);
