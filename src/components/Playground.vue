<template>
  <div id="playground">
    <div id="leftBlock" ref="leftBlock" style="height: 10vh;width: 1vw;top: 20vh;left:0;"></div>
    <div id="ball" ref="ball" style="height: 2vw;width: 2vw;top: 25vh;left: 50vw;transform: translate(-50%,-50%)"></div>
    <div id="rightBlock" ref="rightBlock" style="height: 10vh;width: 1vw;top: 40vh;right:0;"></div>
    <div v-if="!gameStarted" id="startGame" ref="startGame" @click="startGame">START</div>
    <div id="user">{{ user }}</div>
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

    socket.on("key pressed", ({topLeftBlock, topRightBlock}) => {
      this.$refs.leftBlock.style.top = topLeftBlock + "vh"
      this.$refs.rightBlock.style.top = topRightBlock + "vh"
    });

    socket.on("game started", ({start}) => {
      newThis.gameStarted = start
      for (let i = 0; i < newThis.users.length; i++) {
        if (newThis.users[i].self) {
          newThis.user = newThis.users[i].username
        }
      }
    });

    socket.on("move", ({topBall, leftBall, block}) => {
      newThis.$refs.ball.style.transform = "none"
      newThis.$refs.ball.style.top = topBall + "vh"
      newThis.$refs.ball.style.left = leftBall + "vw"

      for (let i = 0; i < this.users.length; i++) {
        if (block) {
          if (this.users[i].self && this.users[i].left) {
            socket.emit("scored", {
              block: block
            });
          }
          this.gameStarted = false
          this.$refs.ball.style.transform = "translate(-50%, -50%)"
        }
      }
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
      socket.emit("game started", {
        start: true,
        speed: this.speed,
        topBall: parseInt(this.$refs.ball.style.top.replace(/(\d+)\w+/i, "$1")),
        leftBall: parseInt(this.$refs.ball.style.left.replace(/(\d+)\w+/i, "$1")),
        widthHeightBall: 2,
        availableHeight: 98,
        availableWidth: 98,
        leftBlockBorder: 1,
        rightBlockBorder: 97
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
        topLeftBlock: parseInt(this.$refs.leftBlock.style.top.replace(/(\d+)\w+/i, "$1")),
        topRightBlock: parseInt(this.$refs.rightBlock.style.top.replace(/(\d+)\w+/i, "$1")),
        heightLeftBlock: parseInt(this.$refs.leftBlock.style.height.replace(/(\d+)\w+/i, "$1")),
        heightRightBlock: parseInt(this.$refs.rightBlock.style.height.replace(/(\d+)\w+/i, "$1"))
      });
    },
  },
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
  color: rgba(255, 255, 255, 0.1);
  font-size: 150px;
  font-weight: bolder;
  text-align: center;
  word-break: break-all;
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

@media screen and (max-width: 768px) {
  #user {
    font-size: 100px;
  }
}

@media screen and (max-width: 576px) {
  #user {
    font-size: 75px;
  }
}
</style>