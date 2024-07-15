import axios from 'axios';
import { connectToDatabase } from '../microservices/connectDB';

interface Injury {
    player: {
        id: number;
        name: string;
        image: string;
    };
    team: {
        id: number;
        name: string;
        logo: string;
    };
    date: string;
    description: string;
    status: string;
}

const teamIds = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32
]; // Array of all team IDs

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchInjuriesWithRetry = async (teamId: number, retries: number = 5): Promise<Injury[]> => {
    let attempt = 0;
    while (attempt < retries) {
        try {
            const response = await axios.get<{ response: Injury[] }>('https://api-american-football.p.rapidapi.com/injuries', {
                params: { team: teamId },
                headers: {
                    'X-RapidAPI-Key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e',
                    'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com'
                }
            });
            return response.data.response;
        } catch (error: any) {
            if (error.response && error.response.status === 429) {
                const waitTime = Math.pow(2, attempt) * 1000;
                console.log(`Rate limit exceeded for team ${teamId}. Retrying in ${waitTime / 1000} seconds...`);
                await delay(waitTime);
                attempt++;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Failed to fetch injuries for team ${teamId} after ${retries} attempts`);
};

export const fetchAndSaveInjuries = async () => {
    try {
        let injuries: Injury[] = [];

        for (let i = 0; i < teamIds.length; i++) {
            const teamId = teamIds[i];
            const teamInjuries = await fetchInjuriesWithRetry(teamId);
            injuries = injuries.concat(teamInjuries);

            // Adding a delay of 1 second between requests
            await delay(1000);

            // If we have made 10 requests, wait for 1 minute and 15 seconds to avoid rate limiting
            if ((i + 1) % 10 === 0) {
                console.log('Waiting for 1 minute and 15 seconds to avoid rate limit...');
                await delay(75000); // 1 minute and 15 seconds
            }
        }

        console.log('Injury API response:', injuries); // Log the API response

        if (injuries.length === 0) {
            throw new Error('No injury data found.');
        }

        const db = await connectToDatabase();
        const injuryCollection = db.collection('injuries');

        const bulkOps = injuries.map(injury => ({
            updateOne: {
                filter: { 'player.id': injury.player.id },
                update: { $set: injury },
                upsert: true
            }
        }));

        await injuryCollection.bulkWrite(bulkOps);
        console.log('Injuries fetched and saved successfully.');
    } catch (error: any) {
        console.error('Error fetching and saving injuries:', error);
        throw error;
    }
};