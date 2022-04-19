<template>
  <div id="playground">
    <div id="leftBlock" ref="leftBlock" style="height: 10vh;width: 1vw;top: 20vh;left:0;"></div>
    <div id="ball" ref="ball" style="height: 2vw;width: 2vw;top: 25vh;left: 50vw;transform: translate(-50%,-50%)"></div>
    <div id="rightBlock" ref="rightBlock" style="height: 10vh;width: 1vw;top: 40vh;right:0;"></div>
    <div v-if="!gameStarted" id="startGame" ref="startGame" @click="startGame">START</div>
    <div id="user">{{user}}</div>
    <scoreboard
        :score-left="scoreLeft"
        :score-right="scoreRight"
    />
  </div>
</template>

<script>
import socket from "../socket";
import Scoreboard from "./Scoreboard";

export default {
  name: "Playground",

  components: {
    Scoreboard
  },

  props: {
    users: Array
  },

  data: () => {
    return {
      ballInterval: null,
      gameStarted: false,
      scoreLeft: 0,
      scoreRight: 0,
      speed: 50,
      user: "",
    }
  },

  created() {
    let newThis = this;

    document.addEventListener("keydown", function (event) {
      newThis.onKeyPressed(event.key);
    });

    socket.on("key pressed", ({number, left}) => {
      if (left) {
        let value = parseInt(this.$refs.leftBlock.style.top.replace(/(\d+)\w+/i, "$1"))
        let unit = this.$refs.leftBlock.style.top.replace(/\d+(\w+)/i, "$1")
        let availableHeight = 100 - parseInt(this.$refs.leftBlock.style.height.replace(/(\d+)\w+/i, "$1"))

        if (value === 0 && number > 0 || value === availableHeight && number < 0 || value > 0 && value < availableHeight) {
          this.$refs.leftBlock.style.top = value + number + unit
        }
      } else {
        let value = parseInt(this.$refs.rightBlock.style.top.replace(/(\d+)\w+/i, "$1"))
        let unit = this.$refs.rightBlock.style.top.replace(/\d+(\w+)/i, "$1")
        let availableHeight = 100 - parseInt(this.$refs.rightBlock.style.height.replace(/(\d+)\w+/i, "$1"))

        if (value === 0 && number > 0 || value === availableHeight && number < 0 || value > 0 && value < availableHeight) {
          this.$refs.rightBlock.style.top = value + number + unit
        }
      }
    });

    socket.on("game started", ({start, moveVertical, moveHorizontal}) => {
      newThis.gameStarted = start
      newThis.ballMovement(moveVertical, moveHorizontal)
    });

    socket.on("scored", ({block}) => {
      if (block === "left") {
        this.scoreLeft += 1
      } else if (block === "right") {
        this.scoreRight += 1
      }
    });
  },

  methods: {
    startGame() {
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].self) {
          this.user = this.users[i].username
        }
      }
      socket.emit("game started", {
        start: true
      });
    },

    onKeyPressed(key) {
      let number = 0;
      let user = null;

      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].self) {
          user = this.users[i];
        }
      }

      switch (key) {
        case "ArrowUp":
          number = -1;
          break;
        case "ArrowDown":
          number = 1;
          break;
        default:
          break;
      }

      socket.emit("key pressed", {
        number,
        left: user.left,
      });
    },

    ballMovement(moveVertical, moveHorizontal) {
      let newThis = this;
      this.$refs.ball.style.transform = "none"

      this.ballInterval = setInterval(() => {
        let widthBall = parseInt(newThis.$refs.ball.style.width.replace(/(\d+)\w+/i, "$1"))
        let topBall = parseInt(newThis.$refs.ball.style.top.replace(/(\d+)\w+/i, "$1"))
        let bottomBall = parseInt(newThis.$refs.ball.style.top.replace(/(\d+)\w+/i, "$1")) + parseInt(newThis.$refs.ball.style.height.replace(/(\d+)\w+/i, "$1"))
        let topLeftBlock = parseInt(newThis.$refs.leftBlock.style.top.replace(/(\d+)\w+/i, "$1"))
        let bottomLeftBlock = topLeftBlock + parseInt(newThis.$refs.leftBlock.style.height.replace(/(\d+)\w+/i, "$1"))
        let topRightBlock = parseInt(newThis.$refs.rightBlock.style.top.replace(/(\d+)\w+/i, "$1"))
        let bottomRightBlock = topRightBlock + parseInt(newThis.$refs.leftBlock.style.height.replace(/(\d+)\w+/i, "$1"))
        let left = parseInt(newThis.$refs.ball.style.left.replace(/(\d+)\w+/i, "$1"))
        let availableHeight = 100 - parseInt(newThis.$refs.ball.style.height.replace(/(\d+)\w+/i, "$1"))
        let availableWidth = 100 - widthBall
        let leftBlockBorder = parseInt(newThis.$refs.leftBlock.style.width.replace(/(\d+)\w+/i, "$1"))
        let rightBlockBorder = 100 - parseInt(newThis.$refs.rightBlock.style.width.replace(/(\d+)\w+/i, "$1")) - widthBall

        // obere Kante
        if (topBall === 0 && moveVertical < 0) {
          moveVertical *= -1
        }
        // untere Kante
        if (topBall === availableHeight && moveVertical > 0) {
          moveVertical *= -1
        }
        // linke Kante
        if (left <= leftBlockBorder && topBall >= topLeftBlock && bottomBall <= bottomLeftBlock) {
          moveHorizontal *= -1
        } else if (left === 0 && moveHorizontal < 0) {
          newThis.gameStarted = false
          socket.emit("scored", {
            block: "right"
          });
          newThis.resetBall()
        }
        // rechte Kante
        if (left >= rightBlockBorder && topBall >= topRightBlock && bottomBall <= bottomRightBlock) {
          console.log(left)
          console.log(rightBlockBorder)
          moveHorizontal *= -1
        } else if (left === availableWidth && moveHorizontal > 0) {
          newThis.gameStarted = false
          socket.emit("scored", {
            block: "left"
          });
          newThis.resetBall()
        }

        if (newThis.gameStarted) {
          this.$refs.ball.style.top = topBall + moveVertical + "vh"
          this.$refs.ball.style.left = left + moveHorizontal + "vw"
        }
      }, this.speed);
    },

    resetBall() {
      clearInterval(this.ballInterval)
      this.$refs.ball.style.top = 25 + "vh"
      this.$refs.ball.style.left = 50 + "vw"
      this.$refs.ball.style.transform = "translate(-50%, -50%)"
    }
  },

  destroyed() {
    clearInterval(this.ballInterval)
  }
}
</script>

<style scoped>
#playground {
  width: 100vw;
  height: 100vh;
  background: black;
}

#leftBlock, #rightBlock {
  background: white;
  position: fixed;
}

#ball {
  background: white;
  position: fixed;
  border-radius: 50px;
}

#startGame {
  z-index: 10;
  background: white;
  position: fixed;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
  padding: 20px;
  font-size: 40px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 20px;
}

#user {
  position: fixed;
  top: 50vh;
  left: 50vw;
  transform: translate(-50%, -50%);
  color: rgba(255,255,255,0.1);
  font-size: 200px;
  font-weight: bolder;
  cursor: default;
}

#scoreboard {
  background: white;
  position: fixed;
  top: 10px;
  left: 50vw;
  transform: translateX(-50%);
  padding: 10px;
  border-radius: 20px;
  display: flex;
  align-items: center;
}
</style>