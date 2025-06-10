/*LeftColumn.vue*/
<template>
  <div class="left-column-layout">
    <div class="viewer-wrapper">
      <slot name="viewer"></slot>
    </div>

    <div class="zoom-slider-layout">
      <slot name="zoom"></slot>
    </div>

    <div class="results-content-wrapper">
      <slot name="results"></slot>
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