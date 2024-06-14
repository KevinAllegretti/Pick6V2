import WebSocket from 'ws';

export const wss = new WebSocket.Server({ port: 8080 }, () => {
    console.log('WebSocket server started on port 8080');
});

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
            client.send(JSON.stringify(scores));
        }
    });
}
