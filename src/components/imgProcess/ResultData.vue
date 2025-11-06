/*ResultData.vue*/
<template>
  <div class="result-data-container">
    <div class="table-header-wrapper">
      <h4 class="table-title">
        {{ dataMode ? `特征数据 (帧: ${idx + 1})` : '特征数据' }}
      </h4>
    </div>

    <div class="multi-table-container">
      <el-table
          :data="column1Data"
          :show-header="false"
          :empty-text="emptyText"
          class="data-element-table">
        <el-table-column prop="name" label="特征名称" width="160" />
        <el-table-column prop="value" label="值">
          <template #default="{ row }">
            <span>{{ row.displayValue }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-table
          :data="column2Data"
          :show-header="false"
          :empty-text="emptyText"
          class="data-element-table">
        <el-table-column prop="name" label="特征名称" width="160" />
        <el-table-column prop="value" label="值">
          <template #default="{ row }">
            <span>{{ row.displayValue }}</span>
          </template>
        </el-table-column>
      </el-table>

      <el-table
          :data="column3Data"
          :show-header="false"
          :empty-text="emptyText"
          class="data-element-table">
        <el-table-column prop="name" label="特征名称" width="160" />
        <el-table-column prop="value" label="值">
          <template #default="{ row }">
            <span>{{ row.displayValue }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
// TODO: 添加更多的检查和日志（不重要）
import { computed } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';
import { FEATURE_DEFINITIONS } from '../../config/featureConfig.js';

// 定义组件的props，接收父组件传递的参数
const props = defineProps({
  idx: {       // 索引值，用于数组类型的特征数据
    type: Number,
    default: 0,
  },
  dataValue: { // 特征数据对象
    type: Object,
    default: () => ({}),
  },
  dataMode: {  // 是否为数据模式（显示实际数据）
    type: Boolean,
    default: false,
  },
});

// 计算属性：根据dataMode和dataValue生成表格数据
const tableData = computed(() => {
  if (!props.dataMode) {
    // 非数据模式：返回FEATURE_DEFINITIONS的默认结构，displayValue设为'N/A'
    return FEATURE_DEFINITIONS.map(feature => ({
      name: feature.label,
      displayValue: 'N/A',
    }));
  }

  // 检查是否有有效数据
  const hasData = props.dataValue && Object.keys(props.dataValue).length > 0;
  if (!hasData) {
    // 无有效数据：返回FEATURE_DEFINITIONS的默认结构，displayValue设为'N/A'
    return FEATURE_DEFINITIONS.map(feature => ({
      name: feature.label,
      displayValue: 'N/A',
    }));
  }

  // 数据模式且有有效数据：根据FEATURE_DEFINITIONS和dataValue生成表格数据
  return FEATURE_DEFINITIONS.map(feature => {
    const featureRawValue = props.dataValue[feature.key]; // 获取当前特征的原始值
    let displayValue = 'N/A'; // 默认值

    // 处理不同类型的特征值
    if (featureRawValue !== undefined && featureRawValue !== null) {
      if (Array.isArray(featureRawValue) &&
          props.idx >= 0 &&
          props.idx < featureRawValue.length &&
          typeof featureRawValue[props.idx] === 'number') {
        // 数组类型且索引有效：取指定索引的值并格式化为4位小数
        displayValue = featureRawValue[props.idx].toFixed(4);
      }
      else if (typeof featureRawValue === 'number') {
        // 数字类型：格式化为4位小数
        displayValue = featureRawValue.toFixed(4);
      }
    }
    return {
      name: feature.label,      // 特征名称
      displayValue,            // 显示值
    };
  });
});

const column1Data = computed(() => tableData.value.slice(0, 4));
const column2Data = computed(() => tableData.value.slice(4, 8));
const column3Data = computed(() => tableData.value.slice(8, 12));

// 计算属性：根据dataMode和数据情况生成空数据提示文本
const emptyText = computed(() => {
  if (props.dataMode && (!props.dataValue || Object.keys(props.dataValue).length === 0)) {
    // 数据模式且无有效数据：返回特定提示
    return '当前帧无有效特征数据';
  }
  // 其他情况：返回通用提示
  return '无数据';
});
</script>

<style scoped>
.result-data-container {
  width: 100%;
  background-color: rgb(21, 45, 81);
  border-radius: 6px;
  color: white;
  font-weight: bold;
  box-sizing: border-box;
  overflow: hidden;
}

.table-header-wrapper {
  padding: 10px 10px 0px 10px;
  background-color: rgb(21, 45, 81);
}

.table-title {
  color: white;
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1em;
  text-align: left;
}

/* 用于排列三个表格的 Flexbox 容器 */
.multi-table-container {
  display: flex;
  gap: 10px; /* 表格之间的间距 */
}

.data-element-table {
  --el-table-text-color: white;
  --el-table-border-color: rgb(75, 75, 75);
  --el-table-bg-color: rgb(56, 56, 56);
  --el-table-header-text-color: white;
  --el-table-header-bg-color: rgb(56, 56, 56);
  --el-table-tr-bg-color: rgb(56, 56, 56);
  --el-table-row-hover-bg-color: rgb(55, 75, 95);
  --el-table-empty-text-color: white;
  border: none;
  flex: 1;
}

.data-element-table :deep(.el-table__header-wrapper th),
.data-element-table :deep(.el-table__body-wrapper td) {
  padding: 8px 10px;
  font-size: 0.9em;
}

.data-element-table :deep(.el-table__header-wrapper th) {
  font-weight: bold;
}

.data-element-table :deep(.el-table__inner-wrapper)::before {
  display: none;
}
</style>