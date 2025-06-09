/*RightColumn.vue*/
<template>
  <div class="data-column-layout">
    <div class="chart-grid-layout">
      <slot name="charts"></slot>
    </div>

    <div class="result-data-layout">
      <slot name="data"></slot>
    </div>

    <div class="report-layout">
      <slot name="report"></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.data-column-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
}

.chart-grid-layout {
  height: 60vh;
  flex-shrink: 0;
}

.result-data-layout,
.report-layout {
  flex-shrink: 0;
}

.report-layout {
  flex-grow: 1;
  display: flex;
}

</style>