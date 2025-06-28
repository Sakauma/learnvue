/*HomePage.vue*/
<template>
  <!-- 主页面容器 -->
  <div id="home-page">
    <!-- 欢迎标语 -->
    <p id="home-logo">欢迎来到 XJYTXFX 软件</p>

    <!-- 按钮容器 -->
    <div id="home-buttons">
      <!-- 开始识别按钮，点击后跳转到识别页面 -->
      <button id="infer-button" @click="goToInfer">开始识别</button>
    </div>
  </div>
</template>

<script setup>
// 导入 Vue Router 的 useRouter 函数，用于页面导航
import { useRouter } from 'vue-router';

// 创建路由实例
const router = useRouter();

// 定义跳转到识别页面的方法
const goToInfer = () => {
  // 使用 router.push 方法跳转到 '/infer' 路由
  router.push('/infer');
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
  background-color: rgb(40, 108, 153);
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#infer-button:hover {
  background-color: rgb(53, 53, 53);
}
</style>