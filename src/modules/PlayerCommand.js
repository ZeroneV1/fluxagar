var Logger = require('./Logger');
var UserRoleEnum = require("../enum/UserRoleEnum");
// PlayerCommand.js
var Commands = require('./CommandList'); // Correct relative path

function PlayerCommand(gameServer, playerTracker) {
    this.gameServer = gameServer;
    this.playerTracker = playerTracker;
}

module.exports = PlayerCommand;

PlayerCommand.prototype.writeLine = function (text) {
    this.gameServer.sendChatMessage(null, this.playerTracker, text);
};

PlayerCommand.prototype.executeCommandLine = function (commandLine) {
    if (!commandLine) return;

    // Splits the string
    var args = commandLine.split(" ");

    // Process the first string value
    var first = args[0].toLowerCase();

    // Get command function
    var execute = playerCommands[first];
    if (typeof execute != 'undefined') {
        execute.bind(this)(args);
    } else {
        this.writeLine("ERROR: Unknown command, type /help for command list");
    }
};


PlayerCommand.prototype.userLogin = function (ip, password) {
    if (!password) return null;
    password = password.trim();
    if (!password) return null;
    for (var i = 0; i < this.gameServer.userList.length; i++) {
        var user = this.gameServer.userList[i];
        if (user.password != password)
            continue;
        if (user.ip && user.ip != ip && user.ip != "*") // * - means any IP
            continue;
        return user;
    }
    return null;
};

