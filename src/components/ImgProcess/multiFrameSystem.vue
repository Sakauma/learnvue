<template>
  <div class="multi-frame-system-wrapper">
    <div class="controls-bar-area">
      <div class="common-controls">
        <el-button class="bar-button" :icon="Upload" title="选择文件夹" @click="requestFolderSelection"></el-button>
        <el-button class="bar-button" :icon="Delete" title="删除当前帧(功能待完善)" @click="handleDeleteCurrent" :disabled="!canOperateOnFrame"></el-button>
        <el-button class="bar-button" :icon="ZoomIn" title="放大" @click="$emit('zoom-in')" :disabled="!canOperateOnFrame"></el-button>
        <el-button class="bar-button" :icon="ZoomOut" title="缩小" @click="$emit('zoom-out')" :disabled="!canOperateOnFrame"></el-button>
        <el-button class="bar-button" :icon="Crop" title="截取当前帧" @click="toggleCropOnCurrentFrame" :disabled="!canOperateOnFrame || isCroppingInternal"></el-button>
        <el-button v-if="isCroppingInternal" class="bar-button" :icon="Check" title="确认裁剪" @click="confirmCropInternal"></el-button>
      </div>

      <div class="frame-navigation-controls" v-if="loader.totalFrames.value > 0">
        <el-button class="nav-button" :icon="ArrowLeftBold" @click="loader.prevFrame()" :disabled="loader.currentIndex.value <= 0 || loader.isLoadingFrame.value"></el-button>
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
        <el-button class="nav-button" :icon="ArrowRightBold" @click="loader.nextFrame()" :disabled="loader.currentIndex.value >= loader.totalFrames.value - 1 || loader.isLoadingFrame.value"></el-button>
        <span class="frame-indicator">{{ frameIndicatorText }}</span>
      </div>
      <div v-else class="frame-navigation-controls no-frames-placeholder">
        请选择包含图像的文件夹
      </div>
    </div>

    <div class="image-display-area" ref="imageContainerForMultiRef">
      <el-image
          v-if="loader.currentFrameImageUrl.value && !isCroppingInternal"
          :key="loader.currentFrameImageUrl.value"
      :src="loader.currentFrameImageUrl.value"
      fit="contain"
      class="responsive-image"
      :style="{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }"
      ></el-image>
      <div v-if="!loader.currentFrameImageUrl.value && !loader.isLoadingFrame.value && !isCroppingInternal" class="image-placeholder">
        {{ loader.totalFrames.value > 0 ? '请通过导航选择一帧' : '请选择包含受支持图像的文件夹' }}
      </div>
      <div v-if="loader.isLoadingFrame.value" class="image-placeholder">图像加载中...</div>

      <Cropper
          v-if="loader.currentFrameImageUrl.value && isCroppingInternal"
          :key="`cropper-${loader.currentFrameImageUrl.value}`"
      :src="loader.currentFrameImageUrl.value"
      ref="cropperMultiRef"
      :aspect-ratio="1"
      view-mode="1"
      style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ElImage, ElButton, ElSlider } from 'element-plus';
