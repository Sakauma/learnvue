/*ResultData.vue*/
<template>
  <div class="result-data-container">
    <div class="table-header-wrapper">
      <h4 class="table-title">
        {{ dataMode ? `特征数据 (帧: ${idx + 1})` : '特征数据' }}
      </h4>
    </div>

    <el-table
        :data="tableData"
        :show-header="tableData.length > 0 && props.dataMode" :empty-text="emptyText"
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
  dataValue: {
    type: Object,
    default: () => ({}),
  },
  dataMode: {
    type: Boolean,
    default: false,
  },
});

const featureKeys = [
  { name: "方差", key: "variance" },
  { name: "均值", key: "mean_region" },
  { name: "信杂比", key: "SCR" },
  { name: "对比度", key: "contrast" },
  { name: "信息熵", key: "entropy" },
  { name: "同质性", key: "homogeneity" },
  { name: "平滑性", key: "smoothness" },
  { name: "偏度", key: "skewness" },
  { name: "峰度", key: "kurtosis" },
  { name: "目标XJY所占像素数", key: "xjy_area" },
  { name: "峰单元强度", key: "peak_cell_intensity" },
  { name: "XJY背景强度", key: "xjy_background_intensity" },
];

const tableData = computed(() => {
  if (!props.dataMode) {
    return featureKeys.map(feature => ({
      name: feature.name,
      displayValue: 'N/A',
    }));
  }

  const hasData = props.dataValue && Object.keys(props.dataValue).length > 0;
  if (!hasData) {
    return featureKeys.map(feature => ({
      name: feature.name,
      displayValue: 'N/A',
    }));
  }

  return featureKeys.map(feature => {
    const featureRawValue = props.dataValue[feature.key];
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
  if (props.dataMode && (!props.dataValue || Object.keys(props.dataValue).length === 0)) {
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