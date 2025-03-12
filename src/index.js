const express = require("express");
const WebSocket = require("ws");
const path = require("path");

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

// Start the server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Attach WebSocket server to the same Express server
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
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
process.on("SIGTERM", () => {
    console.log("⚠️ Shutting down server...");
    server.close(() => console.log("✅ HTTP Server closed."));
    wss.close(() => console.log("✅ WebSocket Server closed."));
});

console.log("✅ Server is set up and waiting for connections...");
