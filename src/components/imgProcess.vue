/*imgProcess.vue*/
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
            :disabled="isInferenceLoading || !canInferInCurrentMode">
          {{ isMultiFrameMode ? '识别多帧' : '识别单帧' }}
        </el-button>
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
      <el-col :span="12"> <el-row :gutter="12" align="middle">
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
      <el-col :span="12" v-if="isMultiFrameMode"> <div style="display: flex; align-items: center; justify-content: flex-start; height: 100%; padding-left: 0;">
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
        @change="handleFolderSelectedViaDialog"
    />

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
                          :featuresdata="allFeaturesData"
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
      </el-col>

      <el-col :span="12" class="chart-col">
        <ChartGird ref="chartGridRef" />
      </el-col>
    </el-row>

    <AppNotification :notification-state="notifications.notificationState" />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ElRow, ElCol, ElButton, ElSelect, ElOption, ElInput, ElInputNumber } from 'element-plus';
import { CloseBold } from '@element-plus/icons-vue';

// Composables
import { useNotifications } from '../composables/useNotifications';
import { useImageHandler } from '../composables/useImageHandler';
import { useInference } from '../composables/useInference';
import { useMultiFrameResult } from '../composables/useMultiFrameResult.js';

// Components
import AlgorithmSelector from './ImgProcess/algorithmSelector.vue';
import ActionButtons from './ImgProcess/actionButtons.vue';
import MainImageViewer from './ImgProcess/mainImageViewer.vue';
import MultiFrameSystem from './ImgProcess/multiFrameSystem.vue';
import ImageZoomSlider from './ImgProcess/imageZoomSlider.vue';
import ResultsDisplay from './ImgProcess/resultsDisplay.vue';
import ChartGird from './ImgProcess/chartGird.vue';
import AppNotification from './ImgProcess/appNotification.vue';
import ResultData from './ImgProcess/resultData.vue';


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

const manualFolderPath = ref('');
const originalFolderPath = ref('');
const resultFolderPathFromApi = ref('');
const resultFilesFromApi = ref(null);
const currentMultiFrameIndex = ref(-1);

const imageRows = ref(240);
const imageCols = ref(320);

const {
  interestImageUrl: multiFrameInterestUrl,
  outputImageUrl: multiFrameOutputUrl
} = useMultiFrameResult(resultFolderPathFromApi, resultFilesFromApi, currentMultiFrameIndex);

const singleFileInputRef = ref(null);
const folderInputRef = ref(null);

const mainViewerRef = ref(null);
const multiFrameSystemRef = ref(null);
const chartGridRef = ref(null);

const allFeaturesData = ref(null);
const defaultSingleFrameChartKey = "variance";

const isInferenceLoading = computed(() => inferenceHandler.isLoading.value);
const isMultiFrameMode = computed(() => selectedMode.value === 'multiFrame');

const canInferInCurrentMode = computed(() => {
  if (!selectedSpecificAlgorithm.value) return false;
  if (isMultiFrameMode.value) {
    return !!(originalFolderPath.value.trim() && selectedSpecificAlgorithm.value);
  }
  return !!(singleFrameImageHandler.originalFile.value && selectedSpecificAlgorithm.value);
});

const currentDisplayCroppedOrInterestImageUrl = computed(() => {
  return isMultiFrameMode.value ? multiFrameInterestUrl.value : croppedImageUrl.value;
});

const currentDisplayResultImageUrl = computed(() => {
  return isMultiFrameMode.value ? multiFrameOutputUrl.value : inferenceHandler.resultImageUrl.value;
});

const currentDisplayTextResults = computed(() => {
  return isMultiFrameMode.value ? [] : inferenceHandler.textResults.value;
});

const numberOfResultFrames = computed(() => { //
  if (resultFilesFromApi.value && Array.isArray(resultFilesFromApi.value.outputImageNames)) {
    return resultFilesFromApi.value.outputImageNames.length;
  }
  return 0;
});

const handleModeChange = (newMode) => {
  notifications.showNotification(`模式已切换为: ${newMode === 'singleFrame' ? '单帧模式' : '多帧模式'}`);
  croppedImageUrl.value = null;
  cropCoordinates.value = null;
  if (inferenceHandler.resultImageUrl) inferenceHandler.resultImageUrl.value = null;
  if (inferenceHandler.textResults) inferenceHandler.textResults.value = [];

  manualFolderPath.value = '';
  originalFolderPath.value = '';
  resultFolderPathFromApi.value = '';
  resultFilesFromApi.value = null;
  currentMultiFrameIndex.value = -1;

  if (newMode === 'multiFrame') {
    singleFrameImageHandler.deleteImage();
  } else {
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.clearPreviewFrames === 'function') {
      multiFrameSystemRef.value.clearPreviewFrames();
    }
  }
};

