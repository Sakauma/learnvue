/*AppIndex.vue*/
<template>
  <div id="index">
    <p>hello world!</p>
    <button @click="logOut">退出</button>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  name: "AppIndex",
  setup() {
    const router = useRouter();

    const logOut = () => {
      router.replace("/");
    };

    return {
      logOut
    };
  }
}
</script>

<style scoped>
#index{
  position: relative;
  top: 30%;
  left: 35%;
  background: white;
  border: #ffffff 2px solid;
  border-radius: 6px;
  width: 25%;
  height: 20%;
  padding-top: 4%;
}
</style>