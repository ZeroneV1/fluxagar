// Imports
const express = require("express");
const WebSocket = require("ws");
const path = require("path");
const http = require("http");
const figlet = require("figlet");
const Logger = require('./modules/Logger');
const Commands = require('./modules/CommandList');
const GameServer = require('./GameServer'); // Path to your GameServer.js file

// Init variables
var showConsole = true;
var gameServer = new GameServer(); // Initialize GameServer

// Create an Express app
const app = express();
const PORT = process.env.PORT || 1337; // Railway assigns this dynamically

// Serve static files from the root directory (index.css, index.js, etc.)
app.use(express.static(__dirname)); // Serving from the root directory now

// Serve specific files with custom routes for gameserver.js and gameserver.mk
app.get("/gameserver.js", (req, res) => {
    res.sendFile(path.join(__dirname, "gameserver.js"));
});

app.get("/gameserver.mk", (req, res) => {
    res.sendFile(path.join(__dirname, "gameserver.mk"));
});

// Serve index.html when accessing "/"
app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "index.html");
    console.log("Attempting to serve index.html from:", indexPath);
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

// Initialize and start the game server
gameServer.start(); // Start the game server

// Handle arguments for game server initialization
process.argv.forEach(function (item) {
    switch (item) {
        case "--help":
            console.log("Proper Usage: node index.js");
            console.log("    -n, --name             Set name");
            console.log("    -g, --gameport         Set game port");
            console.log("    -s, --statsport        Set stats port");
            console.log("    -m, --gamemode         Set game mode (id)");
            console.log("    -c, --connections      Set max connections limit");
            console.log("    -t, --tracker          Set serverTracker");
            console.log("    -l, --light-background Set a light-background colorscheme for logger");
            console.log("    --noconsole            Disables the console");
            console.log("    --help                 Help menu");
            console.log("");
            break;

        case "-n":
        case "--name":
            setParam("serverName", getValue(item));
            break;

        case "-g":
        case "--gameport":
            setParam("serverPort", parseInt(getValue(item)));
            break;

        case "-s":
        case "--statsport":
            setParam("serverStatsPort", parseInt(getValue(item)));
            break;

        case "-m":
        case "--gamemode":
            setParam("serverGamemode", getValue(item));
            break;

        case "-c":
        case "--connections":
            setParam("serverMaxConnections", parseInt(getValue(item)));
            break;

        case "-t":
        case "--tracker":
            setParam("serverTracker", parseInt(getValue(item)));
            break;

        case "-l":
        case "--light-background":
            // Processed before logger initialization
            break;

        case "--noconsole":
            showConsole = false;
            break;
    }
});

// Set logger colorscheme
function setLoggerColorscheme() {
    if (process.argv.indexOf("-l") != -1 || process.argv.indexOf("--light-background") != -1) {
        Logger.setLightBackgroundColorscheme();
    }
}

// Get value for a parameter
function getValue(param) {
    var ind = process.argv.indexOf(param);
    var item = process.argv[ind + 1];
    if (!item || item.indexOf('-') != -1) {
        Logger.error("No value for " + param);
        return null;
    } else {
        return item;
    }
}

// Set parameter for the game server
function setParam(paramName, val) {
    if (!gameServer.config.hasOwnProperty(paramName)) {
        Logger.error("Wrong parameter");
    }
    if (val || val === 0) {
        if (typeof val === 'string') {
            val = "'" + val + "'";
        }
        eval("gameServer.config." + paramName + "=" + val);
    }
}

// Console functions
if (showConsole) {
    const readline = require('readline');
    const in_ = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    setTimeout(prompt, 100);
}

function prompt() {
    in_.question(">", function (str) {
        try {
            parseCommands(str);
        } catch (err) {
            Logger.error(err.stack);
        } finally {
            setTimeout(prompt, 0);
        }
    });
}

function parseCommands(str) {
    Logger.write(">" + str);

    if (str === '') return;

    var split = str.split(" ");
    var first = split[0].toLowerCase();
    var execute = Commands.list[first];

    if (typeof execute !== 'undefined') {
        execute(gameServer, split);
    } else {
        Logger.warn("Invalid Command!");
    }
}

figlet(('MultiOgar-Edited  ' + gameServer.version), function (err, data) {
    if (err) {
        console.log('Something went wrong...');
        console.dir(err);
        return;
    }
    console.log(data)
});

// Start the HTTP server and WebSocket server
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
