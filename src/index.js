const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const process = require("process");

const app = express();
const PORT = process.env.PORT || 1337; // Railway assigns this dynamically

// Serve static files from the 'web' directory
app.use(express.static(path.join(__dirname, "web")));

// Start Express server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Attach WebSocket server to the same Express server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
    console.log("🔌 A client connected!");

    ws.send("✅ Welcome to the WebSocket server!");

    ws.on("message", (message) => {
        console.log(`📩 Received: ${message}`);
    });

    ws.on("error", (err) => {
        console.error("⚠️ WebSocket Error:", err);
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
    });
});

// Graceful shutdown handling
const shutdown = () => {
    console.log("⚠️ Shutting down server...");
    
    wss.clients.forEach(client => client.close());
    wss.close(() => console.log("✅ WebSocket Server closed."));

    server.close(() => {
        console.log("✅ HTTP Server closed.");
        process.exit(0);
    });
};

// Handle process exit signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("✅ Server is set up and waiting for connections...");
