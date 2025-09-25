<!--<template>-->
<!--  <div class="control-panel-wrapper">-->
<!--    <el-row class="menu-button-row" justify="space-between" align="middle">-->
<!--      <el-col :span="12" class="left-menu-buttons">-->
<!--        <el-button-->
<!--            class="inference-button"-->
<!--            @click="$emit('infer')"-->
<!--            :disabled="props.isLoading || !props.canInferInCurrentMode">-->
<!--          {{ props.isMultiFrameMode ? '分析数据' : '分析数据' }}-->
<!--        </el-button>-->
<!--        <el-button class="feature-button" @click="$emit('open-settings')">-->
<!--          参数设置-->
<!--        </el-button>-->
<!--        <ActionButtons-->
<!--            :is-loading="props.isLoading"-->
<!--            @custom-action-3="$emit('customAction3')"-->
<!--            @edit-config="$emit('open-config-editor')"-->
<!--        />-->
<!--      </el-col>-->

<!--      <el-col :span="12" class="right-menu-buttons">-->
<!--&lt;!&ndash;        <ActionButtons&ndash;&gt;-->
<!--&lt;!&ndash;            :is-loading="props.isLoading"&ndash;&gt;-->
<!--&lt;!&ndash;            @custom-action-3="$emit('customAction3')"&ndash;&gt;-->
<!--&lt;!&ndash;            @edit-config="$emit('open-config-editor')"&ndash;&gt;-->
<!--&lt;!&ndash;        />&ndash;&gt;-->
<!--      </el-col>-->
<!--    </el-row>-->
<!--  </div>-->
<!--</template>-->
<template>
  <div class="control-panel-wrapper">
    <el-row class="menu-button-row" justify="start" align="middle">
      <el-col :span="24" class="left-menu-buttons">
        <el-button
            class="control-button"
            @click="$emit('infer')"
            :disabled="isLoading || !canInferInCurrentMode">
          {{ isMultiFrameMode ? '分析数据' : '分析数据' }}
        </el-button>
        <el-button class="control-button" @click="$emit('open-settings')">
          参数设置
        </el-button>
        <el-button class="control-button" @click="$emit('customAction3')">
          轨迹分析
        </el-button>
        <el-button class="control-button" @click="$emit('open-config-editor')">
          编辑算法配置文件
        </el-button>
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

<!--<style scoped>-->
<!--.control-panel-wrapper {-->
<!--  margin-bottom: 20px;-->
<!--}-->
<!--.menu-button-row {-->
<!--  margin-bottom: 15px;-->
<!--}-->
<!--.left-menu-buttons, .right-menu-buttons {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  gap: 10px;-->
<!--}-->
<!--.left-menu-buttons > *:first-child {-->
<!--  margin-left: 0;-->
<!--}-->
<!--.right-menu-buttons > *:first-child {-->
<!--  margin-left: 0;-->
<!--}-->


<!--/* 按钮样式 */-->
<!--.feature-button, .inference-button {-->
<!--  background-color: rgb(40, 108, 153);-->
<!--  color: white;-->
<!--  border: none;-->
<!--  border-radius: 8px;-->
<!--  padding: 8px 15px;-->
<!--  margin-left: 10px;-->
<!--  cursor: pointer;-->
<!--  transition: background-color 0.3s;-->
<!--}-->
<!--.feature-button:hover, .inference-button:hover {-->
<!--  background-color: rgb(53, 53, 53);-->
<!--}-->
<!--.feature-button:disabled, .inference-button:disabled {-->
<!--  background-color: #a0cfff;-->
<!--  cursor: not-allowed;-->
<!--}-->
<!--.inference-button {-->
<!--  margin-left: 0;-->
<!--}-->
<!--</style>-->

<style scoped>
.control-panel-wrapper {
  margin-bottom: 20px;
}
.menu-button-row {
  margin-bottom: 15px;
}

/* 【已修改】为按钮的父容器设置 flex 布局和 gap */
.left-menu-buttons {
  display: flex;
  align-items: center;
  gap: 10px; /* <--- 关键！这里统一设置所有按钮的间距为 10px */
}

/* 【已修改】统一所有按钮的样式，并移除独立的 margin */
.control-button {
  background-color: rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
  /* 移除了 margin-left */
}

.control-button:hover {
  background-color: rgb(53, 53, 53);
}

.control-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>