import { Upload, Delete, ZoomIn, ZoomOut, Crop, Check, ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import { useMultiFrameLoader } from '../../composables/useMultiFrameLoader';
import { useNotifications } from '../../composables/useNotifications';

const props = defineProps({
  zoomLevel: { type: Number, default: 100 },
});

const emit = defineEmits([
  'request-folder-select',
  'zoom-in', 'zoom-out',
  'crop-confirmed',
  'current-frame-file-for-inference',
  'delete-current-frame' // 父组件将处理实际的文件列表修改和重新加载逻辑
]);

const notifications = useNotifications();
const loader = useMultiFrameLoader(notifications.showNotification);

const cropperMultiRef = ref(null);
const isCroppingInternal = ref(false);

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

function toggleCropOnCurrentFrame() {
  if (!canOperateOnFrame.value) return;
  isCroppingInternal.value = !isCroppingInternal.value;
  if(isCroppingInternal.value) {
    console.log("多帧裁剪模式已开启，当前帧:", loader.currentFrameFile.value?.name);
  } else {
    console.log("多帧裁剪模式已关闭");
  }
}

async function confirmCropInternal() {
  if (!cropperMultiRef.value || !loader.currentFrameFile.value) return;
  try {
    const { canvas, coordinates } = await cropperMultiRef.value.getResult({ mimeType: 'image/png' });
    emit('crop-confirmed', {
      croppedImageBase64: canvas.toDataURL('image/png'),
      coordinates,
      frameFile: loader.currentFrameFile.value
    });
    isCroppingInternal.value = false;
  } catch (error) {
    console.error('多帧裁剪失败:', error);
    notifications.showNotification('❌ 图像裁剪失败。');
  }
}

function handleDeleteCurrent() {
  if (loader.currentFrameFile.value) {
    // emit('delete-current-frame', loader.currentFrameFile.value);
    // 实际的删除和列表更新应该由 useMultiFrameLoader 处理，然后它会更新自己的状态
    notifications.showNotification('删除当前帧的功能正在完善中 (useMultiFrameLoader 需添加删除逻辑)。', 2500);
  }
}

watch(loader.currentFrameFile, (newFile) => {
  console.log('[MultiFrameSystem] Current frame file changed:', newFile?.name);
  emit('current-frame-file-for-inference', newFile);
  if (isCroppingInternal.value && newFile) { // 如果切换了帧，且之前在裁剪，则退出裁剪
    console.log('[MultiFrameSystem] Frame changed during cropping, exiting crop mode.');
    isCroppingInternal.value = false;
  }
}, {deep: true}); // deep might not be necessary if currentFrameFile is a direct ref

// Expose methods for parent (ImgProcess.vue)
function loadFolder(htmlFileList) {
  loader.processSelectedFiles(htmlFileList);
}
function clearFrames() {
  loader.clearFrames();
  isCroppingInternal.value = false; // 清除帧时也退出裁剪
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
}

.controls-bar-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px; /* 稍微减小一点内边距 */
  border-bottom: 1px solid rgb(40, 40, 40);
  flex-shrink: 0;
  background-color: rgb(30,30,30); /* 给控制栏一个背景色以区分 */
}

.common-controls {
  display: flex;
  gap: 5px; /* 按钮之间的间隙 */
}

.frame-navigation-controls {
  display: flex;
  align-items: center;
  gap: 8px; /* 导航控件之间的间隙 */
  flex-grow: 1;
  margin-left: 15px;
  min-width: 200px; /* 防止被过度压缩 */
}
.frame-navigation-controls.no-frames-placeholder {
  color: #777;
  font-style: italic;
  justify-content: center; /* 占位符文本居中 */
}

.bar-button, .nav-button {
  width: 28px; /* 统一按钮尺寸，并略微减小 */
  height: 28px;
  padding: 0;
  background-color: rgb(60, 128, 173); /* 调整按钮颜色 */
  color: white;
  border: none;
  border-radius: 6px; /* 调整圆角 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px; /* 统一图标大小 */
}
.bar-button:hover, .nav-button:hover {
  background-color: rgb(80, 148, 193);
}
.bar-button:disabled, .nav-button:disabled {
  background-color: #5a5a5a; /* 调整禁用颜色 */
  color: #888;
  cursor: not-allowed;
}
.nav-button {
  min-width: 28px;
}

.frame-slider {
  flex-grow: 1;
  margin: 0 5px; /* 减小滑块与箭头按钮的间距 */
  --el-slider-main-bg-color: #60a8ff;
  --el-slider-runway-bg-color: #4a4a4a;
  --el-slider-button-size: 12px; /* 减小滑块按钮大小 */
}
.frame-indicator {
  color: #ccc; /* 调整指示器颜色 */
  font-size: 0.85em;
  min-width: 60px; /* 给页码足够空间 */
  text-align: right;
  white-space: nowrap; /* 防止换行 */
}

.image-display-area {
  position: relative;
  width: 100%;
  height: 60vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgb(56, 56, 56);
  overflow: hidden;
  min-height: 0; /* 对flex子项很重要 */
}
.responsive-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.image-placeholder {
  color: #aaa;
  font-size: 1.2rem;
  text-align: center;
}
</style>