/*AlgorithmSelector.vue*/
<template>
  <div class="algorithm-selectors">
    <el-select :model-value="algorithmType" @update:modelValue="handleAlgorithmTypeChange" class="algorithm-select" placeholder="选择算法类型">
      <el-option label="传统算法" value="traditional"></el-option>
      <el-option label="深度学习" value="deepLearning"></el-option>
    </el-select>

    <el-select :model-value="specificAlgorithm" @update:modelValue="$emit('update:specificAlgorithm', $event)" class="specific-algorithm-select" placeholder="选择具体算法" :disabled="!algorithmType">
      <el-option v-for="item in currentSpecificAlgorithms" :key="item.value" :label="item.label" :value="item.value"></el-option>
    </el-select>
  </div>
</template>

<script setup>
import { watch, computed } from 'vue';
import { ElSelect, ElOption } from 'element-plus';

const props = defineProps({
  algorithmType: String,
  specificAlgorithm: String,
});

const emit = defineEmits(['update:algorithmType', 'update:specificAlgorithm']);

// TODO: 后续算法名称在这里修改
const traditionalAlgorithms = [
  { label: '光流法', value: 'opticalFlow' },
  { label: '多帧累积', value: 'multiFrameDifference' },
  { label: '低秩稀疏', value: '低秩稀疏' }
];
const deepLearningAlgorithms = [
  { label: 'VGG', value: 'VGG' },
  { label: 'DNANet', value: 'DNANet' },
  { label: 'UNet', value: 'UNet' },
  { label: 'ALCNet', value: 'ALCNet' }
];

const currentSpecificAlgorithms = computed(() => {
  if (props.algorithmType === 'traditional') {
    return traditionalAlgorithms;
  } else if (props.algorithmType === 'deepLearning') {
    return deepLearningAlgorithms;
  }
  return [];
});

function handleAlgorithmTypeChange(value) {
  emit('update:algorithmType', value);
  emit('update:specificAlgorithm', ''); // Reset specific algorithm
}

watch(() => props.algorithmType, () => {
  if (!currentSpecificAlgorithms.value.find(algo => algo.value === props.specificAlgorithm)) {
    emit('update:specificAlgorithm', '');
  }
});

</script>

<style scoped>
.algorithm-selectors {
  display: flex;
  align-items: center;
}
.algorithm-select, .specific-algorithm-select {
  width: 150px;
  margin-right: 15px;
  border-radius: 4px;
}

.algorithm-selectors :deep(.el-input__wrapper) {
  background-color: rgb(27, 151, 203) !important;
  box-shadow: none !important;
  border-radius: 4px !important;
  border: 1px solid transparent !important;
  padding-right: 30px;
}
.algorithm-selectors :deep(.el-input__inner) {
  color: white !important;
  line-height: normal;
  height: auto;
  text-align: left;
}

</style>