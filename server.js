const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const players = {};

app.use(express.static(__dirname + "/public"));

app.get("/*", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", function (socket) {
  console.log("a user connected");
  const name = socket.handshake.query.token;
  let x;
  let y;

  if (name === "fran") {
    x = 80;
    y = 550;
  } else if (name === "lizz") {
    x = 120;
    y = 550;
  } else if (name === "rosie") {
    x = 160;
    y = 550;
  } else if (name === "chip") {
    x = 560;
    y = 500;
  }

  players[socket.id] = {
    rotation: 0,
    name: name,
    x: x,
    y: y,
    playerId: socket.id,
  };

  // send the players object to the new player
  socket.emit("currentPlayers", players);

  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);

  socket.on("disconnect", function () {
    console.log("user disconnected");
    // remove this player from our players object
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit("disconnected", socket.id);
  });

  // when a player moves, update the player data
  socket.on("playerMovement", function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerMoved", players[socket.id]);
  });

  socket.on("playerStopped", function () {
    // emit a message to all players about the player that moved
    socket.broadcast.emit("playerStopped", players[socket.id]);
  });

  socket.on("playerCollision", function (playerData) {
    const { id } = playerData;
    delete players[id];

    io.emit("playerGone", id);
  });
});

server.listen(process.env.PORT || 3003, () =>
  console.log("Server is running on port 3003")
);
