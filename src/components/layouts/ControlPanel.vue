/*ControlPanel.vue*/
<template>
  <div class="control-panel-wrapper">
    <el-row class="menu-button-row" justify="start" align="middle">
      <el-col :span="24" class="left-menu-buttons">

        <template v-if="isManualMode">
          <el-button
              class="control-button"
              @click="$emit('infer')"
              :disabled="isLoading || !canInferInCurrentMode">
            分析数据
          </el-button>
        </template>

        <template v-else>
          <el-button
              class="control-button"
              :type="autoModeConnectionStatus === 'connected' ? 'success' : ''"
              @click="$emit('toggle-auto-mode-connection')"
              :disabled="isLoading">
            {{ autoModeConnectionText }}
          </el-button>

          <el-button
              v-if="autoModeConnectionStatus === 'connected'"
              class="control-button"
              @click="$emit('infer')"
              :disabled="isLoading || !canInferInCurrentMode">
            分析数据
          </el-button>
        </template>

        <el-button class="control-button" @click="$emit('open-settings')">
          参数设置
        </el-button>
        <el-button class="control-button" @click="$emit('open-config-editor')">
          编辑算法配置文件
        </el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { ElRow, ElCol, ElButton } from 'element-plus';

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
  isMultiFrameMode: { // <--- 这个prop现在代表 "isManualMode"
    type: Boolean,
    required: true,
  },

  autoModeConnectionStatus: {
    type: String, // 'disconnected', 'connecting', 'connected', 'error'
    default: 'disconnected',
  }
});

// 确保 emit 定义包含了所有对外触发的事件
const isManualMode = computed(() => props.isMultiFrameMode);
const autoModeConnectionText = computed(() => {
  switch (props.autoModeConnectionStatus) {
    case 'connecting': return '连接中...';
    case 'connected': return '自动服务已连接';
    case 'error': return '连接错误';
    case 'disconnected':
    default:
      return '连接自动服务';
  }
});
// 确保 emit 定义包含了所有对外触发的事件
const emit = defineEmits([
  'infer',
  'open-settings',
  'open-config-editor',
  'toggle-auto-mode-connection',
]);
</script>

<style scoped>
.control-panel-wrapper {
  margin-bottom: 20px;
}
.menu-button-row {
  margin-bottom: 15px;
}

/* 为按钮的父容器设置 flex 布局和 gap */
.left-menu-buttons {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 统一所有按钮的样式，并移除独立的 margin */
.control-button {
  background-color: rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.control-button:hover {
  background-color: rgb(53, 53, 53);
}

.control-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>