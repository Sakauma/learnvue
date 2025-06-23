/*ImgProcess.vue*/
<template>
  <div id="back-block">
    <div id="log-out-bgd">
      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>
    </div>
    <div id="pst">
      <p id="logo">XJYTXFX 软件</p>
    </div>
    <ControlPanel
        v-model:selectedMode="selectedMode"
        v-model:algorithmType="selectedAlgorithmType"
        v-model:specificAlgorithm="selectedSpecificAlgorithm"
        v-model:imageRows="imageRows"
        v-model:imageCols="imageCols"
        v-model:selectedPrecision="selectedPrecision"
        v-model:manualFolderPath="manualFolderPath"
        :is-loading="isLoading"
        :can-infer-in-current-mode="canInferInCurrentMode"
        :is-multi-frame-mode="isMultiFrameMode"
        @infer="handleInfer"
        @custom-action-3="handleCustomAction3"
        @confirm-manual-folder-path="confirmManualFolderPath"
        v-model:isConfigEditorVisible="isConfigEditorVisible"
        :current-config="currentConfig"
        :on-open-config-editor="openConfigEditor"
        :on-save-config="handleSaveConfig"
    />
    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog"/>

    <el-row :gutter="20" class="main-content-row">
      <el-col :span="12">
        <LeftColumn>
          <template #viewer>
            <div v-if="!isMultiFrameMode" class="main-viewer-area">
              <SingleFrameSystem
                  class="viewer-controls"
                  :is-cropping="isCroppingActive"
                  :can-delete="!!singleFrameImageHandler.originalFile.value"
                  :can-crop="!!singleFrameImageHandler.originalFile.value"
                  :file-name="singleFrameImageHandler.imageName.value"
                  @file-selected="receiveFileFromMainViewer"
                  @delete-image="handleDeleteSingleFrameImage"
                  @zoom-in="zoomIn" @zoom-out="zoomOut"
                  @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop"
              />
              <MainImageViewer
                  ref="mainViewerRef"
                  class="viewer-content"
                  :image-url="singleFrameImageHandler.imageUrl.value"
                  :zoom-level="zoomLevel"
                  :is-cropping-active="isCroppingActive"
                  @crop-confirmed="onSingleFrameCropConfirmed"
              />
            </div>

            <MultiFrameSystem v-else class="viewer-content"
                              ref="multiFrameSystemRef"
                              :zoom-level="zoomLevel"
                              :image-rows="imageRows" :image-cols="imageCols"
                              :actual-result-frame-count="numberOfResultFrames"
                              v-model:currentResultFrameIndex="currentMultiFrameIndex"
                              @request-folder-select="triggerFolderDialogForPathHint"
                              @zoom-in="zoomIn" @zoom-out="zoomOut"
                              @delete-all-frames="handleClearAllMultiFrames"
            />
          </template>
          <template #zoom>
            <ImageZoomSlider v-model="zoomLevel" />
          </template>
          <template #results>
            <template v-if="isMultiFrameMode">
              <ImageViewerCard :image-url="multiFrameRoiImage" label="感兴趣区域图像" class="additional-viewer-card" />
              <ImageViewerCard :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />
              <div v-if="!multiFrameResultImage && !multiFrameRoiImage" class="no-results-placeholder">
              </div>
            </template>
            <template v-else>
              <ImageViewerCard v-for="image in additionalImages" :key="image.id" class="additional-viewer-card" :image-url="image.url" :label="image.label" />
              <div v-if="additionalImages.length === 0" class="no-results-placeholder">
                <span>暂无结果图像</span>
              </div>
            </template>
          </template>
          <template #logs>
            <BackendLogs
                :logs="parsedLogs"
                :connectionStatus="connectionStatus"
                :connectionAttempts="connectionAttempts"
                @toggle-connection="toggleSseConnection"
                @clear-logs="clearAllLogsAndReports" />
          </template>
        </LeftColumn>
      </el-col>

      <el-col :span="12">
        <RightColumn>
          <template #charts>
            <ChartGrid :feature-data="allFeaturesData" />
          </template>
          <template #data>
            <ResultData
                :idx="currentMultiFrameIndex"
                :data-mode="isMultiFrameMode && allFeaturesData && Object.keys(allFeaturesData).length > 0"
                :data-value="allFeaturesData" />
          </template>
          <template #report>
            <AlgorithmReport :logs="parsedLogs" ref="dataColumnRef" />
          </template>
        </RightColumn>
      </el-col>
    </el-row>

    <AppNotification :notification-state="notifications.notificationState" />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElRow, ElCol, ElButton } from 'element-plus';
import { CloseBold } from '@element-plus/icons-vue';

// 导入布局组件
import ControlPanel from './layouts/ControlPanel.vue';
import LeftColumn from './layouts/LeftColumn.vue';
import RightColumn from './layouts/RightColumn.vue';

// 导入所有需要的 UI 子组件
import SingleFrameSystem from './imgProcess/SingleFrameSystem.vue';
import MainImageViewer from './imgProcess/MainImageViewer.vue';
import MultiFrameSystem from './imgProcess/MultiFrameSystem.vue';
import ImageZoomSlider from './imgProcess/ImageZoomSlider.vue';
import ImageViewerCard from './imgProcess/ImageViewerCard.vue';
import ChartGrid from './imgProcess/ChartGrid.vue';
import AppNotification from './imgProcess/AppNotification.vue';
import ResultData from './imgProcess/ResultData.vue';
import BackendLogs from './imgProcess/BackendLogs.vue';
import AlgorithmReport from './imgProcess/AlgorithmReport.vue';

// 导入业务流程编排器
import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';

// 1. 准备好所有需要的 ref
const mainViewerRef = ref(null);
const multiFrameSystemRef = ref(null);
const dataColumnRef = ref(null);
const folderInputRef = ref(null);

// 2. 调用编排器，获取所有需要的数据和方法
const {
  // 状态和 Refs
  selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
  imageRows, imageCols, selectedPrecision, manualFolderPath,
  currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,
  zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,
  notifications,
  additionalImages,
  isCroppingActive,
  numberOfResultFrames,
  multiFrameRoiImage,
  multiFrameResultImage,
  isConfigEditorVisible,
  currentConfig,
  openConfigEditor,
  handleSaveConfig,

  // 方法
  handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,
  onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,
  handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,
  toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut,
  toggleCropping, handleConfirmCrop
} = useProcessOrchestrator(mainViewerRef, multiFrameSystemRef, dataColumnRef, folderInputRef);
</script>

<style scoped>
#back-block {
  height: 100vh;
  background-color: rgb(27, 40, 56);
  overflow-y: auto;
  padding: 0 20px 30px;
  position: relative;
  font-family: "Microsoft YaHei", sans-serif;
  box-sizing: border-box;
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
.custom-close-button {
  padding: 8px 8px;
  background-color: rgb(25, 25, 25);
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s;
}
.custom-close-button:hover {
  background-color: #ff7875;
}
.main-content-row {
  height: calc(100vh - 210px);
}
.main-viewer-area {
  position: relative;
  width: 100%;
  height: 100%;
}
.viewer-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
}
.viewer-content {
  width: 100%;
  height: 100%;
}
.additional-viewer-card {
  flex-shrink: 0;
  width: 45%;
  min-width: 250px;
  height: 100%;
}
.no-results-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #888;
  font-style: italic;
}
</style>