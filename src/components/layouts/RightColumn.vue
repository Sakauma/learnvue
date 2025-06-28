/*RightColumn.vue*/
<template>
  <!-- 整体布局容器，用于右侧列的布局-->
  <div class="right-column-layout">
    <!-- 图表网格布局区域，用于展示各种图表内容-->
    <div class="chart-grid-layout">
      <slot name="charts"></slot>
    </div>

    <!-- 结果数据布局区域，用于展示详细的数据信息-->
    <div class="result-data-layout">
      <slot name="data"></slot>
    </div>

    <!-- 报告布局区域，用于展示分析报告或总结内容-->
    <div class="report-layout">
      <slot name="report"></slot>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.right-column-layout {
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
  min-height: 0;
  display: flex;
}

</style>