// picksController.ts
import { connectToDatabase } from '../microservices/connectDB';
import { fetchMLBData, transformDataForNFL } from './dataController';

export async function fetchAndUpdatePicks() {
    try {
        const apiData = await fetchMLBData();  // Fetch and process MLB data
        const transformedData = transformDataForNFL(apiData);  // Transform it into NFL format

        const database = await connectToDatabase();
        const weeklyPicksCollection = database.collection('weeklyPicks');

        // Update the database with the new data
        await weeklyPicksCollection.updateOne(
            { identifier: 'current' },
            { $set: { picks: transformedData, updated: new Date() } },
            { upsert: true }
        );

        return transformedData;  // Optionally return the transformed data
    } catch (error) {
        console.error('Failed to fetch and update picks:', error);
        throw error;
    }
}
