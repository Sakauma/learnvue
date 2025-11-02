<!--/*ImgProcess.vue*/-->
<!--<template>-->
<!--  <div id="back-block">-->
<!--    <div id="log-out-bgd">-->
<!--      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>-->
<!--    </div>-->
<!--    <div id="pst">-->
<!--      <p id="logo">XJYTXFX 软件</p>-->
<!--    </div>-->
<!--&lt;!&ndash;    <ControlPanel&ndash;&gt;-->
<!--&lt;!&ndash;        :is-loading="isLoading"&ndash;&gt;-->
<!--&lt;!&ndash;        :can-infer-in-current-mode="canInferInCurrentMode"&ndash;&gt;-->
<!--&lt;!&ndash;        :is-multi-frame-mode="isMultiFrameMode"&ndash;&gt;-->
<!--&lt;!&ndash;        @infer="handleInfer"&ndash;&gt;-->
<!--&lt;!&ndash;        @open-settings="isSettingsDialogVisible = true"&ndash;&gt;-->

<!--&lt;!&ndash;        @open-config-editor="openConfigEditor"&ndash;&gt;-->
<!--&lt;!&ndash;    />&ndash;&gt;-->
<!--&lt;!&ndash;    <input type="file" ref="folderInputRef" style="display: none" @change="handleFolderSelectedViaDialog"/>&ndash;&gt;-->
<!--&lt;!&ndash;    <div class="main-content-wrapper">&ndash;&gt;-->

<!--&lt;!&ndash;      <div class="content-section image-section">&ndash;&gt;-->
<!--&lt;!&ndash;        <div class="viewer-wrapper">&ndash;&gt;-->
<!--&lt;!&ndash;          <div class="image-display-box" :class="{ 'split-view': hasResults }">&ndash;&gt;-->
<!--&lt;!&ndash;            <div v-if="!isMultiFrameMode" class="main-viewer-area">&ndash;&gt;-->
<!--&lt;!&ndash;              <SingleFrameSystem class="viewer-controls" :is-cropping="isCroppingActive" :can-delete="!!singleFrameImageHandler.originalFile.value" :can-crop="!!singleFrameImageHandler.originalFile.value" :file-name="singleFrameImageHandler.imageName.value" @file-selected="receiveFileFromMainViewer" @delete-image="handleDeleteSingleFrameImage" @zoom-in="zoomIn" @zoom-out="zoomOut" @toggle-crop="toggleCropping" @confirm-crop="handleConfirmCrop" />&ndash;&gt;-->
<!--&lt;!&ndash;              <MainImageViewer&ndash;&gt;-->
<!--&lt;!&ndash;                  ref="mainViewerRef"&ndash;&gt;-->
<!--&lt;!&ndash;                  class="viewer-content"&ndash;&gt;-->
<!--&lt;!&ndash;                  :image-url="singleFrameImageHandler.imageUrl.value"&ndash;&gt;-->
<!--&lt;!&ndash;                  :zoom-level="zoomLevel"&ndash;&gt;-->
<!--&lt;!&ndash;                  :is-cropping-active="isCroppingActive"&ndash;&gt;-->
<!--&lt;!&ndash;                  :is-trajectory-mode="isTrajectoryMode"&ndash;&gt;-->
<!--&lt;!&ndash;                  :trajectory-file="trajectoryFile"&ndash;&gt;-->
<!--&lt;!&ndash;                  @crop-confirmed="onSingleFrameCropConfirmed"&ndash;&gt;-->
<!--&lt;!&ndash;                  @zoom-in="zoomIn"&ndash;&gt;-->
<!--&lt;!&ndash;                  @zoom-out="zoomOut"&ndash;&gt;-->
<!--&lt;!&ndash;              />&ndash;&gt;-->
<!--&lt;!&ndash;            </div>&ndash;&gt;-->
<!--&lt;!&ndash;            <MultiFrameSystem v-else class="viewer-content" ref="multiFrameSystemRef" :zoom-level="zoomLevel" :loader="multiFramePreviewLoader" :image-rows="imageRows" :image-cols="imageCols" :actual-result-frame-count="numberOfResultFrames" v-model:currentResultFrameIndex="currentMultiFrameIndex" @request-folder-select="triggerFolderDialogForPathHint" @zoom-in="zoomIn" @zoom-out="zoomOut" @delete-all-frames="handleClearAllMultiFrames" />&ndash;&gt;-->
<!--&lt;!&ndash;          </div>&ndash;&gt;-->
<!--&lt;!&ndash;          <div v-if="hasResults" class="image-display-box split-view">&ndash;&gt;-->
<!--&lt;!&ndash;            <ImageViewerCard v-if="isMultiFrameMode" :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />&ndash;&gt;-->
<!--&lt;!&ndash;            <ImageViewerCard v-else-if="mainResultImage" :image-url="mainResultImage.url" :label="mainResultImage.label" class="additional-viewer-card" />&ndash;&gt;-->
<!--&lt;!&ndash;          </div>&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--&lt;!&ndash;        <div class="zoom-slider-layout" :class="{ 'split-view': hasResults }">&ndash;&gt;-->
<!--&lt;!&ndash;          <ImageZoomSlider v-model="zoomLevel" />&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--&lt;!&ndash;      </div>&ndash;&gt;-->

