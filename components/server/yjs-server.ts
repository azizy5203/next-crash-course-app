// server/yjs-server.ts
import http from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import * as Y from 'yjs';

const server = http.createServer();
const wss = new WebSocketServer({ server });

// Store Yjs documents in memory (for demo purposes)
const docs = new Map<string, Y.Doc>();

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage) => {
  console.log('New WebSocket connection');
  
  // Extract room name from URL (e.g., /room-name)
  const roomName = req.url?.slice(1) || 'default-room';
  
  // Get or create Yjs document for this room
  if (!docs.has(roomName)) {
    docs.set(roomName, new Y.Doc());
  }
  
  // Handle WebSocket messages
  ws.on('message', (message: WebSocket.Data) => {
    // Simple broadcast to all other clients in the same room
    wss.clients.forEach((client: WebSocket) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(1234, () => console.log('Yjs server running on port 1234'));