var playerCommands = {
help: function (args) {
    this.writeLine("~~~~~~~~~~~~ COMMAND LIST ~~~~~~~~~~~~");

    let commandsPerRow = 3; // Number of columns per row
    let availableCommands = [];

    // Scan PlayerCommand.js for available commands dynamically
    for (let cmd in playerCommands) {
        let commandFunction = playerCommands[cmd].toString();

        // Check if the command has role-based restrictions
        if (!commandFunction.includes("this.playerTracker.userRole")) {
            availableCommands.push(cmd); // No role restriction, available to all users
        } else {
            // Check role restriction
            if (
                (this.playerTracker.userRole == UserRoleEnum.ADMIN && commandFunction.includes("UserRoleEnum.ADMIN")) ||
                (this.playerTracker.userRole == UserRoleEnum.MODER && commandFunction.includes("UserRoleEnum.MODER")) ||
                (this.playerTracker.userRole == UserRoleEnum.USER && commandFunction.includes("UserRoleEnum.USER"))
            ) {
                availableCommands.push(cmd);
            }
        }
    }

    // Find the longest command length
    let maxCommandLength = Math.max(...availableCommands.map(cmd => cmd.length));

    // Add padding to each command based on the longest command
    let paddedCommands = availableCommands.map(cmd => cmd.padEnd(maxCommandLength));

    // Print commands in a column format
    let row = "";
    for (let i = 0; i < paddedCommands.length; i++) {
        row += "/" + paddedCommands[i] + "| "; // Add each command with a separator

        // Break into a new row after 'commandsPerRow' commands
        if ((i + 1) % commandsPerRow === 0 || i === paddedCommands.length - 1) {
            this.writeLine(row.trim());
            row = ""; // Reset row for next line
        }
    }

    this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
},




    id: function (args) {
        this.writeLine("Your PlayerID is " + this.playerTracker.pID);
    },
    skin: function (args) {
        if (this.playerTracker.cells.length) {
            this.writeLine("ERROR: Cannot change skin while player in game!");
            return;
        }
        var skinName = "";
        if (args[1]) skinName = args[1];
        this.playerTracker.setSkin(skinName);
        if (skinName == "")
            this.writeLine("Your skin was removed");
        else
            this.writeLine("Your skin set to " + skinName);
    },


        commitdie: function (args) {
        if (!this.playerTracker.cells.length) {
            this.writeLine("You cannot kill yourself, because you're still not joined to the game!");
            return;
        }
        while (this.playerTracker.cells.length) {
            var cell = this.playerTracker.cells[0];
            this.gameServer.removeNode(cell);
            // replace with food
            var food = require('../entity/Food');
            food = new food(this.gameServer, null, cell.position, cell._size);
            food.color = cell.color;
            this.gameServer.addNode(food);
        }
        this.writeLine("You commited die...");
            this.writeLine("RIP you...");
    },
    
            bc: function (args) {
           if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
       this.gameServer.sendChatMessage(null, null, "BROADCAST: "  + String(args.slice(1, args.length).join(" ")));
        },
    
    killall: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var count = 0;
        var cell = this.playerTracker.cells[0];
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            var playerTracker = this.gameServer.clients[i].playerTracker;
            while (playerTracker.cells.length > 0) {
                this.gameServer.removeNode(playerTracker.cells[0]);
                count++;
            }
        }
        this.writeLine("You killed everyone. (" + count + (" cells.)"));
    },

    mass: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = parseInt(args[1]);
        var id = parseInt(args[2]);
        var size = Math.sqrt(mass * 100);

        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }

        if (isNaN(id)) {
            this.writeLine("Warn: missing ID arguments. This will change your mass.");
            for (var i in this.playerTracker.cells) {
                this.playerTracker.cells[i].setSize(size);
            }
            this.writeLine("Set mass of " + this.playerTracker._name + " to " + size * size / 100);
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {
                    for (var j in client.cells) {
                        client.cells[j].setSize(size);
                    }
                    this.writeLine("Set mass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your mass to " + size * size / 100;
                    this.gameServer.sendChatMessage(null, client, text);
                    break;
                }
            }
        }

    },
    spawnmass: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var mass = parseInt(args[1]);
        var id = parseInt(args[2]);
        var size = Math.sqrt(mass * 100);

        if (isNaN(mass)) {
            this.writeLine("ERROR: missing mass argument!");
            return;
        }

        if (isNaN(id)) {
            this.playerTracker.spawnmass = size;
            this.writeLine("Warn: missing ID arguments. This will change your spawnmass.");
            this.writeLine("Set spawnmass of " + this.playerTracker._name + " to " + size * size / 100);
        } else {
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {
                    client.spawnmass = size;
                    this.writeLine("Set spawnmass of " + client._name + " to " + size * size / 100);
                    var text = this.playerTracker._name + " changed your spawn mass to " + size * size / 100;
                    this.gameServer.sendChatMessage(null, client, text);
                }
            }
        }
    },
    
    
        pl: function(args) {
if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
this.writeLine("ERROR: access denied!");
return;
}
var clients = this.gameServer.clients;
clients.sort(function(a, b) { return a.playerTracker.pID - b.playerTracker.pID; });
for (var i = 0; i < clients.length; ++i) {
var client = clients[i].playerTracker;
var socket = clients[i];
var ip = client.isMi ? "[MINION]" : "BOT";
if (socket.isConnected && !client.isMi) {
ip = socket.remoteAddress;
}
var protocol = this.gameServer.clients[i].packetHandler.protocol;
if (!protocol) {
protocol = "?";
}
var data = "ID: " + client.pID + " - NICK: " + client._name + " - IP: " + ip;
this.writeLine(data);
}
},
    
    
    
    minion: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        var add = args[1];
        var id = parseInt(args[2]);
        var player = this.playerTracker;

        /** For you **/
        if (isNaN(id)) {
            this.writeLine("Warn: missing ID arguments. This will give you minions.");
            // Remove minions
            if (player.minionControl == true && add == "remove") {
                player.minionControl = false;
                player.miQ = 0;
                this.writeLine("Succesfully removed minions for " + player._name);
                // Add minions
            } else {
                player.minionControl = true;
                // Add minions for self
                if (isNaN(parseInt(add))) add = 1;
                for (var i = 0; i < add; i++) {
                    this.gameServer.bots.addMinion(player);
                }
                this.writeLine("Added " + add + " minions for " + player._name);
            }

        } else {
            /** For others **/
            for (var i in this.gameServer.clients) {
                var client = this.gameServer.clients[i].playerTracker;
                if (client.pID == id) {

                    // Prevent the user from giving minions, to minions
                    if (client.isMi) {
                        Logger.warn("You cannot give minions to a minion!");
                        return;
                    };

                    // Remove minions
                    if (client.minionControl == true) {
                        client.minionControl = false;
                        client.miQ = 0;
                        this.writeLine("Succesfully removed minions for " + client._name);
                        var text = this.playerTracker._name + " removed all off your minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                        // Add minions
                    } else {
                        client.minionControl = true;
                        // Add minions for client
                        if (isNaN(add)) add = 1;
                        for (var i = 0; i < add; i++) {
                            this.gameServer.bots.addMinion(client);
                        }
                        this.writeLine("Added " + add + " minions for " + client._name);
                        var text = this.playerTracker._name + " gave you " + add + " minions.";
                        this.gameServer.sendChatMessage(null, client, text);
                    }
                }
            }
        }
    },
    
