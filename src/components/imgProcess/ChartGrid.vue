/*ChartGrid.vue*/
<template>
  <!-- 容器用于显示图表组件 -->
  <div class="chart-container">
    <!-- 循环渲染SelectableChart组件，每个组件对应一个配置 -->
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

// 初始化图表配置，默认显示前4个图表
const chartConfigs = ref(FEATURE_DEFINITIONS.slice(0, 4));
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