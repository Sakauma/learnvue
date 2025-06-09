/*ImgProcess.vue*/
<!--<template>-->
<!--  <div id="back-block">-->
<!--    <div id="log-out-bgd">-->
<!--      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>-->
<!--    </div>-->
<!--    <div id="pst">-->
<!--      <p id="logo">XJYTXFX 软件</p>-->
<!--    </div>-->

<!--    <div class="control-panel-wrapper">-->
<!--      <el-row class="menu-button-row">-->
<!--        <el-col :span="12" class="left-menu-buttons">-->
<!--          <el-select-->
<!--              :model-value="selectedMode"-->
<!--              @update:model-value="handleModeChange"-->
<!--              class="mode-select custom-menu-select"-->
<!--              placeholder="选择模式">-->
<!--            <el-option label="单帧模式" value="singleFrame"></el-option>-->
<!--            <el-option label="多帧模式" value="multiFrame"></el-option>-->
<!--          </el-select>-->
<!--          <AlgorithmSelector-->
<!--              v-model:algorithmType="selectedAlgorithmType"-->
<!--              v-model:specificAlgorithm="selectedSpecificAlgorithm"-->
<!--          />-->
<!--          <el-button-->
<!--              class="inference-button"-->
<!--              @click="handleInfer"-->
<!--              :disabled="isLoading || !canInferInCurrentMode">-->
<!--            {{ isMultiFrameMode ? '识别多帧' : '识别单帧' }}-->
<!--          </el-button>-->
<!--        </el-col>-->
<!--        <el-col :span="12" class="right-menu-buttons">-->
<!--          <ActionButtons :is-loading="isLoading" @custom-action-3="handleCustomAction3" />-->
<!--        </el-col>-->
<!--      </el-row>-->
<!--      <el-row :gutter="10" class="additional-inputs-row image-params-row" align="middle">-->
<!--        <el-col :span="12">-->
<!--          <el-row :gutter="12" align="middle">-->
<!--            <el-col :span="12">-->
<!--              <div class="param-input-group">-->
<!--                <span class="param-label">图像行数 (Rows):</span>-->
<!--                <el-input-number v-model="imageRows" :min="1" controls-position="right" class="param-input-number" placeholder="行数"></el-input-number>-->
<!--              </div>-->
<!--            </el-col>-->
<!--            <el-col :span="12">-->
<!--              <div class="param-input-group">-->
<!--                <span class="param-label">图像列数 (Cols):</span>-->
<!--                <el-input-number v-model="imageCols" :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>-->
<!--              </div>-->
<!--            </el-col>-->
<!--          </el-row>-->
<!--        </el-col>-->
<!--        <el-col :span="6">-->
<!--          <div class="param-input-group">-->
<!--            <span class="param-label">数据精度:</span>-->
<!--            <el-select v-model="selectedPrecision" class="param-input-select">-->
<!--              <el-option label="64位浮点" value="float64" />-->
<!--              <el-option label="32位浮点" value="float32" />-->
<!--              <el-option label="16位整型" value="uint16" />-->
<!--              <el-option label="8位整型" value="uint8" />-->
<!--            </el-select>-->
<!--          </div>-->
<!--        </el-col>-->
<!--      </el-row>-->
<!--      <el-row :gutter="20" class="additional-inputs-row" v-if="isMultiFrameMode">-->
<!--        <el-col :span="18">-->
<!--          <el-input v-model="manualFolderPath" placeholder="请输入用于识别的文件夹绝对路径" clearable @keyup.enter="confirmManualFolderPath">-->
<!--            <template #prepend>识别路径</template>-->
<!--          </el-input>-->
<!--        </el-col>-->
<!--        <el-col :span="6">-->
<!--          <el-button @click="confirmManualFolderPath" style="width: 100%;">确认目录</el-button>-->
<!--        </el-col>-->
<!--      </el-row>-->
<!--    </div>-->

<!--    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog" />-->

<!--    <el-row :gutter="20" class="main-content-row">-->
<!--      <el-col :span="12" class="layout-column image-col">-->

