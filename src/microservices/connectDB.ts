import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/';
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (!client) {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export async function connectToDatabase(): Promise<Db> {
  try {
    if (!clientPromise) {
      throw new Error("MongoDB client is not initialized");
    }
    const mongoClient = await clientPromise;
    const db = mongoClient.db('Pick6');
    
    // Set up unique index for the username field in the users collection
    await db.collection('users').createIndex({ username: 1 }, { unique: true });

    return db;
  } catch (error:any) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}
