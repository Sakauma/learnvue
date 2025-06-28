/*LeftColumn.vue*/
<template>
  <!-- 整体布局容器，包含左侧列的各个部分 -->
  <div class="left-column-layout">
    <!-- 查看器容器，用于显示主要内容 -->
    <div class="viewer-wrapper">
      <slot name="viewer"></slot>
    </div>

    <!-- 缩放滑块容器，用于控制缩放功能 -->
    <div class="zoom-slider-layout">
      <slot name="zoom"></slot>
    </div>

    <!-- 结果内容容器，用于显示查询或操作的结果 -->
    <div class="results-content-wrapper">
      <slot name="results"></slot>
    </div>

    <!-- 日志容器，用于显示操作日志或信息 -->
    <div class="logs-layout">
      <slot name="logs"></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.left-column-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.viewer-wrapper {
  width: 100%;
  height: 50vh;
  flex-shrink: 0;
  display: flex;
  position: relative;
  border: 2px solid #ccc;
}

.zoom-slider-layout {
  flex-shrink: 0;
}

.results-content-wrapper {
  flex-grow: 1;
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 12px;
  min-height: 15vh;
  background-color: #2a2a2e;
  border-radius: 4px;
  border: 1px solid #4a4a4a;
}

.logs-layout {
  flex-grow: 1;
  min-height: 0;
  display: flex;
}
</style>