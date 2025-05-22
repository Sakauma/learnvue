<template>
  <div id="back-block">
    <div id="log-out-bgd">
      <el-button id="log-out" @click="logOut" :icon="CloseBold" class="custom-close-button" title="关闭软件"></el-button>
    </div>
    <div id="pst">
      <p id="logo">XJYTXFX 软件</p>
    </div>

    <el-row class="menu-button-row">
      <el-col :span="12" class="left-menu-buttons">
        <el-select
            v-model="selectedMode"
            class="mode-select custom-menu-select"
            placeholder="选择模式"
            @change="handleModeChange">
          <el-option label="单帧模式" value="singleFrame"></el-option>
          <el-option label="多帧模式" value="multiFrame"></el-option>
        </el-select>

        <AlgorithmSelector
            v-model:algorithmType="selectedAlgorithmType"
            v-model:specificAlgorithm="selectedSpecificAlgorithm"
        />
        <el-button
            class="识别-button"
            @click="handleInfer"
            :disabled="isInferenceLoading || !singleFrameImageHandler.originalFile.value || !selectedSpecificAlgorithm">
          识别
        </el-button>
      </el-col>
      <el-col :span="12" class="right-menu-buttons">
        <ActionButtons
            :is-loading="isInferenceLoading"
            :can-infer="canInferInCurrentMode"
        @infer="handleInfer"
        @custom-action-3="handleCustomAction3"
        />
      </el-col>
    </el-row>

    <input
        type="file"
        ref="singleFileInputRef"
        style="display: none"
        @change="handleSingleFileSelected"
        accept="image/*,.dat,.tif,.tiff,.bmp,.gif,.jpeg,.jpg,.png"
    />
    <input
        type="file"
        ref="folderInputRef"
        style="display: none"
        webkitdirectory directory multiple
    @change="handleFolderSelected"
    />
    <el-row :gutter="20" class="main-content-row">
      <el-col :span="12" class="image-col">
        <MainImageViewer v-if="selectedMode === 'singleFrame'"
                         class="viewer-component"
                         :image-url="singleFrameImageHandler.imageUrl.value"
                         :image-name-to-display="singleFrameImageHandler.imageName.value"
                         :zoom-level="zoomLevel"
                         @request-file-select="triggerSingleFileInput"
                         @file-selected="receiveFileFromMainViewer"
                         @delete-image="handleDeleteSingleFrameImage"
                         @zoom-in="zoomIn" @zoom-out="zoomOut"
                         @crop-confirmed="onSingleFrameCropConfirmed"
                         ref="mainViewerRef"
        />
        <MultiFrameSystem v-else-if="selectedMode === 'multiFrame'"
                          class="viewer-component"
                          :zoom-level="zoomLevel"
                          @request-folder-select="triggerFolderInput"
                          @zoom-in="zoomIn" @zoom-out="zoomOut"
                          @current-frame-file-for-inference="handleCurrentFrameForInference"
                          @delete-all-frames="handleClearAllMultiFrames"
                          ref="multiFrameSystemRef"
        />
        <ImageZoomSlider v-model="zoomLevel" />
        <ResultsDisplay
            :cropped-image-url="croppedImageUrl"
            :result-image-url="inferenceHandler.resultImageUrl.value"
            :text-results="inferenceHandler.textResults.value"
        />
      </el-col>

      <el-col :span="12" class="chart-col">
        <ChartGrid ref="chartGridRef" />
      </el-col>
    </el-row>

    <AppNotification :notification-state="notifications.notificationState" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElRow, ElCol, ElButton, ElSelect, ElOption } from 'element-plus';
import { CloseBold } from '@element-plus/icons-vue';

// Composables
import { useNotifications } from '../composables/useNotifications';
import { useImageHandler } from '../composables/useImageHandler';
import { useInference } from '../composables/useInference';

