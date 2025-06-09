<template>
  <div id="back-block">
    <div id="log-out-bgd">
      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>
    </div>
    <div id="pst">
      <p id="logo">XJYTXFX 软件</p>
    </div>
    <div class="control-panel-wrapper">
      <el-row class="menu-button-row">
        <el-col :span="12" class="left-menu-buttons">
          <el-select
              :model-value="selectedMode"
              @update:model-value="handleModeChange"
              class="mode-select custom-menu-select"
              placeholder="选择模式">
            <el-option label="单帧模式" value="singleFrame"></el-option>
            <el-option label="多帧模式" value="multiFrame"></el-option>
          </el-select>
          <AlgorithmSelector
              v-model:algorithmType="selectedAlgorithmType"
              v-model:specificAlgorithm="selectedSpecificAlgorithm"
          />
          <el-button
              class="inference-button"
              @click="handleInfer"
              :disabled="isLoading || !canInferInCurrentMode">
            {{ isMultiFrameMode ? '识别多帧' : '识别单帧' }}
          </el-button>
        </el-col>
        <el-col :span="12" class="right-menu-buttons">
          <ActionButtons :is-loading="isLoading" @custom-action-3="handleCustomAction3" />
        </el-col>
      </el-row>
      <el-row :gutter="10" class="additional-inputs-row image-params-row" align="middle">
        <el-col :span="12">
          <el-row :gutter="12" align="middle">
            <el-col :span="12">
              <div class="param-input-group">
                <span class="param-label">图像行数 (Rows):</span>
                <el-input-number v-model="imageRows" :min="1" controls-position="right" class="param-input-number" placeholder="行数"></el-input-number>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="param-input-group">
                <span class="param-label">图像列数 (Cols):</span>
                <el-input-number v-model="imageCols" :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>
              </div>
            </el-col>
          </el-row>
        </el-col>
        <el-col :span="6">
          <div class="param-input-group">
            <span class="param-label">数据精度:</span>
            <el-select v-model="selectedPrecision" class="param-input-select">
              <el-option label="64位浮点" value="float64" />
              <el-option label="32位浮点" value="float32" />
              <el-option label="16位整型" value="uint16" />
              <el-option label="8位整型" value="uint8" />
            </el-select>
          </div>
        </el-col>
      </el-row>
      <el-row :gutter="20" class="additional-inputs-row" v-if="isMultiFrameMode">
        <el-col :span="18">
          <el-input v-model="manualFolderPath" placeholder="请输入用于识别的文件夹绝对路径" clearable @keyup.enter="confirmManualFolderPath">
            <template #prepend>识别路径</template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-button @click="confirmManualFolderPath" style="width: 100%;">确认目录</el-button>
        </el-col>
      </el-row>
    </div>

    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog" />

    <el-row :gutter="20" class="main-content-row">
      <el-col :span="12" class="image-col" ref="imageColumnRef">
        <MainImageViewer v-if="!isMultiFrameMode"
                         :image-url="singleFrameImageHandler.imageUrl.value"
                         :image-name-to-display="singleFrameImageHandler.imageName.value"
                         :zoom-level="zoomLevel"
                         @file-selected="receiveFileFromMainViewer"
                         @delete-image="handleDeleteSingleFrameImage"
                         @zoom-in="zoomIn" @zoom-out="zoomOut"
                         @crop-confirmed="onSingleFrameCropConfirmed" />
        <MultiFrameSystem v-else
                          :zoom-level="zoomLevel"
                          :image-rows="imageRows"
                          :image-cols="imageCols"
                          :actualResultFrameCount="numberOfResultFrames"
                          v-model:currentResultFrameIndex="currentMultiFrameIndex"
                          @request-folder-select="triggerFolderDialogForPathHint"
                          @zoom-in="zoomIn" @zoom-out="zoomOut"
                          @delete-all-frames="handleClearAllMultiFrames"
                          ref="multiFrameSystemRef" />
        <ImageZoomSlider v-model="zoomLevel" />
        <ResultsDisplay
            :cropped-image-url="currentDisplayCroppedOrInterestImageUrl"
            :result-image-url="currentDisplayResultImageUrl"
            :text-results="currentDisplayTextResults" />
        <BackendLogs
            :logs="parsedLogs"
            :connectionStatus="connectionStatus"
            :connectionAttempts="connectionAttempts"
            @toggle-connection="toggleSseConnection"
            @clear-logs="clearAllLogsAndReports" />
      </el-col>
      <el-col :span="12" class="chart-col" ref="dataColumnRef">
        <ChartGrid :feature-data="allFeaturesData" />
        <ResultData
            :idx="currentMultiFrameIndex"
            :dataMode="isResultsModeActive"
            :dataValue="allFeaturesData" />
        <AlgorithmReport :logs="parsedLogs" />
      </el-col>
    </el-row>

    <AppNotification :notification-state="notifications.notificationState" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
