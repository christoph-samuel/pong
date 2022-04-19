<template>
  <div id="scoreboard">
    <div id="scoreLeft">{{scoreLeft}}</div>
    <div>:</div>
    <div id="scoreRight">{{scoreRight}}</div>
  </div>
</template>

<script>
export default {
  name: "Scoreboard",

  props: {
    scoreLeft: Number,
    scoreRight: Number,
  }
}
</script>

<style scoped>
#scoreboard > div {
  font-size: 30px;
  font-weight: bold;
  margin: 10px;
}
</style>