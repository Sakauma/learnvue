/*resultData.vue*/
<template>
  <div class="result-data-container">
    <div class="table-header-wrapper">
      <h4 class="table-title">
        {{ datamode ? `特征数据 (帧: ${idx + 1})` : '特征数据' }}
      </h4>
    </div>

    <el-table
        :data="tableData"
        :show-header="tableData.length > 0 && props.datamode" :empty-text="emptyText"
        style="width: 100%"
        class="data-element-table" >
      <el-table-column prop="name" label="特征名称" width="250" />
      <el-table-column prop="value" label="值">
        <template #default="{ row }">
          <span>{{ row.displayValue }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
// TODO: 添加更多的检查和日志（不重要）
import { computed } from 'vue';
import { ElTable, ElTableColumn } from 'element-plus';

const props = defineProps({
  idx: {
    type: Number,
    default: 0,
  },
  datavalue: {
    type: Object,
    default: () => ({}),
  },
  datamode: {
    type: Boolean,
    default: false,
  },
});

const defaultFeatureKeys = [
  { name: "variance", key: "variance" },
  { name: "mean_region", key: "mean_region" },
  { name: "SCR", key: "SCR" },
  { name: "contrast", key: "contrast" },
  { name: "entropy", key: "entropy" },
  { name: "smoothness", key: "smoothness" },
  { name: "skewness", key: "skewness" },
  { name: "kurtosis", key: "kurtosis" },
  { name: "xjy_area", key: "xjy_area" },
  { name: "peak_cell_intensity", key: "peak_cell_intensity" },
  { name: "xjy_background_intensity", key: "xjy_background_intensity" },
];

const tableData = computed(() => {
  if (!props.datamode) {
    return defaultFeatureKeys.map(feature => ({
      name: feature.name,
      displayValue: 'N/A',
    }));
  }

  const hasData = props.datavalue && Object.keys(props.datavalue).length > 0;
  if (!hasData) {
    return defaultFeatureKeys.map(feature => ({
      name: feature.name,
      displayValue: 'N/A',
    }));
  }

  return defaultFeatureKeys.map(feature => {
    const featureRawValue = props.datavalue[feature.key];
    let displayValue = 'N/A'; // 默认值

    if (featureRawValue !== undefined && featureRawValue !== null) {
      if (Array.isArray(featureRawValue) &&
          props.idx >= 0 &&
          props.idx < featureRawValue.length &&
          typeof featureRawValue[props.idx] === 'number') {
        displayValue = featureRawValue[props.idx].toFixed(4);
      }
      else if (typeof featureRawValue === 'number') {
        displayValue = featureRawValue.toFixed(4);
      }
    }

    return {
      name: feature.name,
      displayValue,
    };
  });
});

const emptyText = computed(() => {
  if (props.datamode && (!props.datavalue || Object.keys(props.datavalue).length === 0)) {
    return '当前帧无有效特征数据';
  }
  return '无数据';
});
</script>

<style scoped>
.result-data-container {
  width: 100%;
  background-color: rgb(21, 45, 81);
  border-radius: 6px;
  color: white;
  margin-top: 10px;
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