/*DataProductActions.vue*/
<template>
  <div class="data-product-actions-container">
    <el-button
        type="primary"
        class="action-button"
        :disabled="!canPerformAction"
        @click="$emit('download')"
    >
      生成数据产品
    </el-button>
    <el-button
        type="success"
        class="action-button"
        :disabled="!canPerformAction"
        @click="$emit('transmit')"
    >
      传输数据产品
    </el-button>
  </div>
</template>

<script setup>
import { ElButton } from 'element-plus';

/**
 * @description 该组件提供数据产品的操作按钮（下载、传输）。
 * 它通过 `canPerformAction` prop 控制按钮的可用状态，
 * 并通过 `download` 和 `transmit` 事件将用户操作通知给父组件。
 */
defineProps({
  /**
   * 控制按钮是否可点击。
   * 当没有有效的数据产品可供操作时，应传入 false。
   */
  canPerformAction: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['download', 'transmit']);
</script>

<style scoped>
.data-product-actions-container {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  padding: 10px;
  background-color: rgb(21, 45, 81);
  border-radius: 6px;
  box-sizing: border-box;
  width: 100%;
}

.action-button {
  flex: 1;
  font-weight: bold;
}
</style>