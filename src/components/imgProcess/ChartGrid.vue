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
import { FEATURE_DEFINITIONS } from '../../config/featureConfig.js';

// 定义组件的props，接收外部传入的featureData数据
const props = defineProps({
  featureData: {
    type: Object,
    default: () => ({})
  }
});

// 用于存储所有图表组件的引用
const chartRefs = ref([]);

// 从配置文件中导入图表选项定义
const featureOptions = FEATURE_DEFINITIONS;

// 初始化图表配置，现在默认显示全部12个特征图表
const chartConfigs = ref(FEATURE_DEFINITIONS.slice(0, 3));
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: 1fr;
  gap: 10px;
  background-color: rgb(27, 40, 56);
}
</style>