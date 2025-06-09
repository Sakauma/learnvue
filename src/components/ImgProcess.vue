/*ImgProcess.vue*/
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
<!--        <AlgorithmSelector-->
<!--            :algorithm-type="selectedAlgorithmType"-->
<!--            :specific-algorithm="selectedSpecificAlgorithm"-->
<!--            @update:algorithmType="store.setAlgorithmType($event)"-->
<!--            @update:specificAlgorithm="store.setSpecificAlgorithm($event)"-->
<!--        />-->
        <el-button
            class="inference-button"
            @click="handleInfer"
            :disabled="isInferenceLoading || !canInferInCurrentMode">
          {{ isMultiFrameMode ? '识别多帧' : '识别单帧' }}
        </el-button>
<!--        <el-button-->
<!--            class="inference-button"-->
<!--            @click="handleInferClick"-->
<!--            :disabled="isInferenceLoading || !canInferInCurrentMode">-->
<!--          {{ isMultiFrameMode ? '识别多帧' : '识别单帧' }}-->
<!--        </el-button>-->
      </el-col>
      <el-col :span="12" class="right-menu-buttons">
        <ActionButtons
            :is-loading="isInferenceLoading"
            :can-infer="false"
            @custom-action-3="handleCustomAction3"
        />
      </el-col>
    </el-row>

    <el-row :gutter="10" class="additional-inputs-row image-params-row" align="middle">
      <el-col :span="12">
        <el-row :gutter="12" align="middle">
          <el-col :span="12">
            <div class="param-input-group">
              <span class="param-label">图像行数 (Rows):</span>
              <el-input-number v-model="imageRows" :min="1" controls-position="right" class="param-input-number" placeholder="行数"></el-input-number>
<!--              <el-input-number-->
<!--                  :model-value="imageRows"-->
<!--                  @update:model-value="store.setImageRows($event)"-->
<!--                  :min="1" controls-position="right" class="param-input-number" placeholder="行数"></el-input-number>-->
            </div>
          </el-col>
          <el-col :span="12">
            <div class="param-input-group">
              <span class="param-label">图像列数 (Cols):</span>
              <el-input-number v-model="imageCols" :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>
<!--              <el-input-number-->
<!--                  :model-value="imageCols"-->
<!--                  @update:model-value="store.setImageCols($event)"-->
<!--                  :min="1" controls-position="right" class="param-input-number" placeholder="列数"></el-input-number>-->
            </div>
          </el-col>
        </el-row>
      </el-col>

      <el-col :span="6">
        <div class="param-input-group">
          <span class="param-label">数据精度:</span>
          <el-select v-model="selectedPrecision" class="param-input-select">