dm: function (args) {
    var player = this.playerTracker;

    // Check if the player has the necessary role
    if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
        this.writeLine("ERROR: access denied!");
        return;
    }

    var id = args[1];
    var msg = args[2];

    if (id.length < 1) {
        this.writeLine("ERROR: missing id argument!");
        return;
    }

    if (msg.length < 1) {
        this.writeLine("ERROR: missing message argument!");
        return;
    }

    // Send the direct message
    this.gameServer.sendChatMessage(player, id, msg);
},

    
    addbot: function (args) {
        var add = parseInt(args[1]);
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        for (var i = 0; i < add; i++) {
            this.gameServer.bots.addBot();
        }
        Logger.warn(this.playerTracker.socket.remoteAddress + "ADDED " + add + " BOTS");
        this.writeLine("Added " + add + " Bots");
    },
    status: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN && this.playerTracker.userRole != UserRoleEnum.MODER) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        // Get amount of humans/bots
        var humans = 0,
            bots = 0;
        for (var i = 0; i < this.gameServer.clients.length; i++) {
            if ('_socket' in this.gameServer.clients[i]) {
                humans++;
            } else {
                bots++;
            }
        }
        var ini = require('./ini.js');
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
        this.writeLine("Connected players: " + this.gameServer.clients.length + "/" + this.gameServer.config.serverMaxConnections);
        this.writeLine("Players: " + humans + " - Bots: " + bots);
        this.writeLine("Server has been running for " + Math.floor(process.uptime() / 60) + " minutes");
        this.writeLine("Current memory usage: " + Math.round(process.memoryUsage().heapUsed / 1048576 * 10) / 10 + "/" + Math.round(process.memoryUsage().heapTotal / 1048576 * 10) / 10 + " mb");
        this.writeLine("Current game mode: " + this.gameServer.gameMode.name);
        this.writeLine("Current update time: " + this.gameServer.updateTimeAvg.toFixed(3) + " [ms]  (" + ini.getLagMessage(this.gameServer.updateTimeAvg) + ")");
        this.writeLine("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
    },
    login: function (args) {
        var password = args[1] + "";
        if (password.length < 1) {
            this.writeLine("ERROR: missing password argument!");
            return;
        }
        var user = this.userLogin(this.playerTracker.socket.remoteAddress, password);
        if (!user) {
            this.writeLine("ERROR: login failed!");
            return;
        }
        Logger.write("LOGIN        " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + user.name + "\"");
        this.playerTracker.userRole = user.role;
        this.playerTracker.userAuth = user.name;
        this.writeLine("Login done as \"" + user.name + "\"");
        return;
    },
    logout: function (args) {
        if (this.playerTracker.userRole == UserRoleEnum.GUEST) {
            this.writeLine("ERROR: not logged in");
            return;
        }
        Logger.write("LOGOUT       " + this.playerTracker.socket.remoteAddress + ":" + this.playerTracker.socket.remotePort + " as \"" + this.playerTracker.userAuth + "\"");
        this.playerTracker.userRole = UserRoleEnum.GUEST;
        this.playerTracker.userAuth = null;
        this.writeLine("Logout done");
    },
    shutdown: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
        Logger.warn("SHUTDOWN REQUEST FROM " + this.playerTracker.socket.remoteAddress + " as " + this.playerTracker.userAuth);
        process.exit(0);
    },
    speed: function (args) {
        if (this.playerTracker.userRole != UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: access denied!");
            return;
        }
      
      
        Commands.list.speed.call(this, this.gameServer, args);
    },
    merge: function (args) {
        // Check if the player is an admin
        if (this.playerTracker.userRole !== UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: Command not found!");
            return;
        }

        // Check if the player has more than one cell
        if (this.playerTracker.cells.length <= 1) {
            this.writeLine("You need at least 2 cells to merge!");
            return;
        }

        // Force merge all cells
        this.playerTracker.mergeOverride = true;
        this.writeLine("All your cells are now merging!");
    },
    rainbow: function (args) {
        // Check if the player is an admin
        if (this.playerTracker.userRole !== UserRoleEnum.ADMIN) {
            this.writeLine("ERROR: You must be an admin to use this command!");
            return;
        }

        // Check if the player has cells
        if (this.playerTracker.cells.length === 0) {
            this.writeLine("You need to have at least one cell to use this command!");
            return;
        }

        // Rainbow effect duration (10 seconds)
        const duration = 10000; // 10 seconds in milliseconds
        const interval = 100; // Change color every 1 second
        let elapsedTime = 0;

        // Function to generate a random color
        const getRandomColor = () => {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            return { r, g, b };
        };

        // Start the rainbow effect
        const rainbowInterval = setInterval(() => {
            // Generate a random color
            const newColor = getRandomColor();

            // Apply the color to all the player's cells
            for (const cell of this.playerTracker.cells) {
                cell.color = newColor;
            }

            // Update the elapsed time
            elapsedTime += interval;

            // Stop the effect after the duration is over
            if (elapsedTime >= duration) {
                clearInterval(rainbowInterval);
                this.writeLine("Rainbow effect ended!");
            }
        }, interval);

        this.writeLine("Rainbow effect started! Your cells will change colors for 10 seconds.");
    },


};