function handleSingleFileSelected(event) {
  const file = event.target.files?.[0];
  if (file) {
    receiveFileFromMainViewer(file);
  }
  if (event.target) event.target.value = '';
}

function triggerFolderDialogForPathHint() {
  notifications.showNotification('请使用弹出的对话框选择文件夹，其路径将作为提示填入“识别路径”输入框。', 4000);
  folderInputRef.value?.click();
}

function handleFolderSelectedViaDialog(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    originalFolderPath.value = '';
    resultFolderPathFromApi.value = '';
    resultFilesFromApi.value = null;
    currentMultiFrameIndex.value = -1;

    let detectedPathForHint = "";
    if (files[0] && files[0].path) {
      const firstFilePath = files[0].path;
      const separator = firstFilePath.includes('/') ? '/' : '\\';
      detectedPathForHint = firstFilePath.substring(0, firstFilePath.lastIndexOf(separator));
    }

    if (detectedPathForHint) {
      manualFolderPath.value = detectedPathForHint;
      notifications.showNotification(`路径提示已填充: ${detectedPathForHint}。请检查并点击“确认目录”以用于识别。`, 3500);
    } else {
      notifications.showNotification('⚠️ 未能自动填充路径提示，请手动在“识别路径”输入框中输入文件夹绝对路径。', 4000);
    }

    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.loadFolder === 'function') {
      if (imageRows.value > 0 && imageCols.value > 0) {
        multiFrameSystemRef.value.loadFolder(files);
      } else {
        notifications.showNotification('❌ 请先设置有效的图像行数和列数才能加载文件夹预览。', 2000);
      }
    }
  }
  if (event.target) event.target.value = '';
}

function confirmManualFolderPath() {
  const pathInput = manualFolderPath.value.trim();
  if (!pathInput) {
    notifications.showNotification('请输入有效的文件夹绝对路径才能确认。', 2000);
    originalFolderPath.value = '';
    return;
  }
  if (!isMultiFrameMode.value) {
    notifications.showNotification('此功能仅在多帧模式下可用。', 2000);
    return;
  }
  originalFolderPath.value = pathInput;
  notifications.showNotification(`识别路径已确认为: ${originalFolderPath.value}。点击“识别多帧”开始处理。`, 3000);
}

function receiveFileFromMainViewer(file) {
  if (file) {
    if (multiFrameSystemRef.value && typeof multiFrameSystemRef.value.clearPreviewFrames === 'function') {
      multiFrameSystemRef.value.clearPreviewFrames();
    }
    manualFolderPath.value = '';
    originalFolderPath.value = '';
    resultFolderPathFromApi.value = '';
    resultFilesFromApi.value = null;
    currentMultiFrameIndex.value = -1;

    if (imageRows.value > 0 && imageCols.value > 0) {
      singleFrameImageHandler.handleFileSelected(file, imageRows.value, imageCols.value);
    } else {
      notifications.showNotification('❌ 请先设置有效的图像行数和列数。', 2000);
    }
  } else {
    notifications.showNotification('❌ 上传的文件无效。');
  }
}

function handleDeleteSingleFrameImage() {
  singleFrameImageHandler.deleteImage();
  croppedImageUrl.value = null;
  cropCoordinates.value = null;
  if (inferenceHandler.resultImageUrl) inferenceHandler.resultImageUrl.value = null;
  if (inferenceHandler.textResults) inferenceHandler.textResults.value = [];
}

function handleClearAllMultiFrames() {
  notifications.showNotification('多帧状态及结果已清除。');
  manualFolderPath.value = '';
  originalFolderPath.value = '';
  resultFolderPathFromApi.value = '';
  resultFilesFromApi.value = null;
  currentMultiFrameIndex.value = -1;
  allFeaturesData.value = null; // 清理图表数据
  if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
    chartGridRef.value.clearAllCharts(); // 清空图表
  }
}

