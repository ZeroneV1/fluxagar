const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const http = require("http");

// Import your original game server code
const GameServer = require("./GameServer"); // Adjust the path to your GameServer.js file

// Create an Express app
const app = express();
const PORT = process.env.PORT || 1337; // Railway assigns this dynamically

// Serve static files from the root directory (index.css, index.js, etc.)
app.use(express.static(__dirname));  // Serving from the root directory now

// Serve specific files with custom routes
app.get("/gameserver.js", (req, res) => {
    res.sendFile(path.join(__dirname, "gameserver.js"));
});

app.get("/gameserver.mk", (req, res) => {
    res.sendFile(path.join(__dirname, "gameserver.mk"));
});

// Serve index.html when accessing "/"
app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "index.html");
    console.log("Attempting to serve index.html from:", indexPath); // Log the path
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error("Error serving index.html:", err);
            res.status(500).send("Error serving the page.");
        }
    });
});

// Create an HTTP server using Express
const server = http.createServer(app);

// Attach WebSocket server to the same HTTP server
const wss = new WebSocket.Server({ server });

// Initialize and start the game server
const gameServer = new GameServer(server); // Pass the HTTP server to the game server
gameServer.start(); // Start the game server

// WebSocket connection handler
wss.on("connection", (ws) => {
    console.log("🔌 A client connected!");
    ws.send("✅ Welcome to the WebSocket server!");

    // Forward WebSocket messages to the game server
    ws.on("message", (message) => {
        console.log(`📩 Received: ${message}`);
        gameServer.handleWebSocketMessage(ws, message); // Pass the message to the game server
    });

    ws.on("error", (err) => {
        console.error("⚠️ WebSocket Error:", err);
    });

    ws.on("close", () => {
        console.log("❌ Client disconnected");
        gameServer.handleWebSocketClose(ws); // Notify the game server of the disconnection
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown handling
process.on("SIGTERM", () => {
    console.log("⚠️ Shutting down server...");
    server.close(() => console.log("✅ HTTP Server closed."));
    wss.close(() => console.log("✅ WebSocket Server closed."));
    gameServer.shutdown(); // Shut down the game server gracefully
});

console.log("✅ Server is set up and waiting for connections...");