<!--        <div v-if="!isMultiFrameMode" class="viewer-wrapper">-->
<!--          <div class="main-viewer-area">-->
<!--            <SingleFrameSystem class="viewer-controls"-->
<!--                               :is-cropping="isCroppingActive"-->
<!--                               :can-delete="!!singleFrameImageHandler.originalFile.value"-->
<!--                               :can-crop="!!singleFrameImageHandler.originalFile.value"-->
<!--                               :file-name="singleFrameImageHandler.imageName.value"-->
<!--                               @file-selected="receiveFileFromMainViewer"-->
<!--                               @delete-image="handleDeleteSingleFrameImage"-->
<!--                               @zoom-in="zoomIn" @zoom-out="zoomOut"-->
<!--                               @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop" />-->
<!--            <MainImageViewer class="viewer-content"-->
<!--                             ref="mainViewerRef"-->
<!--                             :image-url="singleFrameImageHandler.imageUrl.value"-->
<!--                             :zoom-level="zoomLevel"-->
<!--                             :is-cropping-active="isCroppingActive"-->
<!--                             @crop-confirmed="onSingleFrameCropConfirmed" />-->
<!--          </div>-->
<!--        </div>-->

<!--        <MultiFrameSystem v-else class="viewer-wrapper"-->
<!--                          ref="multiFrameSystemRef"-->
<!--                          :zoom-level="zoomLevel"-->
<!--                          :image-rows="imageRows" :image-cols="imageCols"-->
<!--                          :actualResultFrameCount="numberOfResultFrames"-->
<!--                          v-model:currentResultFrameIndex="currentMultiFrameIndex"-->
<!--                          @request-folder-select="triggerFolderDialogForPathHint"-->
<!--                          @zoom-in="zoomIn" @zoom-out="zoomOut"-->
<!--                          @delete-all-frames="handleClearAllMultiFrames" />-->

<!--        <ImageZoomSlider class="layout-item zoom-slider-layout" v-model="zoomLevel" />-->
<!--        <div class="results-content-wrapper">-->
<!--          <template v-if="isMultiFrameMode">-->
<!--            <ImageViewerCard-->
<!--                class="additional-viewer-card"-->
<!--                :image-url="multiFrameRoiImage"-->
<!--                label="感兴趣区域图像"-->
<!--            />-->
<!--            <ImageViewerCard-->
<!--                class="additional-viewer-card"-->
<!--                :image-url="multiFrameResultImage"-->
<!--                label="结果图像"-->
<!--            />-->
<!--            <div v-if="!multiFrameResultImage && !multiFrameRoiImage" class="no-results-placeholder">-->
<!--              <span>导航以查看结果帧</span>-->
<!--            </div>-->
<!--          </template>-->

<!--          <template v-else>-->
<!--            <ImageViewerCard-->
<!--                v-for="image in additionalImages"-->
<!--                :key="image.id"-->
<!--                class="additional-viewer-card"-->
<!--                :image-url="image.url"-->
<!--                :label="image.label"-->
<!--            />-->
<!--            <div v-if="additionalImages.length === 0" class="no-results-placeholder">-->
<!--              <span>暂无结果图像</span>-->
<!--            </div>-->
<!--          </template>-->

<!--        </div>-->

<!--        <BackendLogs class="layout-item logs-layout"-->
<!--                     :logs="parsedLogs"-->
<!--                     :connectionStatus="connectionStatus"-->
<!--                     :connectionAttempts="connectionAttempts"-->
<!--                     @toggle-connection="toggleSseConnection"-->
<!--                     @clear-logs="clearAllLogsAndReports" />-->
<!--      </el-col>-->