<!--&lt;!&ndash;      <div class="content-section chart-section">&ndash;&gt;-->
<!--&lt;!&ndash;        <ChartGrid :feature-data="allFeaturesData" />&ndash;&gt;-->
<!--&lt;!&ndash;      </div>&ndash;&gt;-->

<!--&lt;!&ndash;      <div class="content-section data-section">&ndash;&gt;-->
<!--&lt;!&ndash;        <ResultData :idx="currentMultiFrameIndex" :data-mode="isMultiFrameMode && allFeaturesData && Object.keys(allFeaturesData).length > 0" :data-value="allFeaturesData" />&ndash;&gt;-->
<!--&lt;!&ndash;        <DataProductActions v-if="isMultiFrameMode" :can-perform-action="canGenerateFullProduct" @download="downloadFullProduct" @transmit="transmitFullProduct" />&ndash;&gt;-->
<!--&lt;!&ndash;      </div>&ndash;&gt;-->

<!--&lt;!&ndash;      <div class="content-section logs-and-report-section">&ndash;&gt;-->
<!--&lt;!&ndash;        <div class="log-wrapper">&ndash;&gt;-->
<!--&lt;!&ndash;          <BackendLogs :logs="parsedLogs" :connectionStatus="connectionStatus" :connectionAttempts="connectionAttempts" @toggle-connection="toggleSseConnection" @clear-logs="clearAllLogsAndReports" />&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--&lt;!&ndash;        <div class="report-wrapper">&ndash;&gt;-->
<!--&lt;!&ndash;          <AlgorithmReport :logs="parsedLogs" ref="dataColumnRef" />&ndash;&gt;-->
<!--&lt;!&ndash;        </div>&ndash;&gt;-->
<!--&lt;!&ndash;      </div>&ndash;&gt;-->

<!--&lt;!&ndash;    </div>&ndash;&gt;-->

<!--&lt;!&ndash;    <ParameterSettingsDialog&ndash;&gt;-->
<!--&lt;!&ndash;        v-model:visible="isSettingsDialogVisible"&ndash;&gt;-->
<!--&lt;!&ndash;        :settings="parameterSettings"&ndash;&gt;-->
<!--&lt;!&ndash;        @save="handleSaveSettings"&ndash;&gt;-->
<!--&lt;!&ndash;    />&ndash;&gt;-->

<!--&lt;!&ndash;    <IniConfigEditor&ndash;&gt;-->
<!--&lt;!&ndash;        :visible="isConfigEditorVisible"&ndash;&gt;-->
<!--&lt;!&ndash;        @update:visible="isConfigEditorVisible = $event"&ndash;&gt;-->
<!--&lt;!&ndash;        :initial-data="currentConfig"&ndash;&gt;-->
<!--&lt;!&ndash;        @save="handleSaveConfig"&ndash;&gt;-->
<!--&lt;!&ndash;    />&ndash;&gt;-->

<!--&lt;!&ndash;    <div id="version-info-bgd">&ndash;&gt;-->
<!--&lt;!&ndash;      <el-button @click="isVersionDialogVisible = true" :icon="Setting" class="custom-corner-button" title="关于软件"></el-button>&ndash;&gt;-->
<!--&lt;!&ndash;    </div>&ndash;&gt;-->
<!--&lt;!&ndash;    <VersionDialog v-model:visible="isVersionDialogVisible" />&ndash;&gt;-->

