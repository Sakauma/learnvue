<template>
  <div class="action-buttons-container">
    <span style="color: white; margin: 0 10px;">--></span>
    <el-button class="功能-button" @click="$emit('custom-action-3')">感兴趣图像区域计算</el-button>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus';

defineProps({
  isLoading: Boolean,
  canInfer: Boolean,
});
defineEmits(['infer', 'custom-action-3']);
</script>

<style scoped>
.action-buttons-container {
  display: flex;
  align-items: center;
}
.识别-button, .功能-button {
  background-color:rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.识别-button:hover, .功能-button:hover {
  background-color: rgb(53, 53, 53);
}
.识别-button:disabled, .功能-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>