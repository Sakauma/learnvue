/*SelectableChart.vue*/
<template>
  <!-- 可选择的图表容器，包含选择器和图表区域 -->
  <div class="selectable-chart-box">
    <!-- 图表头部区域，包含特征选择器 -->
    <div class="chart-header">
      <!-- 选择器组件，用于选择要显示的特征数据-->
      <el-select
          v-model="selectedKey"
          placeholder="选择特征"
          class="feature-selector"
          size="small"
          @change="handleSelectionChange"
      >
        <!-- 动态生成选项列-->
        <el-option
            v-for="option in props.options"
            :key="option.key"
            :label="option.label"
            :value="option.key"
        />
      </el-select>
    </div>
    <!-- 图表容器区域-->
    <div ref="chartRef" class="chart"></div>
  </div>
</template>


<script setup>
import { ref, watch, onMounted } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { useChart } from "../../composables/useCharts.js";

// 定义组件的props，接收外部传入的选项数组、数据对象和初始选中键
const props = defineProps({
  options: { type: Array, required: true }, // 必需的选项数组，每个选项应包含key和label属性
  allData: { type: Object, default: () => ({}) }, // 数据对象，默认为空对象
  initialSelectedKey: { type: String, required: true } // 必需的初始选中键
});

// 创建图表引用，用于与图表实例交互
const chartRef = ref(null);

// 从useChart组合式函数中解构出更新图表数据和检查初始化状态的方法
const { updateChartData, isInitialized } = useChart(chartRef);

// 创建响应式变量，存储当前选中的键，初始值为props传入的initialSelectedKey
const selectedKey = ref(props.initialSelectedKey);

// 定义重绘图表的函数，根据当前选中的键更新图表数据
const redrawChart = () => {
  // 如果图表未初始化，直接返回
  if (!isInitialized.value) return;

  // 从allData中获取当前选中键对应的数据
  const featureData = props.allData ? props.allData[selectedKey.value] : null;

  // 根据选中键从options中找到对应的选项，获取图表标题
  const selectedOption = props.options.find(opt => opt.key === selectedKey.value);
  const chartTitle = selectedOption ? selectedOption.label : '数据';

  // 如果数据存在且为数组且不为空，则更新图表
  if (featureData && Array.isArray(featureData) && featureData.length > 0) {
    const numPoints = featureData.length; // 获取数据点数量
    const xValues = Array.from({ length: numPoints }, (_, k) => k); // 生成x轴值数组（0,1,2,...）
    const seriesData = featureData.map((y, index) => [xValues[index], parseFloat(y) || 0]); // 将数据转换为[x, y]格式，处理可能的非数字值

    // 调用updateChartData更新图表，传入数据数组和标题
    updateChartData(seriesData, `${chartTitle} 数据曲线`);
  } else {
    // 当数据为空或null时，传入空数组清空图表，并更新标题
    updateChartData([], `${chartTitle} 数据曲线 (无数据)`);
  }
};

// 监听allData的变化，当数据更新时重绘图表
watch(() => props.allData, () => {
  redrawChart();
}, { deep: true }); // 深度监听，确保嵌套对象的变化也能触发

// 定义处理选项变化的函数，当用户选择不同选项时调用
const handleSelectionChange = () => {
  redrawChart();
};

// 组件挂载后，延迟执行重绘图表，确保DOM和图表实例已准备好
onMounted(() => {
  setTimeout(() => {
    redrawChart();
  }, 0);
});

// 定义清空图表的函数，用于暴露给外部调用
const clearChart = () => {
  const selectedOption = props.options.find(opt => opt.key === selectedKey.value);
  const chartTitle = selectedOption ? selectedOption.label : '数据';
  updateChartData([], `${chartTitle} 数据曲线 (无数据)`);
}

// 将clearChart函数暴露给父组件，以便外部调用
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