<!--&lt;!&ndash;    <AppNotification :notification-state="notifications.notificationState" />&ndash;&gt;-->
<!--&lt;!&ndash;    <UploadProgressPopup :visible="isLoading && isMultiFrameMode" :progress="uploadProgress" />&ndash;&gt;-->
<!--&lt;!&ndash;  </div>&ndash;&gt;-->
<!--&lt;!&ndash;</template>&ndash;&gt;-->
<!--    <ControlPanel-->
<!--        :is-loading="isLoading"-->
<!--        :can-infer-in-current-mode="canInferInCurrentMode"-->
<!--        :is-multi-frame-mode="isManualMode"-->
<!--        @infer="handleInfer"-->
<!--        @open-settings="isSettingsDialogVisible = true"-->
<!--        @open-config-editor="openConfigEditor"-->
<!--    />-->
<!--    <input type="file" ref="folderInputRef" style="display: none" @change="handleFolderSelectedViaDialog"/>-->
<!--    <div class="main-content-wrapper">-->
<!--      <div class="content-section image-section">-->
<!--        <div class="viewer-wrapper">-->
<!--          <div class="image-display-box" :class="{ 'split-view': hasResults }">-->
<!--            <MultiFrameSystem-->
<!--                class="viewer-content"-->
<!--                ref="multiFrameSystemRef"-->
<!--                :zoom-level="zoomLevel"-->
<!--                :loader="multiFramePreviewLoader"-->
<!--                :image-rows="imageRows"-->
<!--                :image-cols="imageCols"-->
<!--                :actual-result-frame-count="numberOfResultFrames"-->
<!--                v-model:currentResultFrameIndex="currentMultiFrameIndex"-->
<!--                :trajectory-file="trajectoryFile"-->
<!--                @request-folder-select="triggerFolderDialogForPathHint"-->
<!--                @request-trajectory-select="triggerTrajectoryFileDialog"-->
<!--                @zoom-in="zoomIn"-->
<!--                @zoom-out="zoomOut"-->
<!--                @delete-all-frames="handleClearAllMultiFrames"-->
<!--            />-->
<!--          </div>-->
<!--          <div v-if="hasResults" class="image-display-box split-view">-->
<!--            <ImageViewerCard :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="zoom-slider-layout" :class="{ 'split-view': hasResults }">-->
<!--          <ImageZoomSlider v-model="zoomLevel" />-->
<!--        </div>-->
<!--      </div>-->
<!--      <div class="content-section chart-section">-->
<!--      </div>-->
<!--      <div class="content-section data-section">-->
<!--        <ResultData :idx="currentMultiFrameIndex" :data-mode="isManualMode && allFeaturesData && Object.keys(allFeaturesData).length > 0" :data-value="allFeaturesData" />-->
<!--        <DataProductActions v-if="isManualMode" :can-perform-action="canGenerateFullProduct" @download="downloadFullProduct" @transmit="transmitFullProduct" />-->
<!--      </div>-->
<!--      <div class="content-section logs-and-report-section">-->
<!--      </div>-->
<!--    </div>-->
<!--    <UploadProgressPopup :visible="isLoading && isManualMode" :progress="uploadProgress" />-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import { ref, computed } from 'vue';-->
<!--import { ElButton } from 'element-plus';-->
<!--import { CloseBold,Setting } from '@element-plus/icons-vue';-->

<!--// 导入布局组件-->
<!--import ControlPanel from './layouts/ControlPanel.vue';-->
<!--import UploadProgressPopup from './utils/UploadProgressPopup.vue';-->

<!--// 导入所有需要的 UI 子组件-->
<!--//import SingleFrameSystem from './imgProcess/SingleFrameSystem.vue';-->
<!--//import MainImageViewer from './imgProcess/MainImageViewer.vue';-->
<!--import MultiFrameSystem from './imgProcess/MultiFrameSystem.vue';-->
<!--import ImageZoomSlider from './imgProcess/ImageZoomSlider.vue';-->
<!--import ImageViewerCard from './imgProcess/ImageViewerCard.vue';-->
<!--import ChartGrid from './imgProcess/ChartGrid.vue';-->
<!--import AppNotification from './imgProcess/AppNotification.vue';-->
<!--import ResultData from './imgProcess/ResultData.vue';-->
<!--import BackendLogs from './imgProcess/BackendLogs.vue';-->
<!--import AlgorithmReport from './imgProcess/AlgorithmReport.vue';-->
<!--import VersionDialog from './utils/VersionDialog.vue';-->

