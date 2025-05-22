<template>
  <div class="multi-frame-system-wrapper">
    <div class="controls-bar-area">
      <div class="common-controls">
        <el-button class="bar-button" :icon="Upload" title="选择文件夹" @click="requestFolderSelection"></el-button>
        <el-button class="bar-button" :icon="Delete" title="清除所有帧" @click="handleDeleteAllFrames" :disabled="loader.totalFrames.value === 0"></el-button>
        <el-button class="bar-button" :icon="ZoomIn" title="放大" @click="$emit('zoom-in')" :disabled="!canOperateOnFrame"></el-button>
        <el-button class="bar-button" :icon="ZoomOut" title="缩小" @click="$emit('zoom-out')" :disabled="!canOperateOnFrame"></el-button>
      </div>
      <div class="frame-navigation-controls" v-if="loader.totalFrames.value > 0">
        <el-button class="nav-btn" :icon="ArrowLeftBold" @click="loader.prevFrame()" :disabled="loader.currentIndex.value <= 0 || loader.isLoadingFrame.value"></el-button>
        <el-slider
            class="frame-slider"
            :model-value="loader.currentIndex.value"
            @update:modelValue="onSliderChange($event)"
            :min="0"
            :max="loader.totalFrames.value > 0 ? loader.totalFrames.value - 1 : 0"
            :step="1"
            :disabled="loader.totalFrames.value <= 1 || loader.isLoadingFrame.value"
            :format-tooltip="formatSliderTooltip"
            show-stops
        ></el-slider>
        <el-button class="nav-btn" :icon="ArrowRightBold" @click="loader.nextFrame()" :disabled="loader.currentIndex.value >= loader.totalFrames.value - 1 || loader.isLoadingFrame.value"></el-button>
        <span class="frame-indicator">{{ frameIndicatorText }}</span>
      </div>
      <div v-else class="frame-navigation-controls no-frames-placeholder">
        请选择包含图像的文件夹
      </div>
    </div>

    <div class="image-display-area" ref="imageContainerForMultiRef">
      <el-image
          v-if="loader.currentFrameImageUrl.value"
          :key="loader.currentFrameImageUrl.value"
          :src="loader.currentFrameImageUrl.value"
          fit="contain"
          class="responsive-image"
          :style="{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }"
      ></el-image>
      <div v-if="!loader.currentFrameImageUrl.value && !loader.isLoadingFrame.value" class="image-placeholder">
        {{ loader.totalFrames.value > 0 ? '请通过导航选择一帧' : '请选择包含受支持图像的文件夹' }}
      </div>
      <div v-if="loader.isLoadingFrame.value" class="image-placeholder">图像加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { ElImage, ElButton, ElSlider } from 'element-plus';
import { Upload, Delete, ZoomIn, ZoomOut, ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';
import { useMultiFrameLoader } from '../../composables/useMultiFrameLoader';
import { useNotifications } from '../../composables/useNotifications';

const props = defineProps({
  zoomLevel: { type: Number, default: 100 },
});

const emit = defineEmits([
  'request-folder-select',
  'zoom-in', 'zoom-out',
  'current-frame-file-for-inference',
  'delete-current-frame' // 父组件将处理实际的文件列表修改和重新加载逻辑
]);

const notifications = useNotifications();
const loader = useMultiFrameLoader(notifications.showNotification);

const canOperateOnFrame = computed(() => !!loader.currentFrameImageUrl.value && !loader.isLoadingFrame.value);

const frameIndicatorText = computed(() => {
  if (loader.totalFrames.value === 0) return '0 / 0';
  return `${loader.currentIndex.value + 1} / ${loader.totalFrames.value}`;
});

function requestFolderSelection() {
  emit('request-folder-select');
}

function onSliderChange(value) {
  if (!loader.isLoadingFrame.value) { // 防止快速拖动时重复加载
    loader.loadFrame(value);
  }
}

function formatSliderTooltip(value) {
  if (loader.fileListNames.value[value]) {
    return loader.fileListNames.value[value];
  }
  return `${value + 1}`;
}

function handleDeleteAllFrames() {
  if (loader.totalFrames.value > 0) {
    emit('delete-all-frames'); // 父组件 ImgProcess.vue 将负责调用 clearFrames 和重置
  } else {
    notifications.showNotification('没有可清除的文件。', 1500);
  }
}

watch(loader.currentFrameFile, (newFile) => {
  emit('current-frame-file-for-inference', newFile);
}, {deep: true}); // deep might not be necessary if currentFrameFile is a direct ref

// Expose methods for parent (ImgProcess.vue)
function loadFolder(htmlFileList) {
  loader.processSelectedFiles(htmlFileList);
}
function clearFrames() {
  loader.clearFrames();
}
function getCurrentFrameFileForInference() {
  return loader.currentFrameFile.value;
}
function getCurrentFrameMD5() {
  return loader.currentFrameMD5.value;
}

defineExpose({ loadFolder, clearFrames, getCurrentFrameFileForInference, getCurrentFrameMD5 });

</script>

<style scoped>
.multi-frame-system-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  border: 1px solid #ccc;
}

.controls-bar-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid rgb(40, 40, 40);
  flex-shrink: 0;
  background-color: rgb(30,30,30);
  top: 0;
  left: 0;
  z-index: 10;
}

.common-controls {
  display: flex;
  gap: 5px;
}

.frame-navigation-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
  margin-left: 15px;
  min-width: 200px;
}
.frame-navigation-controls.no-frames-placeholder {
  color: #777;
  font-style: italic;
  justify-content: center;
}

.bar-button, .nav-button {
  width: 30px;
  height: 30px;
  padding: 0;
  background-color: rgb(60, 128, 173);
  color: white;
  border: none;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.bar-button:hover, .nav-button:hover {
  background-color: rgb(80, 148, 193);
}
.bar-button:disabled, .nav-button:disabled {
  background-color: #5a5a5a;
  color: #888;
  cursor: not-allowed;
}
.nav-button {
  min-width: 28px;
}

.frame-slider {
  flex-grow: 1;
  margin: 0 5px;
  --el-slider-main-bg-color: #60a8ff;
  --el-slider-runway-bg-color: #4a4a4a;
  --el-slider-button-size: 12px;
}
.frame-indicator {
  color: #ccc;
  font-size: 0.85em;
  min-width: 60px;
  text-align: right;
  white-space: nowrap;
}

.image-display-area {
  position: relative;
  width: 100%;
  height: 55.5vh;
  display: flex;
  justify-content: center;
  background-color: rgb(56, 56, 56);
  overflow: hidden;
  transition: all 0.3s ease;
  padding-top: 40px;
}
.responsive-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.image-placeholder {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.2rem;
}
</style>