function onSingleFrameCropConfirmed({ croppedImageBase64, coordinates }) {
  croppedImageUrl.value = croppedImageBase64;
  cropCoordinates.value = coordinates;
  notifications.showNotification('✅ 单帧图像区域已截取');
}

async function handleGenerateCurves() {
  if (!isMultiFrameMode.value) {
    notifications.showNotification('此功能仅在多帧模式下可用。', 2000);
    return;
  }
  if (isInferenceLoading.value) { // 检查是否正在进行其他识别操作
    notifications.showNotification('正在进行识别，请稍后再试。', 2000);
    return;
  }
  if (resultFolderPathFromApi.value && resultFolderPathFromApi.value.trim() !== '') {
    notifications.showNotification('正在重新获取曲线数据...', 1500);
    await fetchFeatureDataForCharts(resultFolderPathFromApi.value);
  } else {
    notifications.showNotification('请先完成所有图像的识别', 3000);
  }
}

async function fetchFeatureDataForCharts(currentResultPath) {
  console.log("【前端DEBUG】fetchFeatureDataForCharts 被调用，currentResultPath:", currentResultPath);
  if (!currentResultPath || typeof currentResultPath !== 'string' || currentResultPath.trim() === '') {
    notifications.showNotification('❌ [前端错误] resultPath 为空或无效，无法请求特征数据。');
    console.error("【前端DEBUG】错误：resultPath 为空或无效:", currentResultPath);
    return;
  }
  if (!currentResultPath) {
    allFeaturesData.value = null;
    if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
      chartGridRef.value.clearAllCharts();
    }
    console.log('resultPath 为空，不获取特征数据。');
    return;
  }
  console.log(`准备从路径 "${currentResultPath}" 获取特征数据...`);
  try {
    const response = await axios.get('get_feature_data', {
      params: { resultPath: currentResultPath }
    });
    if (response.data && response.data.success && response.data.features) {
      allFeaturesData.value = response.data.features;
      notifications.showNotification("图表特征数据加载成功！", 2000);
      if (chartGridRef.value && typeof chartGridRef.value.updateAllChartsWithFeatureData === 'function') {
        chartGridRef.value.updateAllChartsWithFeatureData(allFeaturesData.value);
      } else {
        console.warn("ChartGrid ref 或 updateAllChartsWithFeatureData 方法未找到。");
      }
    } else {
      allFeaturesData.value = null;
      if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
        chartGridRef.value.clearAllCharts();
      }
      const errorMsg = response.data && response.data.message ? response.data.message : "未能加载图表特征数据或数据为空。";
      notifications.showNotification(`⚠️ ${errorMsg}`, 2500);
      console.warn('获取特征数据响应无效:', response.data);
    }
  } catch (error) {
    allFeaturesData.value = null;
    if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
      chartGridRef.value.clearAllCharts();
    }
    console.error("请求图表特征数据时出错:", error);
    let errorMsg = "请求图表特征数据时发生网络或服务器错误。";
    if (error.response && error.response.data && error.response.data.message) {
      errorMsg = error.response.data.message;
    } else if (error.message) {
      errorMsg = error.message;
    }
    notifications.showNotification(`❌ ${errorMsg}`, 3000);
  }
}

