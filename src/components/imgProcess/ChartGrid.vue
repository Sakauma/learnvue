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

const props = defineProps({
  featureData: {
    type: Object,
    default: () => ({})
  }
});
const chartRefs = ref([]);

const featureOptions = FEATURE_DEFINITIONS;

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