// Components
import AlgorithmSelector from './ImgProcess/algorithmSelector.vue';
import ActionButtons from './ImgProcess/actionButtons.vue'; // 保持 ActionButtons
import MainImageViewer from './ImgProcess/mainImageViewer.vue';
import MultiFrameSystem from './ImgProcess/multiFrameSystem.vue'; // 引入新组件
import ImageZoomSlider from './ImgProcess/imageZoomSlider.vue';
import ResultsDisplay from './ImgProcess/resultsDisplay.vue';
import ChartGrid from './ImgProcess/chartGrid.vue';
import AppNotification from './ImgProcess/appNotification.vue';

const router = useRouter();
const notifications = useNotifications();
const singleFrameImageHandler = useImageHandler(notifications.showNotification);
const inferenceHandler = useInference(notifications.showNotification);

const selectedMode = ref('singleFrame');
const selectedAlgorithmType = ref('');
const selectedSpecificAlgorithm = ref('');
const zoomLevel = ref(100);
const croppedImageUrl = ref(null);
const cropCoordinates = ref(null);

const singleFileInputRef = ref(null);
const folderInputRef = ref(null);

const mainViewerRef = ref(null);
const multiFrameSystemRef = ref(null);

const isInferenceLoading = computed(() => inferenceHandler.isLoading.value);
const chartGridRef = ref(null);
const isMultiFrameMode = computed(() => selectedMode.value === 'multiFrame');

// 用于识别的当前帧文件 (从 MultiFrameSystem 获取)
const currentMultiFrameFileForInference = ref(null);

const canInferInCurrentMode = computed(() => {
  if (isMultiFrameMode.value) {
    return !!(currentMultiFrameFileForInference.value && selectedSpecificAlgorithm.value);
  }
  return !!(singleFrameImageHandler.originalFile.value && selectedSpecificAlgorithm.value);
});

const handleModeChange = (newMode) => {
  notifications.showNotification(`模式已切换为: ${newMode === 'singleFrame' ? '单帧模式' : '多帧模式'}`);
  console.log('模式已切换为:', newMode);

  // 清理通用状态
  croppedImageUrl.value = null;
  cropCoordinates.value = null;
  if (inferenceHandler.resultImageUrl) inferenceHandler.resultImageUrl.value = null;
  if (inferenceHandler.textResults) inferenceHandler.textResults.value = [];

  // 清理特定模式的状态
  if (newMode === 'multiFrame') {
    singleFrameImageHandler.deleteImage(); // 清除单帧图像
  } else { // newMode === 'singleFrame'
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.clearFrames === 'function') {
      multiFrameSystemRef.value.clearFrames(); // 清除多帧图像列表
    }
    currentMultiFrameFileForInference.value = null;
  }
};

function triggerSingleFileInput() {
  singleFileInputRef.value?.click();
}
function triggerFolderInput() {
  folderInputRef.value?.click();
}

function receiveFileFromMainViewer(file) {
  if (file) {
    // 清理多帧模式下的状态，以防万一
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.clearFrames === 'function') {
      multiFrameSystemRef.value.clearFrames();
    }
    currentMultiFrameFileForInference.value = null;

    // 使用从 MainImageViewer 接收到的文件调用 handler
    singleFrameImageHandler.handleFileSelected(file);
  } else {
    notifications.showNotification('❌ 上传的文件无效。');
    console.error('Received undefined or null file from MainImageViewer via file-selected event.');
  }
}

function handleFolderSelected(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    // 清理单帧模式下的状态
    singleFrameImageHandler.deleteImage();
    // 加载文件夹
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.loadFolder === 'function') {
      multiFrameSystemRef.value.loadFolder(files);
    }
  }
  if (event.target) event.target.value = '';
}

function handleDeleteSingleFrameImage() {
  singleFrameImageHandler.deleteImage();
  croppedImageUrl.value = null;
  cropCoordinates.value = null;
}

