/*import { MongoClient } from 'mongodb';


const uri = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/'; // Replace with your MongoDB connection string
let client;
let clientPromise;

export async function connectToDatabase() {
  if (!client) {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  try {
    await clientPromise;
    console.log("Successfully connected to the database!");
    return client.db('Pick6');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}
*/
import { MongoClient,  MongoClientOptions } from 'mongodb';

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
    console.log("Successfully connected to the database!");
    return client.db('Pick6');
  } catch (error) {
    console.error('Error connecting to the database:', error);
    throw error;
  }
}
