/*import WebSocket from 'ws';
import { createServer } from 'http';
import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 8080;

// Create an HTTP server
const server = createServer(app);

// Create a WebSocket server on the same HTTP server
export const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('New client connected');
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server' }));

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

export function broadcastScores(scores: any[]) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'scores', data: scores }));
        }
    });
}

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
*/