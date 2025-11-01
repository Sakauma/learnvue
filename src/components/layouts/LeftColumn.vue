/*LeftColumn.vue*/
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
  height: 50vh;
  flex-shrink: 0;
  display: flex;
  position: relative;
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