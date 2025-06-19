/*ControlPanel.vue*/
<template>
  <div class="control-panel-wrapper">
    <el-row class="menu-button-row">
      <el-col :span="12" class="left-menu-buttons">
        <el-select
            :model-value="props.selectedMode"
            @update:model-value="emit('update:selectedMode', $event)"
            class="mode-select custom-menu-select"
            placeholder="选择模式">
          <el-option label="单帧模式" value="singleFrame"></el-option>
          <el-option label="多帧模式" value="multiFrame"></el-option>
        </el-select>

        <AlgorithmSelector
            :algorithm-type="props.algorithmType"
            :specific-algorithm="props.specificAlgorithm"
            @update:algorithmType="emit('update:algorithmType', $event)"
            @update:specificAlgorithm="emit('update:specificAlgorithm', $event)"
        />

        <el-button
            class="inference-button"
            @click="emit('infer')"
            :disabled="props.isLoading || !props.canInferInCurrentMode">
          {{ props.isMultiFrameMode ? '识别多帧' : '识别单帧' }}
        </el-button>
      </el-col>
      <el-col :span="12" class="right-menu-buttons">
        <ActionButtons
            :is-loading="props.isLoading"
            @custom-action-3="emit('customAction3')"
            @edit-config="props.onOpenConfigEditor"
        />
      </el-col>
    </el-row>


    <el-row :gutter="10" class="additional-inputs-row image-params-row" align="middle">
      <el-col :span="12">
        <el-row :gutter="12" align="middle">
          <el-col :span="12">
            <div class="param-input-group">
              <span class="param-label">图像行数 (Rows):</span>
              <el-input-number
                  :model-value="props.imageRows"
                  @update:model-value="emit('update:imageRows', $event)"
                  :min="1" controls-position="right" class="param-input-number" placeholder="行数"></el-input-number>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="param-input-group">
              <span class="param-label">图像列数 (Cols):</span>
              <el-input-number
                  :model-value="props.imageCols"
                  @update:model-value="emit('update:imageCols', $event)"
                  :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>
            </div>
          </el-col>
        </el-row>
      </el-col>
      <el-col :span="6">
        <div class="param-input-group">
          <span class="param-label">数据精度:</span>
          <el-select
              :model-value="props.selectedPrecision"
              @update:model-value="emit('update:selectedPrecision', $event)"
              class="param-input-select">
            <el-option label="64位浮点" value="float64" />
            <el-option label="32位浮点" value="float32" />
            <el-option label="16位整型" value="uint16" />
            <el-option label="8位整型" value="uint8" />
          </el-select>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="additional-inputs-row" v-if="props.isMultiFrameMode">
      <el-col :span="18">
        <el-input
            :model-value="props.manualFolderPath"
            @update:model-value="emit('update:manualFolderPath', $event)"
            placeholder="请输入用于识别的文件夹绝对路径"
            clearable
            @keyup.enter="emit('confirmManualFolderPath')">
          <template #prepend>识别路径</template>
        </el-input>
      </el-col>
      <el-col :span="6">
        <el-button @click="emit('confirmManualFolderPath')" style="width: 100%;">确认目录</el-button>
      </el-col>
    </el-row>

    <IniConfigEditor
        :visible="props.isConfigEditorVisible"
        @update:visible="emit('update:isConfigEditorVisible', $event)"
        :initial-data="props.currentConfig"
        @save="props.onSaveConfig"
    />
  </div>
</template>

<script setup>
import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';
import AlgorithmSelector from '../imgProcess/AlgorithmSelector.vue';
import ActionButtons from '../imgProcess/ActionButtons.vue';
import IniConfigEditor from '../imgProcess/IniConfigEditor.vue';

const props = defineProps({
  selectedMode: String,
  algorithmType: String,
  specificAlgorithm: String,
  isLoading: Boolean,
  canInferInCurrentMode: Boolean,
  isMultiFrameMode: Boolean,
  imageRows: Number,
  imageCols: Number,
  selectedPrecision: String,
  manualFolderPath: String,
  isConfigEditorVisible: Boolean,
  currentConfig: Object,
  onOpenConfigEditor: Function,
  onSaveConfig: Function,
});

const emit = defineEmits([
  'update:selectedMode',
  'update:algorithmType',
  'update:specificAlgorithm',
  'update:imageRows',
  'update:imageCols',
  'update:selectedPrecision',
  'update:manualFolderPath',
  'infer',
  'customAction3',
  'confirmManualFolderPath',
  'update:isConfigEditorVisible'
]);
</script>

<style scoped>
.control-panel-wrapper {
  margin-bottom: 20px;
}
.menu-button-row, .additional-inputs-row {
  margin-bottom: 15px;
}
.left-menu-buttons, .right-menu-buttons {
  display: flex;
  align-items: center;
}
.image-params-row {
  margin-top: 15px;
}
.param-input-group {
  display: flex;
  align-items: center;
  width: 100%;
}
.param-label {
  margin-right: 8px;
  color: white;
  font-size: 14px;
  white-space: nowrap;
}
.param-input-number, .param-input-select {
  flex-grow: 1;
}
.custom-menu-select {
  width: 150px;
  margin-right: 15px;
  border-radius: 4px;
}
.custom-menu-select :deep(.el-input__wrapper) {
  background-color: rgb(27, 151, 203) !important;
  box-shadow: none !important;
  border-radius: 4px !important;
  border: 1px solid transparent !important;
  padding-right: 30px;
}
.custom-menu-select :deep(.el-input__inner) {
  color: white !important;
  line-height: normal;
  height: auto;
  text-align: left;
}
.inference-button {
  background-color:rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.inference-button:hover {
  background-color: rgb(53, 53, 53);
}
.inference-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style>