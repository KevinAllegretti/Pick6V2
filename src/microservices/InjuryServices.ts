import axios from 'axios';
import { connectToDatabase } from './connectDB';


async function fetchAndSaveInjuries() {
    try {
        const response = await axios.get('https://api-american-football.p.rapidapi.com/injuries', {
            headers: {
                'X-RapidAPI-Key': '3decff06f7mshbc96e9118345205p136794jsn629db332340e',
                'X-RapidAPI-Host': 'api-american-football.p.rapidapi.com'
            }
        });

        const injuries = response.data.response;

        const db = await connectToDatabase();
        const injuriesCollection = db.collection('injuries');

        // Clear existing injuries
        await injuriesCollection.deleteMany({});

        // Save new injuries
        await injuriesCollection.insertMany(injuries);

        console.log('Injuries fetched and saved successfully.');
    } catch (error:any) {
        console.error('Error fetching and saving injuries:', error);
    }
}

export { fetchAndSaveInjuries };