<!--          <el-select-->
<!--              :model-value="selectedPrecision"-->
<!--              @update:model-value="store.setPrecision($event)"-->
<!--              class="param-input-select">-->
            <el-option label="64位浮点" value="float64" />
            <el-option label="32位浮点" value="float32" />
            <el-option label="16位整型" value="uint16" />
            <el-option label="8位整型" value="uint8" />
          </el-select>
        </div>
      </el-col>

      <el-col :span="12" v-if="isMultiFrameMode">
        <div style="display: flex; align-items: center; justify-content: flex-start; height: 100%; padding-left: 0;">
          <el-button
              class="generate-curves-button"
              @click="handleGenerateCurves"
              :disabled="isInferenceLoading"
              style="margin-left: 10px;"
          >生成曲线
          </el-button>
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

    <input type="file" ref="singleFileInputRef" style="display: none" @change="handleSingleFileSelected" accept="image/*,.dat,.tif,.tiff,.bmp,.gif,.jpeg,.jpg,.png" />
    <input type="file" ref="folderInputRef" style="display: none" webkitdirectory directory multiple @change="handleFolderSelectedViaDialog" />

    <el-row :gutter="20" class="main-content-row">

      <el-col :span="12" class="image-col">
        <MainImageViewer v-if="!isMultiFrameMode"
                         class="viewer-component"
                         :image-url="singleFrameImageHandler.imageUrl.value"
                         :image-name-to-display="singleFrameImageHandler.imageName.value"
                         :zoom-level="zoomLevel"
                         @file-selected="receiveFileFromMainViewer"
                         @delete-image="handleDeleteSingleFrameImage"
                         @zoom-in="zoomIn" @zoom-out="zoomOut"
                         @crop-confirmed="onSingleFrameCropConfirmed"
                         ref="mainViewerRef"
        />
        <MultiFrameSystem v-else-if="isMultiFrameMode"
                          class="viewer-component"
                          :zoom-level="zoomLevel"
                          :image-rows="imageRows"
                          :image-cols="imageCols"
                          @request-folder-select="triggerFolderDialogForPathHint"
                          @zoom-in="zoomIn" @zoom-out="zoomOut"
                          @delete-all-frames="handleClearAllMultiFrames"
                          ref="multiFrameSystemRef"
                          :actualResultFrameCount="numberOfResultFrames"
                          v-model:currentResultFrameIndex="currentMultiFrameIndex"
        />

        <ImageZoomSlider v-model="zoomLevel" />
        <ResultsDisplay
            :cropped-image-url="currentDisplayCroppedOrInterestImageUrl"
            :result-image-url="currentDisplayResultImageUrl"
            :text-results="currentDisplayTextResults"
        />
        <BackendLogs
            :logs="parsedLogs"
            :connectionStatus="connectionStatus"
            :connectionAttempts="connectionAttempts"
            @toggle-connection="toggleSseConnection"
            @clear-logs="clearAllLogsAndReports"
        />
      </el-col>
      <el-col :span="12" class="chart-col">
<!--        <ChartGrid ref="chartGridRef" />-->
        <ChartGrid ref="chartGridRef" :feature-data="allFeaturesData" />
        <ResultData
            :idx="currentMultiFrameIndex"
            :dataMode="isResultsModeActive"
            :dataValue="allFeaturesData"
        />
        <AlgorithmReport
            ref="reportRef"
            :logs="parsedLogs"
        />
      </el-col>
    </el-row>

    <AppNotification :notification-state="notifications.notificationState" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';
import { CloseBold } from '@element-plus/icons-vue';
import { useProcessStore } from '../store/processStore.js';
import { storeToRefs } from 'pinia';

// composable
import { useNotifications } from '../composables/useNotifications.js';
import { useImageHandler } from '../composables/useImageHandler.js';
import { useInference } from '../composables/useInference.js';
import { useMultiFrameResult } from '../composables/useMultiFrameResult.js';
import { useSseLogs } from '../composables/useSseLogs.js';
import { useZoom } from "../composables/useZoom.js";
// component
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


const router = useRouter();
const notifications = useNotifications();
const store = useProcessStore();

// 1. Store 只负责最核心的模式切换
const { selectedMode, isMultiFrameMode } = storeToRefs(store);

// 2. 所有状态和业务逻辑的控制权，暂时回归到组件，以确保稳定性
const { zoomLevel, zoomIn, zoomOut } = useZoom();
const singleFrameImageHandler = useImageHandler(notifications.showNotification);
const inferenceHandler = useInference(notifications.showNotification);

const selectedAlgorithmType = ref('');
const selectedSpecificAlgorithm = ref('');
const imageRows = ref(240);
const imageCols = ref(320);
const selectedPrecision = ref('float64');
const cropCoordinates = ref(null);
const manualFolderPath = ref('');
const originalFolderPath = ref('');
const resultFolderPathFromApi = ref('');
const resultFilesFromApi = ref(null);
const currentMultiFrameIndex = ref(-1);
// const allFeaturesData = ref(null);
const allFeaturesData = ref({});
const defaultSingleFrameChartKey = "variance";

const {logs: parsedLogs, connectionStatus, connectionAttempts, connect, disconnect, clearLogs} = useSseLogs('/sse/logs');
const reportRef = ref(null);
const { interestImageUrl: multiFrameInterestUrl, outputImageUrl: multiFrameOutputUrl } = useMultiFrameResult(resultFolderPathFromApi, resultFilesFromApi, currentMultiFrameIndex);
const folderInputRef = ref(null);
const chartGridRef = ref(null);
const multiFrameSystemRef = ref(null);

