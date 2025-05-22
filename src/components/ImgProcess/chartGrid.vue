<template>
  <div class="chart-container">
    <div v-for="i in 6" :key="i" class="chart-box">
      <div class="chart-header">曲线图表{{ i }}</div>
      <div :ref="el => chartRefs[i-1] = el" class="chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useChart } from "../../composables/useCharts.js";

const chartRefs = ref([]);
const chartUpdaters = ref([]);

onMounted(() => {
  chartRefs.value.forEach((elRef, index) => {
    if (elRef) {
      const chartComposableRef = ref(elRef);
      const { updateChartData, isInitialized } = useChart(chartComposableRef, index);
      chartUpdaters.value[index] = { updateFunc: updateChartData, getIsInitialized: () => isInitialized.value };
    }else{
      console.error(`ChartGrid: chartRefs.value[${index}] is null or undefined.`);
    }
  });
});

// flatYValuesArray: 后端返回的包含Y值的扁平数组
function updateAllChartsWithBackendData(flatYValuesArray) {
  if (!flatYValuesArray || !Array.isArray(flatYValuesArray) || flatYValuesArray.length === 0) {
    console.warn(`更新图表数据失败：提供的Y值数组无效或为空。接收到的:`, flatYValuesArray);
    return;
  }

  const numPoints = flatYValuesArray.length;

  // 生成X轴坐标 (0 到 numPoints - 1)
  const xValues = Array.from({ length: numPoints }, (_, i) => i);

  // 将Y值数组和X值数组组合成ECharts所需的 [[x,y], [x,y], ...]
  // 可以在这里对y值进行简单的处理
  const singleSeriesDataForECharts = flatYValuesArray.map((y, index) => [xValues[index], y * 50]);

  // 使用这条相同的单曲线数据更新所有4个图表
  for (let i = 0; i < chartUpdaters.value.length; i++) {
    const updaterObj = chartUpdaters.value[i];
    if (updaterObj && typeof updaterObj.updateFunc === 'function') {
      if (updaterObj.getIsInitialized()) {
        // 它期望的参数是单条曲线的数据 [[x,y], ...]
        updaterObj.updateFunc(singleSeriesDataForECharts);
      } else {
        console.warn(`图表 ${i} 尚未初始化，无法使用后端数据更新。`);
      }
    } else {
      console.warn(`未找到图表索引 ${i} 的更新函数。`);
    }
  }
}
defineExpose({ updateAllChartsWithBackendData });

</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 95vh;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 10px;
  padding: 0 0 20px;
  background-color: rgb(27, 40, 56);
}
.chart-box {
  width: 100%;
  height: 100%;
  background-color: rgb(56, 56, 56);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
.chart-header {
  height: 30px;
  line-height: 30px;
  padding: 0 10px;
  background-color: rgb(21, 45, 81);
  color: white;
  font-weight: bold;
  border-bottom: 1px solid #e4e7ed;
}
.chart {
  flex: 1;
  width: 100%;
}
</style>