<!--// 导入数据产品操作按钮组件-->
<!--import DataProductActions from './imgProcess/DataProductActions.vue';-->
<!--import ParameterSettingsDialog from './imgProcess/ParameterSettingsDialog.vue';-->
<!--import IniConfigEditor from './imgProcess/IniConfigEditor.vue';-->

<!--// 导入业务流程编排器-->
<!--import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';-->

<!--// 1. 准备好所有需要的 ref-->
<!--//const mainViewerRef = ref(null);-->
<!--const multiFrameSystemRef = ref(null);-->
<!--const dataColumnRef = ref(null);-->
<!--const folderInputRef = ref(null);-->

<!--// 2. 调用编排器，获取所有需要的数据和方法-->
<!--const {-->
<!--  // 状态和 Refs-->
<!--  selectedMode,-->
<!--  isManualMode, // <-&#45;&#45; 修改-->
<!--  // isTrajectoryMode, // <-&#45;&#45; 移除-->
<!--  trajectoryFile,-->
<!--  selectedAlgorithmType,-->
<!--  selectedSpecificAlgorithm,-->
<!--  imageRows,-->
<!--  imageCols,-->
<!--  selectedPrecision,-->
<!--  manualFolderPath,-->
<!--  currentMultiFrameIndex,-->
<!--  allFeaturesData,-->
<!--  isLoading,-->
<!--  canInferInCurrentMode,-->
<!--  zoomLevel,-->
<!--  //singleFrameImageHandler,-->
<!--  parsedLogs,-->
<!--  connectionStatus,-->
<!--  connectionAttempts,-->
<!--  notifications,-->
<!--  //additionalImages,-->
<!--  //isCroppingActive,-->
<!--  numberOfResultFrames,-->
<!--  multiFrameRoiImage,-->
<!--  multiFrameResultImage,-->
<!--  isConfigEditorVisible,-->
<!--  currentConfig,-->
<!--  openConfigEditor,-->
<!--  handleSaveConfig,-->

<!--  canGenerateFullProduct,-->
<!--  downloadFullProduct,-->
<!--  transmitFullProduct,-->

<!--  multiFramePreviewLoader,-->
<!--  uploadProgress,-->
<!--  isVersionDialogVisible,-->
<!--  isSettingsDialogVisible,-->
<!--  parameterSettings,-->
<!--  handleSaveSettings,-->

<!--  // 方法-->
<!--  handleModeChange,-->
<!--  handleInfer,-->
<!--  //receiveFileFromMainViewer,-->
<!--  //handleDeleteSingleFrameImage,-->
<!--  //onSingleFrameCropConfirmed,-->
<!--  handleFolderSelectedViaDialog,-->
<!--  confirmManualFolderPath,-->
<!--  handleClearAllMultiFrames,-->
<!--  triggerFolderDialogForPathHint,-->
<!--  triggerTrajectoryFileDialog, // <-&#45;&#45; 新增-->
<!--  logOut,-->
<!--  toggleSseConnection,-->
<!--  clearAllLogsAndReports,-->
<!--  zoomIn,-->
<!--  zoomOut,-->
<!--  //toggleCropping,-->
<!--  //handleConfirmCrop-->
<!--} = useProcessOrchestrator(multiFrameSystemRef, dataColumnRef, folderInputRef); // <-&#45;&#45; 移除 mainViewerRef-->

<!--// const hasResults = computed(() => {-->
<!--//   if (isMultiFrameMode.value) {-->
<!--//     return !!multiFrameResultImage.value;-->
<!--//   }-->
<!--//   return additionalImages.value.some(img => img.label === '结果图像');-->
<!--// });-->
<!--const hasResults = computed(() => {-->
<!--  // <-&#45;&#45; 修改：简化-->
<!--  return !!multiFrameResultImage.value;-->
<!--});-->

<!--// // 计算属性，用于分离出单帧模式下的主结果图像-->
<!--// const mainResultImage = computed(() => {-->
<!--//   if (isMultiFrameMode.value) return null;-->
<!--//   return additionalImages.value.find(img => img.label === '结果图像');-->
<!--// });-->

<!--// // 计算属性，用于分离出次要结果（如裁剪的感兴趣区域）-->
<!--// const secondaryResults = computed(() => {-->
<!--//   if (isMultiFrameMode.value) return [];-->
<!--//   return additionalImages.value.filter(img => img.label !== '结果图像');-->
<!--// });-->

