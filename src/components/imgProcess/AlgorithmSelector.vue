/*AlgorithmSelector.vue*/
<template>
  <!-- 算法选择器容器 -->
  <div class="algorithm-selectors">
    <!-- 算法类型选择下拉框 -->
    <el-select
        :model-value="algorithmType"
        @update:modelValue="handleAlgorithmTypeChange"
        class="algorithm-select"
        placeholder="选择算法类型"
    >
      <!-- 传统算法选项 -->
      <el-option label="传统算法" value="traditional"></el-option>
      <!-- 深度学习算法选项 -->
      <el-option label="深度学习" value="deepLearning"></el-option>
    </el-select>

    <!-- 具体算法选择下拉框 -->
    <el-select
        :model-value="specificAlgorithm"
        @update:modelValue="$emit('update:specificAlgorithm',$event)"
        class="specific-algorithm-select"
        placeholder="选择具体算法"
        :disabled="!algorithmType"
    >
      <!-- 动态渲染当前可用算法列表 -->
      <el-option
          v-for="item in currentSpecificAlgorithms"
          :key="item.value"
          :label="item.label"
          :value="item.value"
      ></el-option>
    </el-select>
  </div>
</template>

<script setup>
import { watch, computed } from 'vue';
import { ElSelect, ElOption } from 'element-plus';
import { TRADITIONAL_ALGORITHMS, DEEP_LEARNING_ALGORITHMS } from '../../config/algorithmConfig.js';

const props = defineProps({
  algorithmType: String,
  specificAlgorithm: String,
});

const emit = defineEmits(['update:algorithmType', 'update:specificAlgorithm']);

const currentSpecificAlgorithms = computed(() => {
  // 计算属性，根据 algorithmType 返回对应的算法列表
  if (props.algorithmType === 'traditional') {
    return TRADITIONAL_ALGORITHMS; // 如果是传统算法类型，返回传统算法列表
  } else if (props.algorithmType === 'deepLearning') {
    return DEEP_LEARNING_ALGORITHMS; // 如果是深度学习算法类型，返回深度学习算法列表
  }
  return []; // 其他情况返回空数组
});

function handleAlgorithmTypeChange(value) {
  // 处理算法类型变化的函数
  emit('update:algorithmType', value); // 触发 update:algorithmType 事件，更新 algorithmType
  emit('update:specificAlgorithm', ''); // 触发 update:specificAlgorithm 事件，清空 specificAlgorithm
}

watch(() => props.algorithmType, () => {
  // 监听 algorithmType 的变化
  if (!currentSpecificAlgorithms.value.find(algo => algo.value === props.specificAlgorithm)) {
    // 如果当前 specificAlgorithm 不在新的 currentSpecificAlgorithms 列表中
    emit('update:specificAlgorithm', ''); // 触发 update:specificAlgorithm 事件，清空 specificAlgorithm
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