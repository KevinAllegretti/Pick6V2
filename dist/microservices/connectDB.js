"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
const { MongoClient } = require("mongodb");
async function connectToDatabase() {
    const uri = 'mongodb+srv://Kingbeats17:Yunglean17@pick6.nomxpzq.mongodb.net/'; // Replace with your MongoDB connection string
    const client = new MongoClient(uri);
    console.log("Attempting to connect to the database...");
    try {
        await client.connect();
        console.log("Successfully connected to the database!");
        const database = client.db('Pick6');
        return database;
    }
    catch (error) {
        console.error('Error connecting to the database:', error);
        throw error;
    }
}
exports.connectToDatabase = connectToDatabase;
