/*ActionButtons.vue*/
<template>
  <!-- 动作按钮容器，用于集中展示功能按钮 -->
  <div class="action-buttons-container">
    <span style="color: white; margin: 0 10px;"></span>
    <!-- 轨迹分析计算按钮 -->
    <el-button
        class="feature-button"
        @click="$emit('custom-action-3')">
      轨迹分析
    </el-button>

    <!-- 编辑算法配置文件按钮 -->
    <el-button
        class="feature-button"
        @click="$emit('edit-config')">
      编辑算法配置文件
    </el-button>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus';

defineProps({
  // 加载状态，用于控制按钮的禁用状态
  isLoading: Boolean,
  // 是否允许识别，用于控制按钮的可用性
  canInfer: Boolean,
});

defineEmits([
  'infer',
  // 触发自定义动作3的事件
  'custom-action-3',
  // 触发编辑配置文件的事件
  'edit-config'
]);
</script>


<style scoped>
.action-buttons-container {
  display: flex;
  align-items: center;
}
.feature-button {
  background-color:rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.feature-button:hover {
  background-color: rgb(53, 53, 53);
}
.feature-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>