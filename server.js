
import http from "node:http";
import fs from "node:fs";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 3001;

// Create the HTTP server
const server = http.createServer((req, res) => {
  fs.readFile("./public/index.html", (err, data) => {
    if (err) {
      res.writeHead(500, {
        "Content-Type": "text/plain"
      });
      res.end("Internal Server Error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": "text/html"
    });

    res.end(data);
  });
});

// Create the WebSocket server
const wss = new WebSocketServer({ server });

// Send messages to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Handle new connections
wss.on("connection", (socket, req) => {
  const username = new URL(
    req.url,
    "http://localhost"
  ).searchParams.get("username");

  // Broadcast when a user joins
  broadcast({
    type: "system",
    text: `${username} joined`
  });

  // Broadcast incoming chat messages
  socket.on("message", (data) => {
    const { username, text } = JSON.parse(data.toString());

    broadcast({
      type: "chat",
      username,
      text
    });
  });

  // Broadcast when a user leaves
  socket.on("close", () => {
    broadcast({
      type: "system",
      text: `${username} left`
    });
  });
});

// Start the server
server.listen(PORT, () => {
  console.log("Chat server running at http://localhost:3001");
});

