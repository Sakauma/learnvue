<template>
  <div class="control-panel-wrapper">
    <!-- 控制面板的主容器，包含所有控制元素 -->
    <el-row class="menu-button-row">
      <!-- 第一行：包含模式选择、算法选择和识别按钮 -->
      <el-col :span="12" class="left-menu-buttons">
        <!-- 左侧菜单按钮组 -->
        <el-select
            :model-value="props.selectedMode"
            @update:model-value="emit('update:selectedMode', $event)"
            class="mode-select custom-menu-select"
            placeholder="选择模式">
          <!-- 模式选择下拉框，用于切换单帧和多帧模式 -->
          <el-option label="单帧模式" value="singleFrame"></el-option>
          <el-option label="多帧模式" value="multiFrame"></el-option>
        </el-select>

        <AlgorithmSelector
            :algorithm-type="props.algorithmType"
            :specific-algorithm="props.specificAlgorithm"
            @update:algorithmType="emit('update:algorithmType', $event)"
            @update:specificAlgorithm="emit('update:specificAlgorithm', $event)"
        />
        <!-- 算法选择器组件，用于选择图像处理算法 -->

        <el-button
            class="inference-button"
            @click="emit('infer')"
            :disabled="props.isLoading || !props.canInferInCurrentMode">
          {{ props.isMultiFrameMode ? '识别多帧' : '识别单帧' }}
        </el-button>
        <!-- 识别按钮，根据当前模式显示不同的文本，并在加载或不可识别时禁用 -->
      </el-col>
      <el-col :span="12" class="right-menu-buttons">
        <!-- 右侧菜单按钮组 -->
        <ActionButtons
            :is-loading="props.isLoading"
            @custom-action-3="emit('customAction3')"
            @edit-config="props.onOpenConfigEditor"
        />
        <!-- 操作按钮组件，包含自定义操作和配置编辑器打开功能 -->
      </el-col>
    </el-row>


    <el-row :gutter="10" class="additional-inputs-row image-params-row" align="middle">
      <!-- 第二行：包含图像参数输入，如行数、列数和数据精度 -->
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
            <!-- 图像行数输入框，用于设置图像的行数 -->
          </el-col>
          <el-col :span="12">
            <div class="param-input-group">
              <span class="param-label">图像列数 (Cols):</span>
              <el-input-number
                  :model-value="props.imageCols"
                  @update:model-value="emit('update:imageCols', $event)"
                  :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>
            </div>
            <!-- 图像列数输入框，用于设置图像的列数 -->
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
        <!-- 数据精度选择器，用于选择图像数据的数据类型 -->
      </el-col>
    </el-row>
    <IniConfigEditor
        :visible="props.isConfigEditorVisible"
        @update:visible="emit('update:isConfigEditorVisible', $event)"
        :initial-data="props.currentConfig"
        @save="props.onSaveConfig"
    />
    <!-- 配置编辑器组件，用于编辑和保存配置 -->
  </div>
</template>

<script setup>
import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';
import AlgorithmSelector from '../imgProcess/AlgorithmSelector.vue';
import ActionButtons from '../imgProcess/ActionButtons.vue';
import IniConfigEditor from '../imgProcess/IniConfigEditor.vue';

const props = defineProps({
  selectedMode: String, // 当前选择的模式（单帧或多帧）
  algorithmType: String, // 当前选择的算法类型
  specificAlgorithm: String, // 当前选择的特定算法
  isLoading: Boolean, // 是否正在加载
  canInferInCurrentMode: Boolean, // 当前模式是否可以识别
  isMultiFrameMode: Boolean, // 是否为多帧模式
  imageRows: Number, // 图像的行数
  imageCols: Number, // 图像的列数
  selectedPrecision: String, // 选择的数据精度
  //manualFolderPath: String, // 手动输入的文件夹路径
  isConfigEditorVisible: Boolean, // 配置编辑器是否可见
  currentConfig: Object, // 当前的配置数据
  onOpenConfigEditor: Function, // 打开配置编辑器的回调函数
  onSaveConfig: Function, // 保存配置的回调函数
});

const emit = defineEmits([
  'update:selectedMode', // 更新模式
  'update:algorithmType', // 更新算法类型
  'update:specificAlgorithm', // 更新特定算法
  'update:imageRows', // 更新图像行数
  'update:imageCols', // 更新图像列数
  'update:selectedPrecision', // 更新数据精度
  'update:manualFolderPath', // 更新手动文件夹路径
  'infer', // 触发识别
  'customAction3', // 自定义操作3
  //'confirmManualFolderPath', // 确认手动文件夹路径
  //'update:isConfigEditorVisible' // 更新配置编辑器可见性
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