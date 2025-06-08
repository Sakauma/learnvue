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
  setup() { // 使用 Composition API 的 setup 函数
    const router = useRouter(); // 获取 router 实例

    const logOut = () => { // 定义 logOut 方法
      router.replace("/"); // 使用 router 实例进行路由跳转
    };

    return { // 返回 setup 函数中定义的数据和方法
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