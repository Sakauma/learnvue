<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
    }
  },
  components: {
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  top: 0;
  left: 0;
  background: url("./assets/catagory_satellite_banner.jpg_n.webp");
  background-size: 100% 100%;
  height: 100%;
  width: 100%;
  margin: unset;
  position: fixed;
}
</style>