// async function handleInfer() {
//   if (!selectedSpecificAlgorithm.value) {
//     notifications.showNotification('请选择具体算法。', 2000);
//     return;
//   }
//   if (imageRows.value <= 0 || imageCols.value <= 0) {
//     notifications.showNotification('❌ 请设置有效的图像行数和列数才能进行识别。', 2000);
//     return;
//   }
//
//   if (chartGridRef.value && typeof chartGridRef.value.updateAllChartsWithBackendData === 'function') {
//     chartGridRef.value.updateAllChartsWithBackendData([]);
//   }
//
//   if (isMultiFrameMode.value) {
//     if (!originalFolderPath.value.trim()) {
//       notifications.showNotification('多帧模式下，请先在“识别路径”输入框中输入文件夹绝对路径并点击“确认目录”按钮。', 4000);
//       return;
//     }
//     resultFolderPathFromApi.value = '';
//     resultFilesFromApi.value = null;
//     currentMultiFrameIndex.value = -1; // 重置索引，以防上次结果影响判断
//
//     const result = await inferenceHandler.performFolderPathInference(
//         originalFolderPath.value,
//         selectedSpecificAlgorithm.value
//     );
//
//     console.log('后端 /infer_folder_path 完整响应 (result):', JSON.parse(JSON.stringify(result)));
//     if (result && result.data) {
//       console.log('后端 result.data 内容:', JSON.parse(JSON.stringify(result.data)));
//     }
//
//     if (result && result.success && result.data) {
//       resultFolderPathFromApi.value = result.data.resultPath || '';
//
//       if (result.data.resultFiles &&
//           typeof result.data.resultFiles === 'object' &&
//           Array.isArray(result.data.resultFiles.outputImageNames)) {
//
//         resultFilesFromApi.value = { // 直接使用后端返回的结构化数据
//           outputImageNames: result.data.resultFiles.outputImageNames,
//           interestImageNames: Array.isArray(result.data.resultFiles.interestImageNames) ? result.data.resultFiles.interestImageNames : [],
//           originalNames: Array.isArray(result.data.resultFiles.originalNames) ? result.data.resultFiles.originalNames : []
//         };
//       } else {
//         resultFilesFromApi.value = null; // 确保在数据无效时清空
//         notifications.showNotification('⚠️ 后端响应的 result.data.resultFiles 结构不符合预期或缺少 outputImageNames 数组。', 3000);
//       }
//
//       if (resultFilesFromApi.value && resultFilesFromApi.value.outputImageNames.length > 0) {
//         currentMultiFrameIndex.value = 0;
//       } else {
//         currentMultiFrameIndex.value = -1;
//         if(result.data.resultFiles) { // 如果 resultFiles 对象存在但 outputImageNames 为空或无效
//           notifications.showNotification('识别完成，但未返回有效的结果文件列表。', 2500);
//         }
//       }
//
//       const message = result.data.message || `结果信息已接收。`;
//       notifications.showNotification(message, 3500);
//
//
//     } else {
//       resultFolderPathFromApi.value = '';
//       resultFilesFromApi.value = null;
//       currentMultiFrameIndex.value = -1;
//       const errorMessage = (result && result.data && result.data.message) ? result.data.message : (result && result.error ? result.error : "识别请求失败或后端未返回有效数据。");
//       notifications.showNotification(`❌ ${errorMessage}`, 3000);
//     }
//   } else { // 单帧模式
//     const fileToInfer = singleFrameImageHandler.originalFile.value;
//     if (!fileToInfer) {
//       notifications.showNotification('单帧模式下，请先上传图像。', 2000);
//       return;
//     }
//     const md5ToInfer = singleFrameImageHandler.fileMD5.value;
//
//     const result = await inferenceHandler.performInference(
//         fileToInfer,
//         md5ToInfer,
//         selectedSpecificAlgorithm.value,
//         imageRows.value,
//         imageCols.value,
//         cropCoordinates.value
//     );
//
//     if (result.success && result.newChartValues) {
//       if (chartGridRef.value && typeof chartGridRef.value.updateAllChartsWithBackendData === 'function') {
//         chartGridRef.value.updateAllChartsWithBackendData(result.newChartValues);
//       }
//     }
//   }
// }

