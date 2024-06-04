"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
const mongodb_1 = require("mongodb");
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/';
let client = null;
let clientPromise = null;
const getClient = async () => {
    if (client && clientPromise) {
        return clientPromise;
    }
    client = new mongodb_1.MongoClient(MONGODB_URI);
    clientPromise = client.connect();
    return clientPromise;
};
async function connectToDatabase() {
    try {
        const mongoClient = await getClient();
        const db = mongoClient.db('Pick6');
        // @ts-ignore
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        return db;
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}
exports.connectToDatabase = connectToDatabase;
