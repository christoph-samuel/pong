const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
    cors: {
        // origin: "http://localhost:8080",
        origin: "http://10.21.103.234:8080",
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
    let topLeftBlock = 0
    let topRightBlock = 0
    let heightLeftBlock = 0
    let heightRightBlock = 0

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
    socket.on("key pressed", ({number, left, topLeftBlock, topRightBlock, heightLeftBlock, heightRightBlock}) => {
        if (left) {
            if (topLeftBlock === 0 && number > 0 || topLeftBlock === 100-heightLeftBlock && number < 0 || topLeftBlock > 0 && topLeftBlock < 100-heightLeftBlock) {
                topLeftBlock += number
            }
        } else {
            if (topRightBlock === 0 && number > 0 || topRightBlock === 100-heightRightBlock && number < 0 || topRightBlock > 0 && topRightBlock < 100-heightRightBlock) {
                topRightBlock += number
            }
        }

        this.topLeftBlock = topLeftBlock
        this.topRightBlock = topRightBlock
        this.heightLeftBlock = heightLeftBlock
        this.heightRightBlock = heightRightBlock

        io.emit("key pressed", {
            topLeftBlock,
            topRightBlock,
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
        let topBallOld = topBall
        let leftBallOld = leftBall
        let block = null
        let gameStarted = true
        let newThis = this

        ballInterval = setInterval(() => {
            // obere Kante
            if (topBall === 0 && moveVertical < 0) {
                moveVertical *= -1
            }
            // untere Kante
            if (topBall === availableHeight && moveVertical > 0) {
                moveVertical *= -1
            }
            // linke Kante
            if (leftBall <= leftBlockBorder && topBall >= newThis.topLeftBlock && bottomBall <= newThis.topLeftBlock+newThis.heightLeftBlock) {
                moveHorizontal *= -1
            } else if (leftBall === 0 && moveHorizontal < 0) {
                gameStarted = false
                block = "right"
                topBall = topBallOld
                leftBall = leftBallOld
                socket.emit("Score:", block)
                clearInterval(ballInterval)
            }
            // rechte Kante
            if (leftBall >= rightBlockBorder && topBall >= newThis.topRightBlock && bottomBall <= newThis.topRightBlock+newThis.heightRightBlock) {
                moveHorizontal *= -1
            } else if (leftBall === availableWidth && moveHorizontal > 0) {
                gameStarted = false
                block = "left"
                topBall = topBallOld
                leftBall = leftBallOld
                socket.emit("Score:", block)
                clearInterval(ballInterval)
            }

            if (gameStarted) {
                topBall += moveVertical
                leftBall += moveHorizontal
            }

            io.emit("move", {
                topBall: topBall,
                leftBall: leftBall,
                block
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
