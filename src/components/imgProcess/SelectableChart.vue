/*SelectableChart.vue*/
<template>
  <div class="selectable-chart-box">
    <div class="chart-header">
      <el-select
          v-model="selectedKey"
          placeholder="选择特征"
          class="feature-selector"
          size="small"
          @change="handleSelectionChange"
      >
        <el-option
            v-for="option in props.options"
            :key="option.key"
            :label="option.label"
            :value="option.key"
        />
      </el-select>
    </div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { useChart } from "../../composables/useCharts.js";

const props = defineProps({
  options: { type: Array, required: true },
  allData: { type: Object, default: () => ({}) },
  initialSelectedKey: { type: String, required: true }
});

const chartRef = ref(null);
const { updateChartData, isInitialized } = useChart(chartRef);
const selectedKey = ref(props.initialSelectedKey);

const redrawChart = () => {
  if (!isInitialized.value) return;

  const featureData = props.allData ? props.allData[selectedKey.value] : null;
  const selectedOption = props.options.find(opt => opt.key === selectedKey.value);
  const chartTitle = selectedOption ? selectedOption.label : '数据';

  if (featureData && Array.isArray(featureData) && featureData.length > 0) {
    const numPoints = featureData.length;
    const xValues = Array.from({ length: numPoints }, (_, k) => k);
    const seriesData = featureData.map((y, index) => [xValues[index], parseFloat(y) || 0]);
    updateChartData(seriesData, `${chartTitle} 数据曲线`);
  } else {
    // 当数据为空或null时，此部分代码会执行，传入空数组来清空图表
    updateChartData([], `${chartTitle} 数据曲线 (无数据)`);
  }
};

watch(() => props.allData, () => {
  redrawChart();
}, { deep: true });

const handleSelectionChange = () => {
  redrawChart();
};

onMounted(() => {
  // 使用 setTimeout 确保 ECharts 容器已渲染
  setTimeout(() => {
    redrawChart();
  }, 0);
});

const clearChart = () => {
  const selectedOption = props.options.find(opt => opt.key === selectedKey.value);
  const chartTitle = selectedOption ? selectedOption.label : '数据';
  updateChartData([], `${chartTitle} 数据曲线 (无数据)`);
}

defineExpose({ clearChart });
</script>

<style scoped>
.selectable-chart-box {
  font-family: "Microsoft YaHei", sans-serif;
  font-weight: bold;
  width: 100%;
  height: 100%;
  background-color: rgb(56, 56, 56);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chart-header {
  font-family: "Microsoft YaHei", sans-serif;
  font-weight: bold;
  height: 30px;
  padding: 0 10px;
  background-color: rgb(21, 45, 81);
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
}
.feature-selector {
  width: 180px;
}
.chart-header :deep(.el-select__wrapper) {
  background-color: transparent !important;
  border: 1px solid rgb(21, 45, 81) !important;
  border-radius: 4px;
}
.chart-header :deep(.el-select__placeholder) {
  color: white !important;
}
.chart-header :deep(.el-select__icon) {
  color: white !important;
  transform: scale(1.2);
}
.chart {
  flex: 1;
  width: 100%;
}
</style>