<!--// const hasSecondaryResults = computed(() => {-->
<!--//   if (isMultiFrameMode.value) return !!multiFrameRoiImage.value;-->
<!--//   return secondaryResults.value.length > 0;-->
<!--// })-->
<!--</script>-->

<!--<style scoped>-->
<!--#back-block {-->
<!--  height: 100vh;-->
<!--  background-color: rgb(27, 40, 56);-->
<!--  overflow-y: auto;-->
<!--  padding: 0 20px 30px;-->
<!--  position: relative;-->
<!--  font-family: "Microsoft YaHei", sans-serif;-->
<!--  box-sizing: border-box;-->
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

<!--.custom-corner-button {-->
<!--  padding: 8px;-->
<!--  background-color: rgb(25, 25, 25);-->
<!--  color: white;-->
<!--  border: none;-->
<!--  border-radius: 8px;-->
<!--  transition: all 0.3s;-->
<!--}-->
<!--.custom-corner-button:hover {-->
<!--  background-color: #5a5a5a;-->
<!--}-->

<!--.main-content-row {-->
<!--  height: calc(100vh - 210px);-->
<!--}-->
<!--#version-info-bgd {-->
<!--  position: absolute;-->
<!--  top: 10px;-->
<!--  left: 10px;-->
<!--}-->
<!--#log-out-bgd {-->
<!--  position: absolute;-->
<!--  top: 10px;-->
<!--  right: 10px;-->
<!--}-->

<!--/* 主内容区垂直 Flex 布局 */-->
<!--.main-content-wrapper {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 20px; /* 各个分区之间的垂直间距 */-->
<!--}-->

<!--.content-section {-->
<!--  width: 100%;-->
<!--}-->

<!--/* 1. 图像分区样式 */-->
<!--.image-section {-->
<!--  height: 65vh; /* 分配一个固定的高度 */-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 10px;-->
<!--}-->
<!--.viewer-wrapper {-->
<!--  flex-grow: 1; /* 占据主要空间 */-->
<!--  display: flex;-->
<!--  gap: 12px;-->
<!--  min-height: 0;-->
<!--}-->
<!--.zoom-slider-layout {-->
<!--  flex-shrink: 0; /* 不会被压缩 */-->
<!--  transition: width 0.3s ease-in-out;-->
<!--  width: 100%;-->
<!--}-->
<!--/* 【新增】当处于并排模式时，滑动条容器宽度变为50% */-->
<!--.zoom-slider-layout.split-view {-->
<!--  width: 50%;-->
<!--}-->
<!--.image-display-box {-->
<!--  flex-grow: 1; flex-basis: 100%;-->
<!--  display: flex; justify-content: center; align-items: center;-->
<!--  transition: all 0.3s ease-in-out; position: relative; height: 100%;-->
<!--}-->
<!--.image-display-box.split-view {-->
<!--  flex-basis: 50%;-->
<!--}-->
<!--/*.main-viewer-area, .viewer-content, .additional-viewer-card {-->
<!--  position: relative; width: 100%; height: 100%;-->
<!--  border: 1px solid #4a4a4a; border-radius: 4px;-->
<!--}-->
<!--.viewer-controls { position: absolute; top: 0; left: 0; width: 100%; z-index: 10; }*/-->

<!--/* 2. 图表分区样式 */-->
<!--.chart-section {-->
<!--  height: 25vh; /* 分配一个固定的高度 */-->
<!--}-->

<!--/* 3. 数据分区样式 */-->
<!--.data-section {-->
<!--  display: flex;-->
<!--  flex-direction: column;-->
<!--  gap: 10px;-->
<!--}-->