async function handleInfer() {
  if (!selectedSpecificAlgorithm.value) {
    notifications.showNotification('请选择具体算法。', 2000);
    return;
  }
  if (imageRows.value <= 0 || imageCols.value <= 0) {
    notifications.showNotification('❌ 请设置有效的图像行数和列数才能进行识别。', 2000);
    return;
  }

  allFeaturesData.value = null;
  if (chartGridRef.value && typeof chartGridRef.value.clearAllCharts === 'function') {
    chartGridRef.value.clearAllCharts();
  } else {
    console.warn("handleInfer: ChartGrid ref 或 clearAllCharts 方法未找到。");
  }

  if (isMultiFrameMode.value) {
    if (!originalFolderPath.value.trim()) {
      notifications.showNotification('多帧模式下，请先在“识别路径”输入框中输入文件夹绝对路径并点击“确认目录”按钮。', 4000);
      return;
    }
    resultFolderPathFromApi.value = '';
    resultFilesFromApi.value = null;
    currentMultiFrameIndex.value = -1;

    const result = await inferenceHandler.performFolderPathInference(
        originalFolderPath.value,
        selectedSpecificAlgorithm.value
    );

    if (result && result.success && result.data) {
      resultFolderPathFromApi.value = result.data.resultPath || '';

      if (result.data.resultFiles &&
          typeof result.data.resultFiles === 'object' &&
          Array.isArray(result.data.resultFiles.outputImageNames)) {

        resultFilesFromApi.value = {
          outputImageNames: result.data.resultFiles.outputImageNames,
          interestImageNames: Array.isArray(result.data.resultFiles.interestImageNames) ? result.data.resultFiles.interestImageNames : [],
          originalNames: Array.isArray(result.data.resultFiles.originalNames) ? result.data.resultFiles.originalNames : []
        };
      } else {
        resultFilesFromApi.value = null;
        notifications.showNotification('⚠️ 后端响应的 result.data.resultFiles 结构不符合预期或缺少 outputImageNames 数组。', 3000);
      }

      if (resultFilesFromApi.value && resultFilesFromApi.value.outputImageNames.length > 0) {
        currentMultiFrameIndex.value = 0;
        if (resultFolderPathFromApi.value) {
          await fetchFeatureDataForCharts(resultFolderPathFromApi.value);
        } else {
          notifications.showNotification('⚠️ 未能获取结果文件夹路径，无法加载图表数据。', 2500);
        }
      } else {
        currentMultiFrameIndex.value = -1;
        if(result.data.resultFiles && (!resultFilesFromApi.value || resultFilesFromApi.value.outputImageNames.length === 0) ) {
          notifications.showNotification('识别完成，但未返回有效的结果文件列表。图表无法加载。', 2500);
        }
      }
      const message = result.data.message || `结果信息已接收。`;
      notifications.showNotification(message, 3500);

    } else {
      resultFolderPathFromApi.value = '';
      resultFilesFromApi.value = null;
      currentMultiFrameIndex.value = -1;
      const errorMessage = (result && result.data && result.data.message) ? result.data.message : (result && result.error ? result.error : "识别请求失败或后端未返回有效数据。");
      notifications.showNotification(`❌ ${errorMessage}`, 3000);
    }
  } else { // 单帧模式
    const fileToInfer = singleFrameImageHandler.originalFile.value;
    if (!fileToInfer) {
      notifications.showNotification('单帧模式下，请先上传图像。', 2000);
      return;
    }
    const md5ToInfer = singleFrameImageHandler.fileMD5.value;

    const result = await inferenceHandler.performInference(
        fileToInfer,
        md5ToInfer,
        selectedSpecificAlgorithm.value,
        imageRows.value,
        imageCols.value,
        cropCoordinates.value
    );

    if (result.success && result.newChartValues && Array.isArray(result.newChartValues)) {
      if (chartGridRef.value && typeof chartGridRef.value.updateAllChartsWithFeatureData === 'function') {
        const singleFeatureMap = {
          [defaultSingleFrameChartKey]: result.newChartValues
        };
        chartGridRef.value.updateAllChartsWithFeatureData(singleFeatureMap);
      } else {
        console.warn("[imgProcess.vue] 单帧模式：ChartGrid ref 或 updateAllChartsWithFeatureData 方法未找到。");
      }
    } else if (result.success && !result.newChartValues) {
      notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
    }
  }
}

function logOut() { router.replace("/home"); }
function zoomIn() { zoomLevel.value = Math.min(300, zoomLevel.value + 10); }
function zoomOut() { zoomLevel.value = Math.max(20, zoomLevel.value - 10); }
function handleCustomAction3() { notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000); }

// watch(currentMultiFrameIndex, (newResultIndex) => {
//   if (isMultiFrameMode.value && newResultIndex >= 0 && multiFrameSystemRef.value) {
//     if (typeof multiFrameSystemRef.value.previewLoader?.loadFrame === 'function' &&
//         newResultIndex < (multiFrameSystemRef.value.previewLoader?.totalFrames?.value || 0)) {
//     }
//   }
// });
watch(currentMultiFrameIndex, (newResultIndex) => {
  if (isMultiFrameMode.value && newResultIndex >= 0 && multiFrameSystemRef.value) {
    if (typeof multiFrameSystemRef.value.syncPreviewFrame === 'function') {
      console.log(`[imgProcess.vue] Watcher: 请求 MultiFrameSystem 将预览同步到索引 ${newResultIndex}`);
      multiFrameSystemRef.value.syncPreviewFrame(newResultIndex);
    } else {
      // 如果方法不存在，这可能表示组件尚未完全准备好或 defineExpose 中有遗漏。
      console.warn('[imgProcess.vue] Watcher: multiFrameSystemRef.value.syncPreviewFrame 不是一个函数。无法同步预览帧。');
    }
  }
});

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