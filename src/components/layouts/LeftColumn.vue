/* LeftColumn.vue */
<template>
  <div class="left-column-layout">
    <div class="viewer-wrapper">
      <slot name="viewer"></slot>
    </div>

    <div class="zoom-slider-layout">
      <slot name="zoom"></slot>
    </div>

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
  height: 50vh; /* 保持原有高度 */
  flex-shrink: 0;
  display: flex; /* 使用 flex 布局来容纳子元素 */
  position: relative;
  /* 【已移除】border: 2px solid #ccc; */
  /* 【新增】为内部的 flex 容器添加间距 */
  gap: 12px;
}

.zoom-slider-layout {
  flex-shrink: 0;
}

.logs-layout {
  flex-grow: 1;
  min-height: 0;
  display: flex;
}
</style>