/*ChartGrid.vue*/
<template>
  <div class="chart-container">
    <SelectableChart
        v-for="(config, index) in chartConfigs"
        :key="index"
        :options="featureOptions"
        :all-data="props.featureData"
        :initial-selected-key="config.key"
        ref="chartRefs"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SelectableChart from './SelectableChart.vue';

const props = defineProps({
  featureData: {
    type: Object,
    default: () => ({})
  }
});
const chartRefs = ref([]);

const featureOptions = [
  { key: "variance",    label: "方差" },
  { key: "mean_region", label: "均值" },
  { key: "SCR",         label: "信杂比" },
  { key: "contrast",    label: "对比度" },
  { key: "entropy",     label: "信息熵" },
  { key: "homogeneity", label: "同质性" },
  { key: "smoothness",  label: "平滑性" },
  { key: "skewness",    label: "偏度" },
  { key: "kurtosis",    label: "峰度" },
  { key: "xjy_area",    label: "目标XJY所占像素数" },
  { key: "peak_cell_intensity", label: "峰单元强度" },
  { key: "xjy_background_intensity", label: "XJY背景强度" },
];

const chartConfigs = ref(featureOptions.slice(0, 4));
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 1fr 1fr 1fr 1fr;
  gap: 10px;
  background-color: rgb(27, 40, 56);
}
</style>