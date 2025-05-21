import { MongoClient, Db } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI as string;

// Use a single client instance for the entire application
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient>;

// Initialize the client promise once
if (!global._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10, // Limit the maximum connections in the pool
    minPoolSize: 1   // Minimum connections to maintain
  });
  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function connectToDatabase(): Promise<Db> {
  try {
    const mongoClient = await clientPromise;
    const db = mongoClient.db('Pick6');
    return db;
  } catch (error: any) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}

// Optional: Add this function to close connections when needed
export async function closeConnection() {
  try {
    const mongoClient = await clientPromise;
    await mongoClient.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing connection:', error);
  }
}