import { MongoClient, Db } from 'mongodb';

// If MONGODB_URI is not set, the fallback URI will be used (You should have a real URI here).
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

if (!(global as any)._mongoClientPromise) {
  client = new MongoClient(MONGODB_URI);
  (global as any)._mongoClientPromise = client.connect();
}

clientPromise = (global as any)._mongoClientPromise;

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