// 3. 计算属性恢复原状
const isInferenceLoading = computed(() => inferenceHandler.isLoading.value);
const canInferInCurrentMode = computed(() => {
  if (!selectedSpecificAlgorithm.value) return false;
  if (isMultiFrameMode.value) {
    return !!(originalFolderPath.value.trim() && selectedSpecificAlgorithm.value);
  }
  return !!(singleFrameImageHandler.originalFile.value && selectedSpecificAlgorithm.value);
});
const currentDisplayCroppedOrInterestImageUrl = computed(() => isMultiFrameMode.value ? multiFrameInterestUrl.value : singleFrameImageHandler.imageUrl.value);
const currentDisplayResultImageUrl = computed(() => isMultiFrameMode.value ? multiFrameOutputUrl.value : inferenceHandler.resultImageUrl.value);
const currentDisplayTextResults = computed(() => isMultiFrameMode.value ? [] : inferenceHandler.textResults.value);
const numberOfResultFrames = computed(() => resultFilesFromApi.value?.outputImageNames?.length || 0);
const isResultsModeActive = computed(() => numberOfResultFrames.value > 0);

/**
 * 4. 修复：handleModeChange 负责模式切换和状态清理
 */
const handleModeChange = (newMode) => {
  if (selectedMode.value === newMode) return;

  notifications.showNotification(`模式已切换为: ${newMode === 'singleFrame' ? '单帧模式' : '多帧模式'}`);
  store.setMode(newMode);

  // --- Bug修复：统一和精简状态清理逻辑 ---
  // 清理单帧相关状态
  singleFrameImageHandler.deleteImage();
  inferenceHandler.resultImageUrl.value = null;
  inferenceHandler.textResults.value = [];
  cropCoordinates.value = null;

  // 清理多帧相关状态
  manualFolderPath.value = '';
  originalFolderPath.value = '';
  resultFolderPathFromApi.value = '';
  resultFilesFromApi.value = null;
  currentMultiFrameIndex.value = -1;
  if (multiFrameSystemRef.value?.clearPreviewFrames) {
    multiFrameSystemRef.value.clearPreviewFrames();
  }

  // 清理共享的结果状态（图表和表格）
  allFeaturesData.value = null;
};

/**
 * 5. 修复：上传单帧文件的逻辑
 */
const receiveFileFromMainViewer = (file) => {
  if (!file) return;
  handleModeChange('singleFrame'); // 保证切换到单帧模式并清空状态
  singleFrameImageHandler.handleFileSelected(file, imageRows.value, imageCols.value, selectedPrecision.value);
};

/**
 * 6. 修复：上传多帧文件夹的逻辑
 */
const handleFolderSelectedViaDialog = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  handleModeChange('multiFrame'); // 保证切换到多帧模式并清空状态

  let detectedPathForHint = "";
  if (files[0].path) {
    const firstFilePath = files[0].path;
    const separator = firstFilePath.includes('/') ? '/' : '\\';
    detectedPathForHint = firstFilePath.substring(0, firstFilePath.lastIndexOf(separator));
  }
  if (detectedPathForHint) {
    manualFolderPath.value = detectedPathForHint;
    notifications.showNotification(`路径提示已填充: ${detectedPathForHint}。`, 3500);
  }
  if (multiFrameSystemRef.value?.loadFolder) {
    multiFrameSystemRef.value.loadFolder(files, selectedPrecision.value);
  }
  if(event.target) event.target.value = '';
};