<!--      <el-col :span="12" class="layout-column chart-col">-->
<!--        <ChartGrid class="layout-item chart-grid-layout" :feature-data="allFeaturesData" />-->
<!--        <ResultData class="layout-item result-data-layout"-->
<!--                    :idx="currentMultiFrameIndex"-->
<!--                    :dataMode="isMultiFrameMode && allFeaturesData && Object.keys(allFeaturesData).length > 0"-->
<!--                    :dataValue="allFeaturesData" />-->
<!--        <AlgorithmReport class="layout-item report-layout" :logs="parsedLogs" ref="dataColumnRef" />-->
<!--      </el-col>-->
<!--    </el-row>-->

<!--    <AppNotification :notification-state="notifications.notificationState" />-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { ref } from 'vue';-->

<!--// 导入所有需要的 UI 子组件-->
<!--import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';-->
<!--import { CloseBold } from '@element-plus/icons-vue';-->
<!--import SingleFrameSystem from './imgProcess/SingleFrameSystem.vue';-->
<!--import AlgorithmSelector from './imgProcess/AlgorithmSelector.vue';-->
<!--import ActionButtons from './imgProcess/ActionButtons.vue';-->
<!--import MainImageViewer from './imgProcess/MainImageViewer.vue';-->
<!--import MultiFrameSystem from './imgProcess/MultiFrameSystem.vue';-->
<!--import ImageZoomSlider from './imgProcess/ImageZoomSlider.vue';-->
<!--import ImageViewerCard from './imgProcess/ImageViewerCard.vue';-->
<!--import ChartGrid from './imgProcess/ChartGrid.vue';-->
<!--import AppNotification from './imgProcess/AppNotification.vue';-->
<!--import ResultData from './imgProcess/ResultData.vue';-->
<!--import BackendLogs from './imgProcess/BackendLogs.vue';-->
<!--import AlgorithmReport from './imgProcess/AlgorithmReport.vue';-->

<!--// 导入业务流程编排器-->
<!--import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';-->

<!--// 1. 准备好所有需要的 ref-->
<!--const mainViewerRef = ref(null);-->
<!--const multiFrameSystemRef = ref(null);-->
<!--const dataColumnRef = ref(null);-->
<!--const folderInputRef = ref(null);-->

<!--// 2. 调用编排器，获取所有需要的数据和方法-->
<!--const {-->
<!--  // 状态和 Refs-->
<!--  selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,-->
<!--  imageRows, imageCols, selectedPrecision, manualFolderPath,-->
<!--  currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,-->
<!--  zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,-->
<!--  notifications,-->
<!--  additionalImages,-->
<!--  isCroppingActive,-->
<!--  numberOfResultFrames,-->
<!--  multiFrameRoiImage,-->
<!--  multiFrameResultImage,-->

<!--  // 方法-->
<!--  handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,-->
<!--  onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,-->
<!--  handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,-->
<!--  toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut,-->
<!--  toggleCropping, handleConfirmCrop-->
<!--} = useProcessOrchestrator(mainViewerRef, multiFrameSystemRef, dataColumnRef, folderInputRef);-->
<!--</script>-->

