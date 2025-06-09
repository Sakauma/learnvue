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
<!--          <SingleFrameSystem class="viewer-controls"-->
<!--                             :is-cropping="isCroppingActive"-->
<!--                             :can-delete="!!singleFrameImageHandler.originalFile.value"-->
<!--                             :can-crop="!!singleFrameImageHandler.originalFile.value"-->
<!--                             :file-name="singleFrameImageHandler.imageName.value"-->
<!--                             @file-selected="receiveFileFromMainViewer"-->
<!--                             @delete-image="handleDeleteSingleFrameImage"-->
<!--                             @zoom-in="zoomIn" @zoom-out="zoomOut"-->
<!--                             @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop" />-->
<!--          <MainImageViewer class="viewer-content"-->
<!--                           ref="mainViewerRef"-->
<!--                           :image-url="singleFrameImageHandler.imageUrl.value"-->
<!--                           :zoom-level="zoomLevel"-->
<!--                           :is-cropping-active="isCroppingActive"-->
<!--                           @crop-confirmed="onSingleFrameCropConfirmed" />-->
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
<!--        <ResultsDisplay class="layout-item results-display-layout"-->
<!--                        :cropped-image-url="currentDisplayCroppedOrInterestImageUrl"-->
<!--                        :result-image-url="currentDisplayResultImageUrl"-->
<!--                        :text-results="currentDisplayTextResults" />-->
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
<!--                    :dataMode="isResultsModeActive"-->
<!--                    :dataValue="allFeaturesData" />-->
<!--        <AlgorithmReport class="layout-item report-layout" :logs="parsedLogs" ref="dataColumnRef" />-->
<!--      </el-col>-->
<!--    </el-row>-->

<!--    <AppNotification :notification-state="notifications.notificationState" />-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { ref } from 'vue';-->
<!--// ... 导入所有 UI 子组件 ...-->
<!--import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';-->
<!--import { CloseBold } from '@element-plus/icons-vue';-->
<!--import SingleFrameSystem from './ImgProcess/SingleFrameSystem.vue';-->
<!--import AlgorithmSelector from './ImgProcess/AlgorithmSelector.vue';-->
<!--import ImageViewerCard from './ImgProcess/ImageViewerCard.vue';-->
<!--import ActionButtons from './ImgProcess/ActionButtons.vue';-->
<!--import MainImageViewer from './ImgProcess/MainImageViewer.vue';-->
<!--import MultiFrameSystem from './ImgProcess/MultiFrameSystem.vue';-->
<!--import ImageZoomSlider from './ImgProcess/ImageZoomSlider.vue';-->
<!--import ResultsDisplay from './ImgProcess/ResultsDisplay.vue';-->
<!--import ChartGrid from './ImgProcess/ChartGrid.vue';-->
<!--import AppNotification from './ImgProcess/AppNotification.vue';-->
<!--import ResultData from './ImgProcess/ResultData.vue';-->
<!--import BackendLogs from './ImgProcess/BackendLogs.vue';-->
<!--import AlgorithmReport from './ImgProcess/AlgorithmReport.vue';-->

<!--import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';-->

<!--// 1. 准备好所有需要的 ref-->
<!--const mainViewerRef = ref(null);-->
<!--const multiFrameSystemRef = ref(null);-->
<!--const dataColumnRef = ref(null);-->
<!--const folderInputRef = ref(null);-->

<!--// 2. 调用编排器-->
<!--const {-->
<!--  // ... 解构所有属性和方法 ...-->
<!--  selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,-->
<!--  imageRows, imageCols, selectedPrecision, manualFolderPath,-->
<!--  currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,-->
<!--  zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,-->
<!--  notifications,-->
<!--  currentDisplayCroppedOrInterestImageUrl, currentDisplayResultImageUrl,-->
<!--  currentDisplayTextResults, isResultsModeActive, numberOfResultFrames,-->
<!--  isCroppingActive, // 获取新状态-->
<!--  handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,-->
<!--  onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,-->
<!--  handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,-->
<!--  toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut,-->
<!--  toggleCropping, handleConfirmCrop // 获取新方法-->
<!--} = useProcessOrchestrator(mainViewerRef, multiFrameSystemRef, dataColumnRef, folderInputRef);-->
<!--</script>-->

