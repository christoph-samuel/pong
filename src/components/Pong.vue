<template>
  <div>
    <div id="user">
      <user
          v-for="user in users"
          :key="user.userID"
          :user="user"
      />
    </div>
    <playground
        :users="users"
    />
  </div>
</template>

<script>
import socket from "../socket";
import User from "./User";
import Playground from "./Playground";

export default {
  name: "Pong",

  components: {
    User,
    Playground
  },

  data() {
    return {
      users: [],
    };
  },

  created() {
    socket.on("connect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = true;
        }
      });
    });

    socket.on("disconnect", () => {
      this.users.forEach((user) => {
        if (user.self) {
          user.connected = false;
        }
      });
    });

    const initReactiveProperties = (user) => {
      user.connected = true;
    };

    socket.on("users", (users) => {
      users.forEach((user) => {
        user.self = user.userID === socket.id;
        initReactiveProperties(user);
      });
      // put the current user first, and sort by username
      // this.users = users.sort((a, b) => {
      //   if (a.self) return -1;
      //   if (b.self) return 1;
      //   if (a.username < b.username) return -1;
      //   return a.username > b.username ? 1 : 0;
      // });

      this.users = users
    });

    socket.on("user connected", (user) => {
      initReactiveProperties(user);
      this.users.push(user);
    });

    socket.on("user disconnected", (id) => {
      for (let i = 0; i < this.users.length; i++) {
        const user = this.users[i];
        if (user.userID === id) {
          user.connected = false;
          break;
        }
      }
    });
  },

  destroyed() {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("users");
    socket.off("user connected");
    socket.off("user disconnected");
    socket.off("key pressed");
  },
};
</script>

<style scoped>
#user {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
}
</style>