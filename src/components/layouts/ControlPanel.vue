<template>
  <div class="control-panel-wrapper">
    <el-row class="menu-button-row" justify="space-between" align="middle">
      <el-col :span="12" class="left-menu-buttons">
        <el-button
            class="inference-button"
            @click="$emit('infer')"
            :disabled="props.isLoading || !props.canInferInCurrentMode">
          {{ props.isMultiFrameMode ? '分析数据' : '分析数据' }}
        </el-button>
        <el-button class="feature-button" @click="$emit('open-settings')">
          参数设置
        </el-button>
        <ActionButtons
            :is-loading="props.isLoading"
            @custom-action-3="$emit('customAction3')"
            @edit-config="$emit('open-config-editor')"
        />
      </el-col>

      <el-col :span="12" class="right-menu-buttons">
<!--        <ActionButtons-->
<!--            :is-loading="props.isLoading"-->
<!--            @custom-action-3="$emit('customAction3')"-->
<!--            @edit-config="$emit('open-config-editor')"-->
<!--        />-->
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ElRow, ElCol, ElButton } from 'element-plus';
import ActionButtons from '../imgProcess/ActionButtons.vue';

//确保 props 定义与父组件传入的完全一致
const props = defineProps({
  isLoading: {
    type: Boolean,
    required: true,
  },
  canInferInCurrentMode: {
    type: Boolean,
    required: true,
  },
  isMultiFrameMode: {
    type: Boolean,
    required: true,
  },
});

// 【修正】确保 emit 定义包含了所有对外触发的事件
const emit = defineEmits([
  'infer',
  'open-settings',
  'customAction3',
  'open-config-editor',
]);
</script>

<style scoped>
.control-panel-wrapper {
  margin-bottom: 20px;
}
.menu-button-row {
  margin-bottom: 15px;
}
.left-menu-buttons, .right-menu-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}
.left-menu-buttons > *:first-child {
  margin-left: 0;
}
.right-menu-buttons > *:first-child {
  margin-left: 0;
}


/* 按钮样式 */
.feature-button, .inference-button {
  background-color: rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.feature-button:hover, .inference-button:hover {
  background-color: rgb(53, 53, 53);
}
.feature-button:disabled, .inference-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
.inference-button {
  margin-left: 0;
}
</style>