// 导入所有需要的 UI 子组件
import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';
import { CloseBold } from '@element-plus/icons-vue';
import AlgorithmSelector from './ImgProcess/AlgorithmSelector.vue';
import ActionButtons from './ImgProcess/ActionButtons.vue';
import MainImageViewer from './ImgProcess/MainImageViewer.vue';
import MultiFrameSystem from './ImgProcess/MultiFrameSystem.vue';
import ImageZoomSlider from './ImgProcess/ImageZoomSlider.vue';
import ResultsDisplay from './ImgProcess/ResultsDisplay.vue';
import ChartGrid from './ImgProcess/ChartGrid.vue';
import AppNotification from './ImgProcess/AppNotification.vue';
import ResultData from './ImgProcess/ResultData.vue';
import BackendLogs from './ImgProcess/BackendLogs.vue';
import AlgorithmReport from './ImgProcess/AlgorithmReport.vue';

// 导入新的业务流程编排器
import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';

/**
 * ImgProcess.vue 组件现在是一个容器
 * 1. 准备所有需要的子组件的引用 (ref)。
 * 2. 调用 `useProcessOrchestrator` 这个 Composable，获取所有需要的数据和方法。
 * 3. 将这些数据和方法绑定到模板中对应的子组件上。
 *
 * 所有复杂的业务逻辑、状态管理、事件处理都已被封装到 `useProcessOrchestrator` 中。
 */

// 1. 准备好所有需要的 ref
const dataColumnRef = ref(null);
const folderInputRef = ref(null);
const multiFrameSystemRef = ref(null);

// 2. 调用编排器，获取所有接口
const {
  // 状态和 Refs
  selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
  imageRows, imageCols, selectedPrecision, manualFolderPath,
  currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,
  zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,
  notifications,
  // 计算属性
  currentDisplayCroppedOrInterestImageUrl, currentDisplayResultImageUrl,
  currentDisplayTextResults, isResultsModeActive, numberOfResultFrames,
  // 方法
  handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,
  onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,
  handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,
  toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut
} = useProcessOrchestrator(multiFrameSystemRef, dataColumnRef, folderInputRef);

</script>

<style scoped>
#back-block {
  height: 100vh;
  background-color: rgb(27, 40, 56);
  overflow-y: auto;
  padding: 0 20px 30px;
  position: relative;
  font-family: "Microsoft YaHei", sans-serif;
}
#log-out-bgd {
  position: absolute;
  top: 10px;
  right: 10px;
  margin: 0;
}
#logo {
  font-size: 2.5rem;
  text-align: center;
  margin: 0 0 20px;
  color: white;
  font-weight: bold;
}
.menu-button-row, .additional-inputs-row { margin-bottom: 15px; }
.left-menu-buttons, .right-menu-buttons { display: flex; align-items: center; }
.image-params-row { margin-top: 15px; }
.param-input-group { display: flex; align-items: center; width: 100%; }
.param-label { margin-right: 8px; color: white; font-size: 14px; white-space: nowrap; }
.param-input-number, .param-input-select { flex-grow: 1; }
.custom-menu-select { width: 150px; margin-right: 15px; border-radius: 4px; }
.custom-menu-select :deep(.el-input__wrapper) { background-color: rgb(27, 151, 203) !important; box-shadow: none !important; border-radius: 4px !important; border: 1px solid transparent !important; padding-right: 30px; }
.custom-menu-select :deep(.el-input__inner) { color: white !important; line-height: normal; height: auto; text-align: left; }
.inference-button { background-color:rgb(40, 108, 153); color: white; border: none; border-radius: 8px; padding: 8px 15px; margin-left: 10px; cursor: pointer; transition: background-color 0.3s; }
.inference-button:hover { background-color: rgb(53, 53, 53); }
.inference-button:disabled { background-color: #a0cfff; cursor: not-allowed; }
.main-content-row { width: 100%; }
.image-col, .chart-col { display: flex; flex-direction: column; margin-top: 10px; }
.custom-close-button { padding: 8px 8px; background-color: rgb(25, 25, 25); color: white; border: none; border-radius: 8px; transition: all 0.3s; }
.custom-close-button:hover { background-color: #ff7875; }
</style>