<!--<style scoped>-->
<!--/* ... 其他样式 ... */-->
<!--#back-block { height: 100vh; background-color: rgb(27, 40, 56); overflow-y: auto; padding: 0 20px 30px; position: relative; font-family: "Microsoft YaHei", sans-serif; }-->
<!--#log-out-bgd { position: absolute; top: 10px; right: 10px; margin: 0; }-->
<!--#logo { font-size: 2.5rem; text-align: center; margin: 0 0 20px; color: white; font-weight: bold; }-->
<!--.custom-close-button { padding: 8px 8px; background-color: rgb(25, 25, 25); color: white; border: none; border-radius: 8px; transition: all 0.3s; }-->
<!--.custom-close-button:hover { background-color: #ff7875; }-->

<!--/* -&#45;&#45; 集中管理的布局样式 -&#45;&#45; */-->
<!--.main-content-row {-->
<!--  width: 100%;-->
<!--}-->

<!--/* 定义列布局：使用flex纵向排列，并设置间距 */-->
<!--.layout-column {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 10px; /* 所有子元素之间统一的垂直间距 */-->
<!--}-->

<!--/* &#45;&#45; 左侧列布局 &#45;&#45; */-->
<!--.viewer-wrapper {-->
<!--  position: relative;-->
<!--  width: 100%;-->
<!--  height: 55vh; /* 定义主视觉区域的高度 */-->
<!--  flex-shrink: 0; /* 防止被压缩 */-->
<!--}-->
<!--.viewer-wrapper > .viewer-controls {-->
<!--  position: absolute; /* 确保工具栏在容器内绝对定位 */-->
<!--  top: 0;-->
<!--  left: 0;-->
<!--  width: 100%;-->
<!--  z-index: 10;-->
<!--}-->
<!--.viewer-wrapper > .viewer-content {-->
<!--  height: 100%; /* 图像内容填满容器 */-->
<!--  width: 100%;-->
<!--}-->
<!--.results-display-layout {-->
<!--  height: 25vh; /* 定义结果展示区的高度 */-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.results-display-layout :deep(.image-box) {-->
<!--  height: 100%; /* 让内部的 image-box 填满容器高度 */-->
<!--}-->
<!--.logs-layout {-->
<!--  flex-grow: 1; /* 日志区填满剩余所有空间 */-->
<!--  min-height: 200px; /* 保证一个最小高度 */-->
<!--}-->

<!--/* &#45;&#45; 右侧列布局 &#45;&#45; */-->
<!--.chart-grid-layout {-->
<!--  height: 60vh; /* 定义图表网格的高度 */-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.result-data-layout, .report-layout {-->
<!--  flex-shrink: 0; /* 防止被压缩 */-->
<!--}-->
<!--</style>-->

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

<!--          <ImageViewerCard-->
<!--              v-for="image in additionalImages"-->
<!--              :key="image.id"-->
<!--              class="additional-viewer-card"-->
<!--              :image-url="image.url"-->
<!--              :label="image.label"-->
<!--          />-->
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
<!--                    :dataMode="isResultsModeActive"-->
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
<!--import SingleFrameSystem from './ImgProcess/SingleFrameSystem.vue';-->
<!--import AlgorithmSelector from './ImgProcess/AlgorithmSelector.vue';-->
<!--import ActionButtons from './ImgProcess/ActionButtons.vue';-->
<!--import MainImageViewer from './ImgProcess/MainImageViewer.vue';-->
<!--import MultiFrameSystem from './ImgProcess/MultiFrameSystem.vue';-->
<!--import ImageZoomSlider from './ImgProcess/ImageZoomSlider.vue';-->
<!--import ImageViewerCard from './ImgProcess/ImageViewerCard.vue'; // 引入新组件-->
<!--import ChartGrid from './ImgProcess/ChartGrid.vue';-->
<!--import AppNotification from './ImgProcess/AppNotification.vue';-->
<!--import ResultData from './ImgProcess/ResultData.vue';-->
<!--import BackendLogs from './ImgProcess/BackendLogs.vue';-->
<!--import AlgorithmReport from './ImgProcess/AlgorithmReport.vue';-->

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
<!--  additionalImages, // 新的状态-->
<!--  isCroppingActive,-->

<!--  // 计算属性-->
<!--  currentDisplayCroppedOrInterestImageUrl, currentDisplayResultImageUrl,-->
<!--  currentDisplayTextResults, isResultsModeActive, numberOfResultFrames,-->

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

<!--/* [BUG修复] 重新为 viewer-wrapper 设置固定高度，并改为横向滚动布局 */-->
<!--.viewer-wrapper {-->
<!--  display: flex;-->
<!--  flex-wrap: nowrap; /* 关键：确保不换行，始终保持单行 */-->
<!--  gap: 12px;-->
<!--  width: 100%;-->
<!--  height: 45vh; /* 关键：恢复固定高度，防止被压缩 */-->
<!--  flex-shrink: 0;-->
<!--  overflow-x: auto; /* 关键：当内容超出时，出现横向滚动条 */-->
<!--  overflow-y: hidden; /* 隐藏纵向滚动条 */-->
<!--  padding-bottom: 10px; /* 为滚动条留出一点空间，防止遮挡内容 */-->
<!--}-->

<!--/* [BUG修复] 为主视图和附加卡片设置具体的宽度，并防止被压缩 */-->
<!--.main-viewer-area,-->
<!--.additional-viewer-card {-->
<!--  position: relative;-->
<!--  flex-shrink: 0; /* 关键：防止卡片在空间不足时被压缩变形 */-->
<!--  width: 48%; /* 预设宽度，一行大概能放两个 */-->
<!--  min-width: 350px; /* 保证最小宽度，防止过窄 */-->
<!--  height: 100%; /* 高度占满父容器 */-->
<!--}-->

<!--.main-viewer-area > .viewer-controls {-->
<!--  position: absolute;-->
<!--  top: 0;-->
<!--  left: 0;-->
<!--  width: 100%;-->
<!--  z-index: 10;-->
<!--}-->
<!--.main-viewer-area > .viewer-content {-->
<!--  height: 100%;-->
<!--  width: 100%;-->
<!--}-->

<!--.zoom-slider-layout {-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.logs-layout {-->
<!--  flex-grow: 1;-->
<!--  min-height: 200px;-->
<!--}-->
<!--.chart-grid-layout {-->
<!--  height: 60vh;-->
<!--  flex-shrink: 0;-->
<!--}-->
<!--.result-data-layout, .report-layout {-->
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
      <el-col :span="12" class="layout-column image-col">

        <div v-if="!isMultiFrameMode" class="viewer-wrapper">
          <div class="main-viewer-area">
            <SingleFrameSystem class="viewer-controls"
                               :is-cropping="isCroppingActive"
                               :can-delete="!!singleFrameImageHandler.originalFile.value"
                               :can-crop="!!singleFrameImageHandler.originalFile.value"
                               :file-name="singleFrameImageHandler.imageName.value"
                               @file-selected="receiveFileFromMainViewer"
                               @delete-image="handleDeleteSingleFrameImage"
                               @zoom-in="zoomIn" @zoom-out="zoomOut"
                               @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop" />
            <MainImageViewer class="viewer-content"
                             ref="mainViewerRef"
                             :image-url="singleFrameImageHandler.imageUrl.value"
                             :zoom-level="zoomLevel"
                             :is-cropping-active="isCroppingActive"
                             @crop-confirmed="onSingleFrameCropConfirmed" />
          </div>

          <ImageViewerCard
              v-for="image in additionalImages"
              :key="image.id"
              class="additional-viewer-card"
              :image-url="image.url"
              :label="image.label"
          />
        </div>

        <MultiFrameSystem v-else class="viewer-wrapper"
                          ref="multiFrameSystemRef"
                          :zoom-level="zoomLevel"
                          :image-rows="imageRows" :image-cols="imageCols"
                          :actualResultFrameCount="numberOfResultFrames"
                          v-model:currentResultFrameIndex="currentMultiFrameIndex"
                          @request-folder-select="triggerFolderDialogForPathHint"
                          @zoom-in="zoomIn" @zoom-out="zoomOut"
                          @delete-all-frames="handleClearAllMultiFrames" />

        <ImageZoomSlider class="layout-item zoom-slider-layout" v-model="zoomLevel" />

        <BackendLogs class="layout-item logs-layout"
                     :logs="parsedLogs"
                     :connectionStatus="connectionStatus"
                     :connectionAttempts="connectionAttempts"
                     @toggle-connection="toggleSseConnection"
                     @clear-logs="clearAllLogsAndReports" />
      </el-col>

      <el-col :span="12" class="layout-column chart-col">
        <ChartGrid class="layout-item chart-grid-layout" :feature-data="allFeaturesData" />
        <ResultData class="layout-item result-data-layout"
                    :idx="currentMultiFrameIndex"
                    :dataMode="isMultiFrameMode && allFeaturesData && Object.keys(allFeaturesData).length > 0"
                    :dataValue="allFeaturesData" />
        <AlgorithmReport class="layout-item report-layout" :logs="parsedLogs" ref="dataColumnRef" />
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
import SingleFrameSystem from './ImgProcess/SingleFrameSystem.vue';
import AlgorithmSelector from './ImgProcess/AlgorithmSelector.vue';
import ActionButtons from './ImgProcess/ActionButtons.vue';
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

/* --- 集中管理的布局样式 --- */
.main-content-row {
  width: 100%;
}
.layout-column {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.viewer-wrapper {
  width: 100%;
  height: 45vh;
  flex-shrink: 0;
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 10px;
  border: 1px dashed #4a4a4a;
}

.main-viewer-area,
.additional-viewer-card {
  flex-shrink: 0;
  width: 48%;
  min-width: 350px;
  height: 100%;
}

.main-viewer-area {
  position: relative;
}
.main-viewer-area > .viewer-controls {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 10;
}
.main-viewer-area > .viewer-content {
  width: 100%;
  height: 100%;
}

.zoom-slider-layout,
.result-data-layout,
.report-layout {
  flex-shrink: 0;
}
.logs-layout {
  flex-grow: 1;
  min-height: 200px;
}
.chart-grid-layout {
  height: 60vh;
  flex-shrink: 0;
}
</style>