function handleClearAllMultiFrames() {
  if (selectedMode.value === 'multiFrame' && multiFrameSystemRef.value) {
    multiFrameSystemRef.value.clearFrames(); // 调用 MultiFrameSystem 暴露的 clearFrames 方法
    // 这个方法内部会调用 useMultiFrameLoader.clearFrames()
    notifications.showNotification('所有图像已清除。');

    // 重置 ImgProcess 中与多帧显示和推断相关的状态
    currentMultiFrameFileForInference.value = null;
    croppedImageUrl.value = null;
    cropCoordinates.value = null; // 确保裁剪状态也被重置
    if (inferenceHandler.resultImageUrl) inferenceHandler.resultImageUrl.value = null;
    if (inferenceHandler.textResults) inferenceHandler.textResults.value = [];

    // 重置图表 (如果需要)
    if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
      chartGridRef.value.clearAllCharts();
    }
    console.log('[ImgProcess] All multi-frame files and related states cleared.');
  }
}

function onSingleFrameCropConfirmed({ croppedImageBase64, coordinates }) {
  croppedImageUrl.value = croppedImageBase64;
  cropCoordinates.value = coordinates;
  notifications.showNotification('✅ 单帧图像区域已截取');
}

function handleCurrentFrameForInference(file) {
  console.log('[ImgProcess] Current frame for inference updated:', file?.name);
  currentMultiFrameFileForInference.value = file;
}

async function handleInfer() {
  let fileToInfer = null;
  let md5ToInfer = '';
  let currentCropCoordinates = cropCoordinates.value; // 默认使用通用的裁剪坐标

  if (!selectedSpecificAlgorithm.value) {
    notifications.showNotification('请选择具体算法。', 2000);
    return;
  }

  if (isMultiFrameMode.value) {
    fileToInfer = currentMultiFrameFileForInference.value;
    if (!fileToInfer) {
      notifications.showNotification('多帧模式下，请确保已加载并选中一帧图像。', 2000);
      return;
    }
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.getCurrentFrameMD5 === 'function') {
      md5ToInfer = multiFrameSystemRef.value.getCurrentFrameMD5();
    }

    console.log(`[ImgProcess] Inferring on multi-frame: ${fileToInfer.name}, MD5: ${md5ToInfer}`);

  } else { // Single-frame mode
    fileToInfer = singleFrameImageHandler.originalFile.value;
    if (!fileToInfer) {
      notifications.showNotification('单帧模式下，请先上传图像。', 2000);
      return;
    }
    md5ToInfer = singleFrameImageHandler.fileMD5.value;
    console.log(`[ImgProcess] Inferring on single-frame: ${fileToInfer.name}, MD5: ${md5ToInfer}`);
  }

  const result = await inferenceHandler.performInference(
      fileToInfer,
      md5ToInfer,
      selectedSpecificAlgorithm.value,
      currentCropCoordinates // 使用当前上下文的裁剪坐标
  );

  if (result.success && result.newChartYValues) {
    if (chartGridRef.value && typeof chartGridRef.value.updateAllChartsWithBackendData === 'function') {
      chartGridRef.value.updateAllChartsWithBackendData(result.newChartYValues);
    }
  }
}

function logOut() { router.replace("/home"); }
function zoomIn() { zoomLevel.value = Math.min(300, zoomLevel.value + 10); }
function zoomOut() { zoomLevel.value = Math.max(20, zoomLevel.value - 10); }
function handleCustomAction3() { notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000); }

</script>

<style scoped>
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

.识别-button, .功能-button {
  background-color:rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.识别-button:hover, .功能-button:hover {
  background-color: rgb(53, 53, 53);
}
.识别-button:disabled, .功能-button:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

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
.menu-button-row {
  margin-bottom: 20px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-menu-buttons, .right-menu-buttons {
  display: flex;
  align-items: center;
}
.image-col, .chart-col {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
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
.custom-close-button:focus {
  outline: none;
}
.custom-close-button :deep(.el-icon) {
  font-size: 16px;
}
</style>