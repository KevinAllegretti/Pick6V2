"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
//connectDB.ts
const mongodb_1 = require("mongodb");
// If MONGODB_URI is not set, the fallback URI will be used (You should have a real URI here).
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/';
let client;
let clientPromise;
if (!global._mongoClientPromise) {
    client = new mongodb_1.MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;
async function connectToDatabase() {
    try {
        await clientPromise;
        // Get the database object
        const db = client.db('Pick6');
        // Set up unique index for the username field in the users collection
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        return db;
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}
exports.connectToDatabase = connectToDatabase;
