const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:8080",
    // origin: "http://10.21.103.234:8080",
  },
});

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  // fetch existing users
  const users = [];
  let i = 0;

  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
      left: i === 0,
    });
    i++
  }
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
  });

  // forward the pressed key to the opponent
  socket.on("key pressed", ({ number, left }) => {
    io.emit("key pressed", {
      number: number,
      left: left,
    });
  });

  // inform the players that the game has started
  socket.on("game started", (start) => {
    io.emit("game started", {
      start,
      moveVertical: Math.round(Math.random()) === 0 ? -1 : 1,
      moveHorizontal: Math.round(Math.random()) === 0 ? -1 : 1,
    });
  });

  // forward the change of the score to the players
  socket.on("scored", ({block}) => {
    io.emit("scored", {
      block
    });
  });

  // notify users upon disconnection
  socket.on("disconnect", () => {
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  // console.log(`server listening at http://localhost:${PORT}`)
  console.log(`server listening at http://10.21.103.234:${PORT}`)
);
