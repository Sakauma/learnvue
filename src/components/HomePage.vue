/*HomePage.vue*/
<template>
  <div id="home-page">
    <p id="home-logo">欢迎来到 XJYTXFX 软件</p>
    <div id="home-buttons">
      <button id="infer-button" @click="goToInfer">开始识别</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToInfer = () => {
  router.push('/infer'); // 路由跳转到 /infer 页面
};
</script>

<style scoped>
#home-page {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#home-logo {
  font-size: 48px;
  font-weight: bold;
  margin-bottom: 20px;
  color: white;
}

#home-buttons {
  display: flex;
  gap: 20px;
}

#infer-button {
  padding: 12px 24px;
  font-size: 18px;
  border: none;
  border-radius: 5px;
  background-color: rgb(40, 108, 153); /* 示例按钮背景颜色， Vue 绿 */
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#infer-button:hover {
  background-color: rgb(53, 53, 53); /* 示例按钮 hover 时的背景颜色 */
}
</style>