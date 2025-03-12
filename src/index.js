const express = require("express");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 10000; // Render assigns this dynamically

// Serve static files (client)
app.use(express.static("web"));

// Start Express server (Only listens on the assigned port)
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Attach WebSocket server to the same Express server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
    console.log("A client connected!");
    ws.send("Welcome to the WebSocket server!");

    ws.on("message", (message) => {
        console.log(`Received: ${message}`);
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
    console.log("Shutting down server...");
    server.close(() => {
        console.log("HTTP Server closed.");
    });
    wss.close(() => {
        console.log("WebSocket Server closed.");
    });
});

console.log("Server is set up and waiting for connections...");
