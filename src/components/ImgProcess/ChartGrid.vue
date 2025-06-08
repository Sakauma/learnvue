/*ChartGrid.vue*/
<template>
  <div class="chart-container">
    <div v-for="(config, index) in featureConfig" :key="config.key" class="chart-box">
      <div class="chart-header">{{ config.label }}</div>
      <div :ref="el => chartRefs[index] = el" class="chart"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useChart } from "../../composables/useCharts.js";

const chartRefs = ref(new Array(6).fill(null)); // 初始化为包含6个null的数组
const chartUpdaters = ref([]);

const featureConfig = [
  { key: "variance",    label: "方差" },
  { key: "mean_region", label: "均值" },
  { key: "SCR",         label: "信杂比" },
  { key: "contrast",    label: "对比度" },
  { key: "entropy",     label: "信息熵" },
  { key: "homogeneity", label: "同质性" }
];


const chartTitles = computed(() => {
  return featureConfig.map(item => item.label);
});

onMounted(() => {
  featureConfig.forEach((config, index) => {
    const domElement = chartRefs.value[index];
    if (domElement) {
      const chartComposableRef = ref(domElement);
      const { updateChartData, isInitialized } = useChart(chartComposableRef, index);
      chartUpdaters.value[index] = {
        updateFunc: updateChartData,
        getIsInitialized: () => isInitialized.value,
        featureKey: config.key
      };
    } else {
      console.error(`chartRefs.value[${index}] (for feature ${config.key}) is not yet available.`);
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

  for (let i = 0; i < featureConfig.length; i++) {
    const featureKey = featureConfig[i].key;
    const chartTitle = featureConfig[i].label;
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
            const xValues = Array.from({ length: numPoints }, (_, k) => k);
            const seriesData = yValues.map((y, index) => [xValues[index], parseFloat(y) || 0]);
            updaterObj.updateFunc(seriesData, `${chartTitle} 数据曲线`);
          } else {
            updaterObj.updateFunc([], `${chartTitle} 数据曲线 (无数据)`);
          }
        } else {
          console.warn(`特征 "${featureKey}" 的数据无效或未在 allFeaturesMap 中找到。图表 ${i} 将显示无数据。`);
          updaterObj.updateFunc([], `${chartTitle} 数据曲线 (无数据)`);
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
  for (let i = 0; i < featureConfig.length; i++) {
    const updaterObj = chartUpdaters.value[i];
    const chartTitle = featureConfig[i].label || `图表 ${i+1}`;
    if (updaterObj && updaterObj.updateFunc && typeof updaterObj.updateFunc === 'function' && updaterObj.getIsInitialized()) {
      updaterObj.updateFunc([], `${chartTitle} 数据曲线 (无数据)`);
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
  font-family: "Microsoft YaHei", sans-serif;
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