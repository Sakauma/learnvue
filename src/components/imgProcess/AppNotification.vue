/*AppNotification.vue*/
<template>
  <!-- 使用Vue的Transition组件包裹错误提示弹窗，实现动画效果 -->
  <transition name="error-fade">
    <div v-if="notificationState.show" class="error-popup">
      <!-- 显示错误消息内容 -->
      {{ notificationState.message }}
    </div>
  </transition>
</template>

<script setup>
defineProps({
  notificationState: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
.error-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px 40px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  border-radius: 8px;
  z-index: 1000;
  max-width: 80%;
  text-align: center;
  font-size: 16px;
  line-height: 1.5;
}
.error-fade-enter-active,
.error-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.error-fade-enter-from,
.error-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}
</style>