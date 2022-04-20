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

    let ballInterval = null

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
    socket.on("key pressed", ({number, left}) => {
        io.emit("key pressed", {
            number: number,
            left: left,
        });
    });

    // inform the players that the game has started
    socket.on("game started", ({
                                   start,
                                   speed,
                                   topBall,
                                   leftBall,
                                   widthHeightBall,
                                   availableHeight,
                                   availableWidth,
                                   leftBlockBorder,
                                   rightBlockBorder
                               }) => {
        io.emit("game started", {
            start,
        });

        let moveVertical = Math.round(Math.random()) === 0 ? -1 : 1
        let moveHorizontal = Math.round(Math.random()) === 0 ? -1 : 1
        let bottomBall = topBall + widthHeightBall
        let block = null

        const hund = []
        hund.push({
            start,
            speed,
            topBall,
            leftBall,
            widthHeightBall,
            availableHeight,
            availableWidth,
            leftBlockBorder,
            rightBlockBorder,
            moveVertical,
            moveHorizontal,
            bottomBall,
            block
        })
        socket.emit("MOVE", hund)

        ballInterval = setInterval(() => {
            // obere Kante
            if (topBall === 0 && moveVertical < 0) {
                moveVertical *= -1
            }
            // untere Kante
            if (topBall === availableHeight && moveVertical > 0) {
                moveVertical *= -1
            }
            // FAKE CODE:
            if (leftBall <= 0 && moveHorizontal < 0) {
                moveHorizontal *= -1
            }
            if (leftBall >= availableWidth && moveHorizontal > 0) {
                moveHorizontal *= -1
            }

            // ECHTER CODE:
            // linke Kante
            // if (leftBall <= leftBlockBorder && topBall >= topLeftBlock && bottomBall <= bottomLeftBlock) {
            //     moveHorizontal *= -1
            // } else if (leftBall === 0 && moveHorizontal < 0) {
            //     // this.gameStarted = false
            //     block = "right"
            //     // this.resetBall()
            // }
            // // rechte Kante
            // if (leftBall >= rightBlockBorder && topBall >= topRightBlock && bottomBall <= bottomRightBlock) {
            //     moveHorizontal *= -1
            // } else if (leftBall === availableWidth && moveHorizontal > 0) {
            //     // this.gameStarted = false
            //     block = "left"
            //     // this.resetBall()
            // }
            //
            // for (let i = 0; i < this.users.length; i++) {
            //     if (block && this.users[i].self && this.users[i].left) {
            //         socket.emit("scored", {
            //             block: block
            //         });
            //         block = null;
            //     }
            // }

            topBall += moveVertical
            leftBall += moveHorizontal

            io.emit("move", {
                topBall: topBall,
                leftBall: leftBall
            })
        }, speed)
    });

    // forward the change of the score to the players
    socket.on("scored", ({block}) => {
        io.emit("scored", {
            block
        });
    });

    // notify users upon disconnection
    socket.on("disconnect", () => {
        clearInterval(ballInterval)
        socket.broadcast.emit("user disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
    // console.log(`server listening at http://localhost:${PORT}`)
    console.log(`server listening at http://10.21.103.234:${PORT}`)
);
