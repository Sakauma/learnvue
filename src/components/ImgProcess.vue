/*ImgProcess.vue*/
<template>
  <!-- 主容器，包含整个应用的布局 -->
  <div id="back-block">
    <!-- 退出登录背景区域 -->
    <div id="log-out-bgd">
      <!-- 退出按钮，点击时调用 logOut 方法，图标为 CloseBold，类名为 custom-close-button，鼠标悬停时显示“关闭软件”提示 -->
      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>
    </div>
    <!-- 标志区域 -->
    <div id="pst">
      <!-- 显示软件名称“XJYTXFX 软件” -->
      <p id="logo">XJYTXFX 软件</p>
    </div>
    <!-- 控制面板组件，绑定多个数据和方法 -->
    <ControlPanel
        v-model:selectedMode="selectedMode"
        v-model:algorithmType="selectedAlgorithmType"
        v-model:specificAlgorithm="selectedSpecificAlgorithm"
        v-model:imageRows="imageRows"
        v-model:imageCols="imageCols"
        v-model:selectedPrecision="selectedPrecision"
        :is-loading="isLoading"
        :can-infer-in-current-mode="canInferInCurrentMode"
        :is-multi-frame-mode="isMultiFrameMode"
        @infer="handleInfer"
        @custom-action-3="handleCustomAction3"
        v-model:isConfigEditorVisible="isConfigEditorVisible"
        :current-config="currentConfig"
        :on-open-config-editor="openConfigEditor"
        :on-save-config="handleSaveConfig"
    />
    <!-- 文件选择输入框，隐藏，用于选择文件夹 -->
    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog"/>

    <!-- 主内容行，包含左右两列 -->
    <el-row :gutter="20" class="main-content-row">
      <!-- 左列，占12格 -->
      <el-col :span="12">
        <!-- 左侧列组件 -->
        <LeftColumn>
          <!-- 观察器区域 -->
          <template #viewer>
            <!-- 如果不是多帧模式，显示单帧系统 -->
            <div v-if="!isMultiFrameMode" class="main-viewer-area">
              <!-- 单帧系统组件，包含裁剪、删除、缩放等功能 -->
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
              <!-- 主图像观察器组件，显示图像，支持缩放和裁剪 -->
              <MainImageViewer
                  ref="mainViewerRef"
                  class="viewer-content"
                  :image-url="singleFrameImageHandler.imageUrl.value"
                  :zoom-level="zoomLevel"
                  :is-cropping-active="isCroppingActive"
                  @crop-confirmed="onSingleFrameCropConfirmed"
              />
            </div>
            <!-- 如果是多帧模式，显示多帧系统 -->
            <MultiFrameSystem v-else class="viewer-content"
                              ref="multiFrameSystemRef"
                              :zoom-level="zoomLevel"
                              :loader="multiFramePreviewLoader"
                              :image-rows="imageRows" :image-cols="imageCols"
                              :actual-result-frame-count="numberOfResultFrames"
                              v-model:currentResultFrameIndex="currentMultiFrameIndex"
                              @request-folder-select="triggerFolderDialogForPathHint"
                              @zoom-in="zoomIn" @zoom-out="zoomOut"
                              @delete-all-frames="handleClearAllMultiFrames"
            />
          </template>
          <!-- 缩放区域 -->
          <template #zoom>
            <!-- 图像缩放滑块组件 -->
            <ImageZoomSlider v-model="zoomLevel" />
          </template>
          <!-- 结果区域 -->
          <template #results>
            <!-- 如果是多帧模式，显示多帧结果 -->
            <template v-if="isMultiFrameMode">
              <!-- 显示感兴趣区域图像 -->
              <ImageViewerCard :image-url="multiFrameRoiImage" label="感兴趣区域图像" class="additional-viewer-card" />
              <!-- 显示结果图像 -->
              <ImageViewerCard :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />
              <!-- 如果没有结果图像，显示占位符 -->
              <div v-if="!multiFrameResultImage && !multiFrameRoiImage" class="no-results-placeholder">
              </div>
            </template>
            <!-- 如果不是多帧模式，显示单帧结果 -->
            <template v-else>
              <!-- 循环显示附加图像 -->
              <ImageViewerCard v-for="image in additionalImages" :key="image.id" class="additional-viewer-card" :image-url="image.url" :label="image.label" />
              <!-- 如果没有附加图像，显示占位符 -->
              <div v-if="additionalImages.length === 0" class="no-results-placeholder">
                <span>暂无结果图像</span>
              </div>
            </template>
          </template>
          <!-- 日志区域 -->
          <template #logs>
            <!-- 后端日志组件，显示日志、连接状态等信息 -->
            <BackendLogs
                :logs="parsedLogs"
                :connectionStatus="connectionStatus"
                :connectionAttempts="connectionAttempts"
                @toggle-connection="toggleSseConnection"
                @clear-logs="clearAllLogsAndReports" />
          </template>
        </LeftColumn>
      </el-col>

      <!-- 右列，占12格 -->
      <el-col :span="12">
        <!-- 右侧列组件 -->
        <RightColumn>
          <!-- 图表区域 -->
          <template #charts>
            <!-- 图表网格组件，显示特征数据 -->
            <ChartGrid :feature-data="allFeaturesData" />
          </template>
          <!-- 数据区域 -->
          <template #data>
            <!-- 结果数据组件，显示数据 -->
            <ResultData
                :idx="currentMultiFrameIndex"
                :data-mode="isMultiFrameMode && allFeaturesData && Object.keys(allFeaturesData).length > 0"
                :data-value="allFeaturesData" />
            <DataProductActions
                v-if="isMultiFrameMode"
                :can-perform-action="canGenerateFullProduct"
                @download="downloadFullProduct"
                @transmit="transmitFullProduct"
            />
          </template>
          <!-- 报告区域 -->
          <template #report>
            <!-- 算法报告组件，显示日志 -->
            <AlgorithmReport :logs="parsedLogs" ref="dataColumnRef" />
          </template>
        </RightColumn>
      </el-col>
    </el-row>

    <!-- 应用通知组件，显示通知状态 -->
    <AppNotification :notification-state="notifications.notificationState" />
    <UploadProgressPopup
        :visible="isLoading && isMultiFrameMode"
        :progress="uploadProgress"
    />
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
import UploadProgressPopup from './utils/UploadProgressPopup.vue'; // <-- 新增这一行

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
// 导入数据产品操作按钮组件
import DataProductActions from './imgProcess/DataProductActions.vue';

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

  // 解构出新的数据产品内容
  canGenerateFullProduct,
  downloadFullProduct,
  transmitFullProduct,

  multiFramePreviewLoader,

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