<!--/* 4. 日志和报告分区样式 */-->
<!--.logs-and-report-section {-->
<!--  display: flex;-->
<!--  gap: 20px;-->
<!--  height: 40vh; /* 分配一个固定的高度 */-->
<!--}-->
<!--.log-wrapper, .report-wrapper {-->
<!--  flex: 1; /* 两边各占一半 */-->
<!--  min-height: 0;-->
<!--}-->
<!--</style>-->


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
        :is-loading="isLoading"
        :can-infer-in-current-mode="canInferInCurrentMode"
        :is-multi-frame-mode="isManualMode"
        @infer="handleInfer"
        @open-settings="isSettingsDialogVisible = true"
        @open-config-editor="openConfigEditor"
    />
    <input type="file" ref="folderInputRef" style="display: none" @change="handleFolderSelectedViaDialog"/>
    <div class="main-content-wrapper">

      <div class="content-section image-section">
        <div class="viewer-wrapper">
          <div class="image-display-box" :class="{ 'split-view': hasResults }">

            <MultiFrameSystem
                class="viewer-content"
                ref="multiFrameSystemRef"
                :zoom-level="zoomLevel"
                :loader="multiFramePreviewLoader"
                :image-rows="imageRows"
                :image-cols="imageCols"
                :actual-result-frame-count="numberOfResultFrames"
                v-model:currentResultFrameIndex="currentMultiFrameIndex"
                :trajectory-file="trajectoryFile"
                @request-folder-select="triggerFolderDialogForPathHint"
                @request-trajectory-select="triggerTrajectoryFileDialog"
                @zoom-in="zoomIn"
                @zoom-out="zoomOut"
                @delete-all-frames="handleClearAllMultiFrames"
            />
          </div>
          <div v-if="hasResults" class="image-display-box split-view">
            <ImageViewerCard v-if="isManualMode" :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />
          </div>
        </div>
        <div class="zoom-slider-layout" :class="{ 'split-view': hasResults }">
          <ImageZoomSlider v-model="zoomLevel" />
        </div>
      </div>

      <div class="content-section chart-section">
        <ChartGrid :feature-data="allFeaturesData" />
      </div>

      <div class="content-section data-section">
        <ResultData :idx="currentMultiFrameIndex" :data-mode="isManualMode && allFeaturesData && Object.keys(allFeaturesData).length > 0" :data-value="allFeaturesData" />
        <DataProductActions v-if="isManualMode" :can-perform-action="canGenerateFullProduct" @download="downloadFullProduct" @transmit="transmitFullProduct" />
      </div>

      <div class="content-section logs-and-report-section">
        <div class="log-wrapper">
          <BackendLogs :logs="parsedLogs" :connectionStatus="connectionStatus" :connectionAttempts="connectionAttempts" @toggle-connection="toggleSseConnection" @clear-logs="clearAllLogsAndReports" />
        </div>
        <div class="report-wrapper">
          <AlgorithmReport :logs="parsedLogs" ref="dataColumnRef" />
        </div>
      </div>

    </div>

    <ParameterSettingsDialog
        v-model:visible="isSettingsDialogVisible"
        :settings="parameterSettings"
        @save="handleSaveSettings"
    />

    <IniConfigEditor
        :visible="isConfigEditorVisible"
        @update:visible="isConfigEditorVisible = $event"
        :initial-data="currentConfig"
        @save="handleSaveConfig"
    />

    <div id="version-info-bgd">
      <el-button @click="isVersionDialogVisible = true" :icon="Setting" class="custom-corner-button" title="关于软件"></el-button>
    </div>
    <VersionDialog v-model:visible="isVersionDialogVisible" />

    <AppNotification :notification-state="notifications.notificationState" />
    <UploadProgressPopup :visible="isLoading && isManualMode" :progress="uploadProgress" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElButton } from 'element-plus';
import { CloseBold,Setting } from '@element-plus/icons-vue';

// 导入布局组件
import ControlPanel from './layouts/ControlPanel.vue';
import UploadProgressPopup from './utils/UploadProgressPopup.vue';

// 导入所有需要的 UI 子组件
// --- 修正：移除了 SingleFrameSystem 和 MainImageViewer ---
import MultiFrameSystem from './imgProcess/MultiFrameSystem.vue';
import ImageZoomSlider from './imgProcess/ImageZoomSlider.vue';
import ImageViewerCard from './imgProcess/ImageViewerCard.vue';
import ChartGrid from './imgProcess/ChartGrid.vue';
import AppNotification from './imgProcess/AppNotification.vue';
import ResultData from './imgProcess/ResultData.vue';
import BackendLogs from './imgProcess/BackendLogs.vue';
import AlgorithmReport from './imgProcess/AlgorithmReport.vue';
import VersionDialog from './utils/VersionDialog.vue';

// 导入数据产品操作按钮组件
import DataProductActions from './imgProcess/DataProductActions.vue';
import ParameterSettingsDialog from './imgProcess/ParameterSettingsDialog.vue';
import IniConfigEditor from './imgProcess/IniConfigEditor.vue';

// 导入业务流程编排器
import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';

