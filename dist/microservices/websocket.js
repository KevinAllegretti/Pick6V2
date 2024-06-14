"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcastScores = exports.wss = void 0;
const ws_1 = __importDefault(require("ws"));
exports.wss = new ws_1.default.Server({ port: 3000 }, () => {
    console.log('WebSocket server started on port 3000');
});
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
            client.send(JSON.stringify(scores));
        }
    });
}
exports.broadcastScores = broadcastScores;
