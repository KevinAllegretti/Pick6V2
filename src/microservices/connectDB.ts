import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

const getClient = async (): Promise<MongoClient> => {
  if (client && clientPromise) {
    return clientPromise;
  }
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
  return clientPromise;
};

export async function connectToDatabase(): Promise<Db> {
  try {
    const mongoClient = await getClient();
    const db = mongoClient.db('Pick6');

    // Set up unique index for the username field in the users collection
    await db.collection('users').createIndex({ username: 1 }, { unique: true });

    return db;
  } catch (error: any) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}