// 7. 恢复所有其他业务流程函数到组件内部
async function handleInfer() {
  if (!canInferInCurrentMode.value) {
    notifications.showNotification('请先提供必要的输入（文件或路径）并选择算法。');
    return;
  }
  if (imageRows.value <= 0 || imageCols.value <= 0) {
    notifications.showNotification('❌ 请设置有效的图像行数和列数。', 2000);
    return;
  }
  allFeaturesData.value = null;
  //if (chartGridRef.value) chartGridRef.value.clearAllCharts();

  if (isMultiFrameMode.value) {
    const result = await inferenceHandler.performFolderPathInference(originalFolderPath.value, selectedSpecificAlgorithm.value);
    if (result?.success && result.data) {
      resultFolderPathFromApi.value = result.data.resultPath || '';
      resultFilesFromApi.value = result.data.resultFiles || null;
      if (numberOfResultFrames.value > 0) {
        currentMultiFrameIndex.value = 0;
        await fetchFeatureDataForCharts(resultFolderPathFromApi.value);
      }
      notifications.showNotification(result.data.message || `多帧识别任务已发送。`, 3500);
    }
  } else {
    const result = await inferenceHandler.performInference(
        singleFrameImageHandler.originalFile.value,
        singleFrameImageHandler.fileMD5.value,
        selectedSpecificAlgorithm.value,
        imageRows.value,
        imageCols.value,
        cropCoordinates.value
    );
    if (result.success && result.newChartValues?.length > 0) {
      allFeaturesData.value = { [defaultSingleFrameChartKey]: result.newChartValues };
    } else if (result.success) {
      notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
    }
  }
}

async function fetchFeatureDataForCharts(currentResultPath) {
  if (!currentResultPath) return;
  try {
    const response = await axios.get('get_feature_data', { params: { resultPath: currentResultPath } });
    if (response.data?.success && response.data.features) {
      allFeaturesData.value = response.data.features;
      notifications.showNotification("图表特征数据加载成功！", 2000);
    } else {
      notifications.showNotification(`⚠️ ${response.data?.message || "未能加载图表特征数据。"}`, 2500);
    }
  } catch (error) {
    notifications.showNotification(`❌ 请求图表特征数据失败: ${error.response?.data?.message || error.message}`, 3000);
  }
}
const onSingleFrameCropConfirmed = ({ croppedImageBase64, coordinates }) => {
  singleFrameImageHandler.imageUrl.value = croppedImageBase64;
  cropCoordinates.value = coordinates;
  notifications.showNotification('✅ 感兴趣区域已截取');
};
const confirmManualFolderPath = () => {
  originalFolderPath.value = manualFolderPath.value.trim();
  notifications.showNotification(`识别路径已确认为: ${originalFolderPath.value}。`);
};
const handleDeleteSingleFrameImage = () => singleFrameImageHandler.deleteImage();
const handleClearAllMultiFrames = () => handleModeChange('multiFrame');
const logOut = () => router.replace("/home");
const handleCustomAction3 = () => notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000);
const triggerFolderDialogForPathHint = () => folderInputRef.value?.click();
const toggleSseConnection = () => (['connecting', 'connected'].includes(connectionStatus.value)) ? disconnect() : connect();
const clearAllLogsAndReports = () => {
  clearLogs();
  notifications.showNotification('日志已清空');
};
watch(currentMultiFrameIndex, (newResultIndex) => {
  if (isMultiFrameMode.value && newResultIndex >= 0 && multiFrameSystemRef.value) {
    multiFrameSystemRef.value.syncPreviewFrame(newResultIndex);
  }
});
onMounted(connect);
onUnmounted(disconnect);
</script>

<style scoped>
.additional-inputs-row {
  margin-bottom: 15px;
}
.image-params-row {
  margin-top: 15px;
  max-width: 800px;
}

.param-input-group {
  display: flex;
  align-items: center;
  width: 105%;
}

.param-label {
  margin-right: 8px;
  color: white;
  font-size: 14px;
  white-space: nowrap;
  text-align: right;
}

.param-input-number {
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

.inference-button{
  background-color:rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  margin-left: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.inference-button:hover{
  background-color: rgb(53, 53, 53);
}
.inference-button:disabled{
  background-color: #a0cfff;
  cursor: not-allowed;
}

.generate-curves-button {
  background-color: rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 15px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.generate-curves-button:hover {
  background-color: rgb(53, 53, 53);
}

.generate-curves-button:disabled {
  background-color: #a0cfff;
  color: #8c8c8c;
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
  margin-bottom: 15px;
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