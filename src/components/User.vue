<template>
  <div class="user">
    <div class="description">
      <div class="name">
        {{ user.username }} {{ user.left ? " (left)" : "(right)" }}
      </div>
      <div class="status">
        <status-icon :connected="user.connected" />{{ status }}
      </div>
    </div>
  </div>
</template>

<script>
import StatusIcon from "./StatusIcon";
export default {
  name: "User",
  components: { StatusIcon },
  props: {
    user: Object,
  },

  computed: {
    status() {
      return this.user.connected ? "online" : "offline";
    },
  },
};
</script>

<style scoped>
.user {
  padding: 10px;
  margin: 10px;
  background: rgba(255,255,255,0.9);
  border-radius: 10px;
}

.description {
  display: inline-block;
}

.status {
  color: #92959e;
}
</style>
