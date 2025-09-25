/* ParameterSettingsDialog.vue */
<template>
  <el-dialog
      :model-value="visible"
      title="参数设置"
      width="600px"
      @update:model-value="$emit('update:visible', $event)"
      :close-on-click-modal="false"
      @open="onDialogOpen"
  >
    <el-form :model="localSettings" label-position="right" label-width="120px">
      <el-form-item label="处理模式:">
        <el-select v-model="localSettings.selectedMode" placeholder="选择模式">
          <el-option label="单帧模式" value="singleFrame"></el-option>
          <el-option label="多帧模式" value="multiFrame"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="算法选择:">
        <AlgorithmSelector
            v-model:algorithmType="localSettings.algorithmType"
            v-model:specificAlgorithm="localSettings.specificAlgorithm"
        />
      </el-form-item>

      <el-form-item label="图像尺寸:">
        <el-input-number v-model="localSettings.imageRows" :min="1" controls-position="right" placeholder="行数"></el-input-number>
        <span style="margin: 0 10px;">x</span>
        <el-input-number v-model="localSettings.imageCols" :min="1" controls-position="right" placeholder="列数"></el-input-number>
      </el-form-item>

      <el-form-item label="数据精度:">
        <el-select v-model="localSettings.selectedPrecision">
          <el-option label="64位浮点" value="float64" />
          <el-option label="32位浮点" value="float32" />
          <el-option label="16位整型" value="uint16" />
          <el-option label="8位整型" value="uint8" />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInputNumber, ElButton } from 'element-plus';
import AlgorithmSelector from './AlgorithmSelector.vue';

const props = defineProps({
  visible: Boolean,
  settings: { type: Object, required: true },
});

const emit = defineEmits(['update:visible', 'save']);

const localSettings = ref({});

// 当对话框打开时，从 props 同步最新的设置到本地
function onDialogOpen() {
  localSettings.value = JSON.parse(JSON.stringify(props.settings));
}

function handleSave() {
  emit('save', localSettings.value);
  emit('update:visible', false);
}
</script>

<style scoped>
.el-form-item {
  display: flex;
  align-items: center;
}
.el-select, .el-input-number {
  width: 180px;
}
</style>