<!--<style scoped>-->
<!--#back-block {-->
<!--  height: 100vh;-->
<!--  background-color: rgb(27, 40, 56);-->
<!--  overflow-y: auto;-->
<!--  padding: 0 20px 30px;-->
<!--  position: relative;-->
<!--  font-family: "Microsoft YaHei", sans-serif;-->
<!--}-->
<!--#log-out-bgd {-->
<!--  position: absolute;-->
<!--  top: 10px;-->
<!--  right: 10px;-->
<!--  margin: 0;-->
<!--}-->
<!--#logo {-->
<!--  font-size: 2.5rem;-->
<!--  text-align: center;-->
<!--  margin: 0 0 20px;-->
<!--  color: white;-->
<!--  font-weight: bold;-->
<!--}-->
<!--.custom-close-button {-->
<!--  padding: 8px 8px;-->
<!--  background-color: rgb(25, 25, 25);-->
<!--  color: white;-->
<!--  border: none;-->
<!--  border-radius: 8px;-->
<!--  transition: all 0.3s;-->
<!--}-->
<!--.custom-close-button:hover {-->
<!--  background-color: #ff7875;-->
<!--}-->
<!--.menu-button-row, .additional-inputs-row {-->
<!--  margin-bottom: 15px;-->
<!--}-->
<!--.left-menu-buttons, .right-menu-buttons {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--}-->
<!--.image-params-row {-->
<!--  margin-top: 15px;-->
<!--}-->
<!--.param-input-group {-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  width: 100%;-->
<!--}-->
<!--.param-label {-->
<!--  margin-right: 8px;-->
<!--  color: white;-->
<!--  font-size: 14px;-->
<!--  white-space: nowrap;-->
<!--}-->
<!--.param-input-number, .param-input-select {-->
<!--  flex-grow: 1;-->
<!--}-->
<!--.custom-menu-select {-->
<!--  width: 150px;-->
<!--  margin-right: 15px;-->
<!--  border-radius: 4px;-->
<!--}-->
<!--.custom-menu-select :deep(.el-input__wrapper) {-->
<!--  background-color: rgb(27, 151, 203) !important;-->
<!--  box-shadow: none !important;-->
<!--  border-radius: 4px !important;-->
<!--  border: 1px solid transparent !important;-->
<!--  padding-right: 30px;-->
<!--}-->
<!--.custom-menu-select :deep(.el-input__inner) {-->
<!--  color: white !important;-->
<!--  line-height: normal;-->
<!--  height: auto;-->
<!--  text-align: left;-->
<!--}-->
<!--.inference-button {-->
<!--  background-color:rgb(40, 108, 153);-->
<!--  color: white;-->
<!--  border: none;-->
<!--  border-radius: 8px;-->
<!--  padding: 8px 15px;-->
<!--  margin-left: 10px;-->
<!--  cursor: pointer;-->
<!--  transition: background-color 0.3s;-->
<!--}-->
<!--.inference-button:hover {-->
<!--  background-color: rgb(53, 53, 53);-->
<!--}-->
<!--.inference-button:disabled {-->
<!--  background-color: #a0cfff;-->
<!--  cursor: not-allowed;-->
<!--}-->

<!--/* -&#45;&#45; 集中管理的布局样式 -&#45;&#45; */-->
<!--.main-content-row {-->
<!--  width: 100%;-->
<!--}-->
<!--.layout-column {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 12px;-->
<!--}-->

<!--/* 主预览区（包含单帧或多帧）*/-->
<!--.viewer-wrapper {-->
<!--  width: 100%;-->
<!--  height: 50vh; /* 稍微调大主预览区高度 */-->
<!--  flex-shrink: 0;-->
<!--  display: flex;-->
<!--  flex-wrap: nowrap;-->
<!--  gap: 12px;-->
<!--  overflow-x: auto;-->
<!--  overflow-y: hidden;-->
<!--  padding-bottom: 10px;-->
<!--  border: 1px dashed #4a4a4a;-->
<!--  position: relative; /* 为内部绝对定位的控件提供基准 */-->
<!--}-->

<!--.main-viewer-area {-->
<!--  flex-shrink: 0;-->
<!--  width: 100%; /* 单帧模式下，主预览器占满全部空间 */-->
<!--  min-width: 350px;-->
<!--  height: 100%;-->
<!--  position: relative;-->
<!--}-->
<!--.main-viewer-area > .viewer-controls {-->
<!--  position: absolute;-->
<!--  top: 0;-->
<!--  left: 0;-->
<!--  width: 100%;-->
<!--  z-index: 10;-->
<!--}-->
<!--.main-viewer-area > .viewer-content {-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--}-->

