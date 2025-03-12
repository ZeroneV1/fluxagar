const express = require("express");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 1337; // Railway assigns this dynamically

// Serve static files (index.css, images, etc.) from the "src" folder
app.use(express.static(path.join(__dirname, "src")));

// Serve index.html when accessing "/"
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "src", "index.html"));
});

// Start Express server
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
