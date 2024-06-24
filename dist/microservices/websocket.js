"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastScores = exports.wss = void 0;
const ws_1 = __importDefault(require("ws"));
const http_1 = require("http");
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
// Create an HTTP server
const server = (0, http_1.createServer)(app);
// Create a WebSocket server on the same HTTP server
exports.wss = new ws_1.default.Server({ server });
exports.wss.on('connection', ws => {
    console.log('New client connected');
    ws.send(JSON.stringify({ message: 'Welcome to the WebSocket server' }));
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
function broadcastScores(scores) {
    exports.wss.clients.forEach(client => {
        if (client.readyState === ws_1.default.OPEN) {
            client.send(JSON.stringify({ type: 'scores', data: scores }));
        }
    });
}
exports.broadcastScores = broadcastScores;
// Serve static files
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
