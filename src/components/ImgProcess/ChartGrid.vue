/*ChartGrid.vue*/
<template>
  <div class="chart-container">
    <div v-for="(featureKey, index) in displayedFeatureKeys" :key="featureKey" class="chart-box">
      <div class="chart-header">{{ chartTitles[index] }}</div>
      <div :ref="el => chartRefs[index] = el" class="chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useChart } from "../../composables/useCharts.js";

const chartRefs = ref(new Array(6).fill(null)); // 初始化为包含6个null的数组
const chartUpdaters = ref([]);

const displayedFeatureKeys = [
  "variance",
  "mean_region",
  "SCR",
  "contrast",
  "entropy",
  "homogeneity"
];

const chartTitles = computed(() => {
  return displayedFeatureKeys.map(key => key.toUpperCase().replace("_", " "));
});

onMounted(() => {
  displayedFeatureKeys.forEach((key, index) => {
    const domElement = chartRefs.value[index];
    if (domElement) {
      const chartComposableRef = ref(domElement); // 将 DOM 元素包装在 ref 中
      const { updateChartData, isInitialized } = useChart(chartComposableRef, index);
      chartUpdaters.value[index] = {
        updateFunc: updateChartData,
        getIsInitialized: () => isInitialized.value,
        featureKey: key // 方便调试
      };
    } else {
      console.error(`onMounted: chartRefs.value[${index}] (for feature ${key}) is not yet available.`);
    }
  });
});

function updateAllChartsWithFeatureData(allFeaturesMap) {
  if (!allFeaturesMap || typeof allFeaturesMap !== 'object') {
    console.warn(`更新图表数据失败：提供的特征数据对象无效。接收到的:`, allFeaturesMap);
    clearAllCharts();
    return;
  }
  console.log("接收到所有特征数据，准备更新图表:", allFeaturesMap);

  for (let i = 0; i < displayedFeatureKeys.length; i++) {
    const featureKey = displayedFeatureKeys[i];
    const chartTitle = chartTitles.value[i];
    const updaterObj = chartUpdaters.value[i];

    if (!updaterObj) {
      console.warn(`未找到图表索引 ${i} (${featureKey}) 的更新器对象。`);
      continue;
    }

    const yValues = allFeaturesMap[featureKey];

    if (updaterObj.updateFunc && typeof updaterObj.updateFunc === 'function') {
      if (updaterObj.getIsInitialized()) {
        if (yValues && Array.isArray(yValues)) {
          if (yValues.length > 0) {
            const numPoints = yValues.length;
            const xValues = Array.from({ length: numPoints }, (_, k) => k); // X轴: 0, 1, 2...
            const seriesData = yValues.map((y, index) => [xValues[index], parseFloat(y) || 0]); // 确保y是数字
            updaterObj.updateFunc(seriesData, chartTitle); // useCharts.js 中的 updateChart 会使用第二个参数作为标题
          } else {
            updaterObj.updateFunc([], chartTitle + " (无数据)");
          }
        } else {
          console.warn(`特征 "${featureKey}" 的数据无效或未在 allFeaturesMap 中找到。图表 ${i} 将显示无数据。`);
          updaterObj.updateFunc([], chartTitle + " (无数据)");
        }
      } else {
        console.warn(`图表 ${i} (${featureKey}) 尚未初始化，无法更新。`);
      }
    } else {
      console.warn(`图表索引 ${i} (${featureKey}) 的更新函数不存在。`);
    }
  }
}

function clearAllCharts() {
  for (let i = 0; i < displayedFeatureKeys.length; i++) {
    const updaterObj = chartUpdaters.value[i];
    const chartTitle = chartTitles.value[i] || `图表 ${i+1}`;
    if (updaterObj && updaterObj.updateFunc && typeof updaterObj.updateFunc === 'function' && updaterObj.getIsInitialized()) {
      updaterObj.updateFunc([], chartTitle + " (无数据)");
    }
  }
}

defineExpose({ updateAllChartsWithFeatureData, clearAllCharts });
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
  overflow: hidden;
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