<!--/* [BUG修复] 新增的结果展示区域样式 */-->
<!--.results-display-layout {-->
<!--  height: 25vh; /* 固定高度 */-->
<!--  flex-shrink: 0;-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  background-color: #2a2a2e;-->
<!--  border-radius: 4px;-->
<!--  border: 1px solid #4a4a4a;-->
<!--}-->
<!--.results-header {-->
<!--  padding: 8px 12px;-->
<!--  border-bottom: 1px solid #4a4a4a;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.header-title {-->
<!--  color: #e0e0e0;-->
<!--  font-weight: bold;-->
<!--  font-size: 1em;-->
<!--}-->
<!--.header-subtitle {-->
<!--  color: #9e9e9e;-->
<!--  font-size: 0.8em;-->
<!--  margin-left: 10px;-->
<!--}-->
<!--.results-content-wrapper {-->
<!--  flex-grow: 1;-->
<!--  display: flex;-->
<!--  flex-wrap: nowrap;-->
<!--  gap: 12px;-->
<!--  overflow-x: auto;-->
<!--  overflow-y: hidden;-->
<!--  padding: 12px;-->
<!--}-->
<!--.additional-viewer-card {-->
<!--  flex-shrink: 0;-->
<!--  width: 30%; /* 结果区卡片宽度 */-->
<!--  min-width: 250px;-->
<!--  height: 100%;-->
<!--}-->
<!--.no-results-placeholder {-->
<!--  width: 100%;-->
<!--  height: 100%;-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  align-items: center;-->
<!--  color: #888;-->
<!--  font-style: italic;-->
<!--}-->


<!--.zoom-slider-layout,-->
<!--.result-data-layout,-->
<!--.report-layout {-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.logs-layout {-->
<!--  flex-grow: 1;-->
<!--  min-height: 200px;-->
<!--  display: flex;-->
<!--}-->
<!--.chart-grid-layout {-->
<!--  height: 60vh;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--</style>-->

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
    />

    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog" />

    <el-row :gutter="20" class="main-content-row">
      <el-col :span="12">
        <ImageColumn>
          <template #viewer>
            <SingleFrameSystem v-if="!isMultiFrameMode"
                               class="viewer-content"
                               :is-cropping="isCroppingActive"
                               :can-delete="!!singleFrameImageHandler.originalFile.value"
                               :can-crop="!!singleFrameImageHandler.originalFile.value"
                               :file-name="singleFrameImageHandler.imageName.value"
                               @file-selected="receiveFileFromMainViewer"
                               @delete-image="handleDeleteSingleFrameImage"
                               @zoom-in="zoomIn" @zoom-out="zoomOut"
                               @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop"
            >
              <MainImageViewer
                  ref="mainViewerRef"
                  :image-url="singleFrameImageHandler.imageUrl.value"
                  :zoom-level="zoomLevel"
                  :is-cropping-active="isCroppingActive"
                  @crop-confirmed="onSingleFrameCropConfirmed"
              />
            </SingleFrameSystem>

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
                <span>导航以查看结果帧</span>
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
        </ImageColumn>
      </el-col>

      <el-col :span="12">
        <DataColumn>
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
        </DataColumn>
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
import ImageColumn from './layouts/LeftColumn.vue';
import DataColumn from './layouts/RightColumn.vue';

// 导入所有需要的 UI 子组件
import SingleFrameSystem from './ImgProcess/SingleFrameSystem.vue';
import MainImageViewer from './ImgProcess/MainImageViewer.vue';
import MultiFrameSystem from './ImgProcess/MultiFrameSystem.vue';
import ImageZoomSlider from './ImgProcess/ImageZoomSlider.vue';
import ImageViewerCard from './ImgProcess/ImageViewerCard.vue';
import ChartGrid from './ImgProcess/ChartGrid.vue';
import AppNotification from './ImgProcess/AppNotification.vue';
import ResultData from './ImgProcess/ResultData.vue';
import BackendLogs from './ImgProcess/BackendLogs.vue';
import AlgorithmReport from './ImgProcess/AlgorithmReport.vue';

// 导入业务流程编排器
import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';

// 1. 准备好所有需要的 ref
const mainViewerRef = ref(null);
const multiFrameSystemRef = ref(null);
const dataColumnRef = ref(null);
const folderInputRef = ref(null);

// 2. 调用编排器，获取所有需要的数据和方法 (这部分完全不变!)
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

.viewer-content {
  width: 100%;
  height: 100%;
}

.additional-viewer-card {
  flex-shrink: 0;
  width: 30%;
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