// --- 修正：更新了 ref 的定义 ---
// 1. 准备好所有需要的 ref
// const mainViewerRef = ref(null); // <-- 移除
const multiFrameSystemRef = ref(null);
const dataColumnRef = ref(null);
const folderInputRef = ref(null);

// --- 修正：更新了 orchestrator 的调用和解构 ---
// 2. 调用编排器，获取所有需要的数据和方法
const {
  // 状态和 Refs
  selectedMode,
  isManualMode, // <-- 修改
  trajectoryFile,
  selectedAlgorithmType, selectedSpecificAlgorithm,
  imageRows, imageCols, selectedPrecision,
  currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,
  zoomLevel,
  // singleFrameImageHandler, // <-- 移除
  parsedLogs, connectionStatus, connectionAttempts,
  notifications,
  // additionalImages, // <-- 移除
  // isCroppingActive, // <-- 移除
  numberOfResultFrames,
  multiFrameRoiImage,
  multiFrameResultImage,
  isConfigEditorVisible,
  currentConfig,
  openConfigEditor,
  handleSaveConfig,

  canGenerateFullProduct,
  downloadFullProduct,
  transmitFullProduct,

  multiFramePreviewLoader,
  uploadProgress,
  isVersionDialogVisible,
  isSettingsDialogVisible, // <-- 确保此项存在
  parameterSettings,
  handleSaveSettings,

  // 方法
  handleModeChange,
  handleInfer,
  // <-- 移除 (receiveFileFromMainViewer, handleDeleteSingleFrameImage, onSingleFrameCropConfirmed)
  handleFolderSelectedViaDialog,
  handleClearAllMultiFrames,
  triggerFolderDialogForPathHint,
  triggerTrajectoryFileDialog, // <-- 新增
  logOut,
  toggleSseConnection,
  clearAllLogsAndReports,
  zoomIn,
  zoomOut,
  // <-- 移除 (toggleCropping, handleConfirmCrop)
} = useProcessOrchestrator(multiFrameSystemRef, dataColumnRef, folderInputRef); // <-- 修正：移除了 mainViewerRef

const hasResults = computed(() => {
  // <--- 修改：简化
  return !!multiFrameResultImage.value;
});

// <--- 移除：mainResultImage, secondaryResults, hasSecondaryResults
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

.custom-corner-button {
  padding: 8px;
  background-color: rgb(25, 25, 25);
  color: white;
  border: none;
  border-radius: 8px;
  transition: all 0.3s;
}
.custom-corner-button:hover {
  background-color: #5a5a5a;
}

.main-content-row {
  height: calc(100vh - 210px);
}
#version-info-bgd {
  position: absolute;
  top: 10px;
  left: 10px;
}
#log-out-bgd {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* 主内容区垂直 Flex 布局 */
.main-content-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 各个分区之间的垂直间距 */
}

.content-section {
  width: 100%;
}

/* 1. 图像分区样式 */
.image-section {
  height: 65vh; /* 分配一个固定的高度 */
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.viewer-wrapper {
  flex-grow: 1; /* 占据主要空间 */
  display: flex;
  gap: 12px;
  min-height: 0;
}
.zoom-slider-layout {
  flex-shrink: 0; /* 不会被压缩 */
  transition: width 0.3s ease-in-out;
  width: 100%;
}
/* 【新增】当处于并排模式时，滑动条容器宽度变为50% */
.zoom-slider-layout.split-view {
  width: 50%;
}
.image-display-box {
  flex-grow: 1; flex-basis: 100%;
  display: flex; justify-content: center; align-items: center;
  transition: all 0.3s ease-in-out; position: relative; height: 100%;
}
.image-display-box.split-view {
  flex-basis: 50%;
}
/* --- 修正：移除了 .main-viewer-area 和 .viewer-controls --- */
.viewer-content, .additional-viewer-card {
  position: relative; width: 100%; height: 100%;
  border: 1px solid #4a4a4a; border-radius: 4px;
}

/* 2. 图表分区样式 */
.chart-section {
  height: 25vh; /* 分配一个固定的高度 */
}

/* 3. 数据分区样式 */
.data-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 4. 日志和报告分区样式 */
.logs-and-report-section {
  display: flex;
  gap: 20px;
  height: 40vh; /* 分配一个固定的高度 */
}
.log-wrapper, .report-wrapper {
  flex: 1; /* 两边各占一半 */
  min-height: 0;
}

</style>