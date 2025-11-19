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
        @show-map="isMapVisible = true"
        :auto-mode-connection-status="autoModeConnectionStatus"
        @toggle-auto-mode-connection="toggleAutoModeConnection"
    />
    <WorldMapDialog
        v-model:visible="isMapVisible"
        :marker-data="mapMarkerData"
        :latest-task-id="latestTaskId"
    />
    <input type="file" ref="folderInputRef" style="display: none" @change="handleFolderSelectedViaDialog"/>

    <div v-if="hasResults" class="task-info-bar">
<!--      <div class="info-item">-->
<!--        <span class="label">结果类型</span>-->
<!--        <span class="value result-highlight">{{ resultTypeLabel }}</span>-->
<!--      </div>-->
      <div class="info-item">
        <span class="label">结果类型</span>
        <el-select
            v-model="currentResultType"
            size="small"
            class="result-type-select"
            @change="onResultTypeChange"
        >
          <el-option
              v-for="(label, value) in typeNameMap"
              :key="value"
              :label="label"
              :value="Number(value)"
          />
        </el-select>
      </div>

      <div class="separator"></div>
      <div class="info-item">
        <span class="label">相机类型</span>
        <span class="value">{{ cameraTypeLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">波段类型</span>
        <span class="value">{{ waveBandLabel }}</span>
      </div>
      <div class="separator"></div>
      <div class="info-item">
        <span class="label">处理模式</span>
        <span class="value">{{ modeLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">卫星型号</span>
        <span class="value">{{ satelliteLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">虚警源ID</span>
        <span class="value highlight">{{ latestTaskId || 'N/A' }}</span>
      </div>

      <div class="separator"></div>
      <div class="info-item">
        <span class="label">分析时间段</span>
        <span class="value time-value">{{ timeRangeLabel }}</span>
      </div>
      <div class="info-item">
        <span class="label">当前帧号</span>
        <span class="value">{{ currentFrameLabel }}</span>
      </div>
    </div>

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
                :is-manual-mode="isManualMode"
                :auto-mode-connection-status="autoModeConnectionStatus"
            />
          </div>
          <div v-if="hasResults" class="image-display-box split-view">
            <ImageViewerCard :image-url="multiFrameResultImage" label="结果图像" class="additional-viewer-card" />
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
        <ResultData :idx="currentMultiFrameIndex" :data-mode="allFeaturesData && Object.keys(allFeaturesData).length > 0" :data-value="allFeaturesData" />
        <DataProductActions :can-perform-action="canGenerateFullProduct" @download="downloadFullProduct" @transmit="transmitFullProduct" />
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
import { ref, computed, watch } from 'vue';
import { ElButton, ElSelect, ElOption, ElMessageBox } from 'element-plus';
import { CloseBold,Setting } from '@element-plus/icons-vue';

// 导入布局组件
import ControlPanel from './layouts/ControlPanel.vue';
import UploadProgressPopup from './utils/UploadProgressPopup.vue';

// 导入所有需要的 UI 子组件
import MultiFrameSystem from './imgProcess/MultiFrameSystem.vue';
import ImageZoomSlider from './imgProcess/ImageZoomSlider.vue';
import ImageViewerCard from './imgProcess/ImageViewerCard.vue';
import ChartGrid from './imgProcess/ChartGrid.vue';
import AppNotification from './imgProcess/AppNotification.vue';
import ResultData from './imgProcess/ResultData.vue';
import BackendLogs from './imgProcess/BackendLogs.vue';
import AlgorithmReport from './imgProcess/AlgorithmReport.vue';
import VersionDialog from './utils/VersionDialog.vue';
import WorldMapDialog from './utils/WorldMapDialog.vue';

// 导入数据产品操作按钮组件
import DataProductActions from './imgProcess/DataProductActions.vue';
import ParameterSettingsDialog from './imgProcess/ParameterSettingsDialog.vue';
import IniConfigEditor from './imgProcess/IniConfigEditor.vue';

// 导入业务流程编排器
import { useProcessOrchestrator } from '../composables/useProcessOrchestrator.js';

// 1. 准备好所有需要的 ref
const multiFrameSystemRef = ref(null);
const dataColumnRef = ref(null);
const folderInputRef = ref(null);

// 2. 调用编排器，获取所有需要的数据和方法
const {
  // 状态和 Refs
  selectedMode,
  isManualMode,
  trajectoryFile,
  selectedAlgorithmType,
  selectedSpecificAlgorithm,
  imageRows,
  imageCols,
  selectedPrecision,
  satelliteType,
  satelliteModel,
  waveType,
  currentMultiFrameIndex,
  allFeaturesData,
  isLoading,
  canInferInCurrentMode,
  zoomLevel,
  parsedLogs,
  connectionStatus,
  connectionAttempts,
  notifications,
  numberOfResultFrames,
  multiFrameRoiImage,
  multiFrameResultImage,
  isConfigEditorVisible,
  currentConfig,
  canGenerateFullProduct,
  multiFramePreviewLoader,
  uploadProgress,
  isVersionDialogVisible,
  isSettingsDialogVisible,
  parameterSettings,
  isMapVisible,
  mapMarkerData,
  latestTaskId,

  autoModeConnectionStatus,
  autoModeDatFileUrls,

  openConfigEditor,
  handleSaveConfig,
  downloadFullProduct,
  transmitFullProduct,
  handleSaveSettings,

  // 方法
  handleModeChange,
  handleInfer,
  handleFolderSelectedViaDialog,
  handleClearAllMultiFrames,
  triggerFolderDialogForPathHint,
  triggerTrajectoryFileDialog,
  logOut,
  toggleSseConnection,
  clearAllLogsAndReports,
  zoomIn,
  zoomOut,
  toggleAutoModeConnection,
  handleUpdateResultType,
} = useProcessOrchestrator(multiFrameSystemRef, dataColumnRef, folderInputRef);

const hasResults = computed(() => {
  return !!multiFrameResultImage.value;
});

const formatTime = (timestamp) => {
  if (!timestamp) return '--';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  // 返回格式: YYYY-MM-DD HH:mm:ss
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 时间范围计算属性
const timeRangeLabel = computed(() => {
  const data = allFeaturesData.value;
  if (!data) return 'N/A';

  // 检查是否包含必要的年月日数组
  if (Array.isArray(data.year) && Array.isArray(data.month) && Array.isArray(data.day)) {
    const len = data.year.length;
    if (len === 0) return '无数据';

    // 定义一个辅助函数来提取第 i 帧的时间戳
    const getTimeAt = (i) => {
      const y = data.year[i];
      const m = data.month[i] - 1; // 月份修正
      const d = data.day[i];
      const h = data.hour ? data.hour[i] : 0;
      const min = data.min ? data.min[i] : 0;
      const s = data.sec ? data.sec[i] : 0;
      // 注意：有些数据可能没有 msec 字段，做个兼容
      const ms = data.msec ? data.msec[i] : 0;
      return new Date(y, m, d, h, min, s, ms).getTime();
    };

    // 遍历所有帧找到最小和最大时间
    // 初始化 minTs 和 maxTs
    let minTs = getTimeAt(0);
    let maxTs = minTs;

    for (let i = 1; i < len; i++) {
      const currentTs = getTimeAt(i);
      if (!isNaN(currentTs)) {
        if (currentTs < minTs) minTs = currentTs;
        if (currentTs > maxTs) maxTs = currentTs;
      }
    }

    if (minTs === maxTs) {
      return formatTime(minTs);
    }
    return `${formatTime(minTs)} 至 ${formatTime(maxTs)}`;
  }

  return '无时间数据';
});

// 当前帧号计算属性
const currentFrameLabel = computed(() => {
  if (numberOfResultFrames.value > 0) {
    // 显示：当前索引+1 / 总帧数
    return `${currentMultiFrameIndex.value + 1} / ${numberOfResultFrames.value}`;
  }
  return '- / -';
});

const typeNameMap = {
  0: '低可信事件', 1: '火山爆发', 2: '火灾', 3: '恒星', 4: '卷云', 5: '冰雪盖'
};

const currentResultType = ref(0);

watch(() => allFeaturesData.value, (newVal) => {
  if (!newVal) {
    console.warn("allFeaturesData 为空 (null/undefined)");
    return;
  }
  const rawValue = newVal.category_type;

  if (rawValue !== undefined) {
    const typeVal = Array.isArray(rawValue) ? rawValue[0] : rawValue;
    currentResultType.value = Number(typeVal);
    const matchedOption = typeNameMap[currentResultType.value];
  } else {
    console.error("❌ 数据中缺少 category_type 字段！");
  }
}, { immediate: true, deep: true });

const onResultTypeChange = (newValue) => {

  // 1. 获取当前原始值 (用于“取消”时的回滚)
  let originalValue = 0;
  if (allFeaturesData.value && allFeaturesData.value.category_type !== undefined) {
    const raw = allFeaturesData.value.category_type;
    originalValue = Number(Array.isArray(raw) ? raw[0] : raw);
  }

  ElMessageBox.confirm(
      '确定要修改结果类型吗？修改将同步保存到数据库。',
      '确认修改',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        draggable: true, // 允许拖拽弹窗
      }
  )
      .then(() => {
        console.log(`确认修改类型: ${originalValue} -> ${newValue}`);
        handleUpdateResultType(newValue);
      })
      .catch(() => {
        console.log('取消修改，回滚值');
        currentResultType.value = originalValue;
      });
};

const resultTypeLabel = computed(() => {
  if (!allFeaturesData.value || allFeaturesData.value.category_type === undefined) return '未知';
  const typeCode = allFeaturesData.value.category_type;
  return typeNameMap[typeCode] || `类型 ${typeCode}`;
});

const cameraTypeLabel = computed(() => {
  // 默认显示面阵
  const type = waveType.value || '';
  if (type.toLowerCase().includes('scan')) return '线阵';
  return '面阵';
});

const waveBandLabel = computed(() => {
  // 默认显示短波
  const type = waveType.value || '';
  if (type.toLowerCase().includes('mid')) return '中波';
  return '短波';
});

const modeLabel = computed(() => {
  return isManualMode.value ? '手动模式' : '自动模式';
});

const satelliteLabel = computed(() => {
  if (!satelliteType.value && !satelliteModel.value) return '未设置';
  return satelliteModel.value || satelliteType.value;
});

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
/* 当处于并排模式时，滑动条容器宽度变为50% */
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

.task-info-bar {
  background-color: rgb(21, 45, 81);
  border-radius: 8px;
  padding: 12px 20px;
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 20px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.info-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.info-item .label {
  font-size: 12px;
  color: #a0cfff;
  margin-bottom: 4px;
}

.info-item .value {
  font-size: 15px;
  font-weight: bold;
  color: #fff;
}

.info-item .value.highlight {
  color: #ffca28; /* 金黄色高亮 ID */
  font-family: monospace;
  font-size: 16px;
}

.info-item .value.result-highlight {
  color: #67c23a; /* 绿色高亮结果类型 */
}

.time-value {
  font-size: 13px !important; /* 时间文字稍小一点以免换行 */
  white-space: nowrap;
}

.separator {
  width: 1px;
  height: 30px;
  background-color: rgba(255, 255, 255, 0.2);
  margin: 0 10px;
}

.result-type-select {
  width: 110px;
}

.result-type-select :deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.2) !important; /* 半透明深色背景 */
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding-left: 8px;
  padding-right: 8px;
}

.result-type-select :deep(.el-input__inner) {
  color: #67c23a !important; /* 保持原来的绿色高亮文字 */
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}

.result-type-select :deep(.el-select__icon) {
  color: rgba(255, 255, 255, 0.7);
}

/* 鼠标悬停时的边框 */
.result-type-select :deep(.el-input__wrapper):hover {
  border-color: #409eff;
}
</style>