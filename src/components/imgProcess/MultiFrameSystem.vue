/*MultiFrameSystem.vue*/
<template>
  <div class="multi-frame-system-wrapper">
    <div class="controls-bar-area">
      <div class="common-controls">
        <el-button class="bar-button" :icon="Upload" title="选择文件夹" @click="requestFolderSelectionForPreview"></el-button>
        <el-button class="bar-button" :icon="Delete" title="清除所有帧" @click="handleDeleteAllPreviewFrames" :disabled="previewLoader.totalFrames.value === 0 && props.actualResultFrameCount === 0"></el-button>
        <el-button class="bar-button" :icon="ZoomIn" title="放大" @click="$emit('zoom-in')" :disabled="!isAnyFrameDisplayable"></el-button>
        <el-button class="bar-button" :icon="ZoomOut" title="缩小" @click="$emit('zoom-out')" :disabled="!isAnyFrameDisplayable"></el-button>
      </div>

      <div class="frame-navigation-controls" v-if="navControlsVisible">
        <el-button class="nav-btn" :icon="ArrowLeftBold" @click="navigateFrames(-1)" :disabled="currentNavigationIndex <= 0 || (!isInResultsMode && previewLoader.isLoadingFrame.value)"></el-button>
        <el-slider
            class="frame-slider"
            :model-value="currentNavigationIndex"
            @update:modelValue="handleSliderChange($event)"
            :min="0"
            :max="navigationTotalFrames > 0 ? navigationTotalFrames - 1 : 0"
            :step="1"
            :disabled="navigationTotalFrames <= 1 || (!isInResultsMode && previewLoader.isLoadingFrame.value)"
            :format-tooltip="formatNavigationSliderTooltip"
            show-stops
        ></el-slider>
        <el-button class="nav-btn" :icon="ArrowRightBold" @click="navigateFrames(1)" :disabled="currentNavigationIndex >= navigationTotalFrames - 1 || (!isInResultsMode && previewLoader.isLoadingFrame.value)"></el-button>
        <span class="frame-indicator">{{ navigationFrameIndicatorText }}</span>
      </div>
      <div v-else class="frame-navigation-controls no-frames-placeholder">
        选择文件夹
      </div>
    </div>

    <div class="image-display-area" ref="imageContainerForMultiRef">
      <el-image
          v-if="previewLoader.currentFrameImageUrl.value"
          :key="previewLoader.currentFrameImageUrl.value"
          :src="previewLoader.currentFrameImageUrl.value"
          fit="contain"
          class="responsive-image"
          :style="{ transform: `scale(${props.zoomLevel / 100})`, transformOrigin: 'center center' }"
      ></el-image>
      <div v-if="!previewLoader.currentFrameImageUrl.value && !previewLoader.isLoadingFrame.value" class="image-placeholder">
        {{ previewLoader.totalFrames.value > 0 ? '导航' : (props.actualResultFrameCount > 0 ? '结果已生成，请使用上方导航查看结果区域' : '选择文件夹预览') }}
      </div>
      <div v-if="previewLoader.isLoadingFrame.value" class="image-placeholder">原始图像加载中...</div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { ElImage, ElButton, ElSlider } from 'element-plus';
import { Upload, Delete, ZoomIn, ZoomOut, ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue';
import { useMultiFrameLoader } from '../../composables/useMultiFrameLoader.js';
import { useNotifications } from '../../composables/useNotifications.js'

const props = defineProps({
  zoomLevel: { type: Number, default: 100 },
  imageRows: { type: Number, required: true },
  imageCols: { type: Number, required: true },
  actualResultFrameCount: { type: Number, default: 0 },
  currentResultFrameIndex: { type: Number, default: -1 }
});

const emit = defineEmits([
  'request-folder-select',
  'zoom-in',
  'zoom-out',
  'delete-all-frames',
  'update:currentResultFrameIndex'
]);

const notifications = useNotifications();
const previewLoader = useMultiFrameLoader(notifications.showNotification);

const isInResultsMode = computed(() => props.actualResultFrameCount > 0);

const navigationTotalFrames = computed(() => {
  return isInResultsMode.value ? props.actualResultFrameCount : previewLoader.totalFrames.value;
});

const currentNavigationIndex = computed(() => {
  if (isInResultsMode.value && props.currentResultFrameIndex >= 0) {
    return props.currentResultFrameIndex;
  }
  return isInResultsMode.value ? (props.currentResultFrameIndex >= 0 ? props.currentResultFrameIndex : 0) : previewLoader.currentIndex.value;
});

const navControlsVisible = computed(() => navigationTotalFrames.value > 0);

const isAnyFrameDisplayable = computed(() => {
  if (isInResultsMode.value) {
    return props.actualResultFrameCount > 0;
  }
  return !!previewLoader.currentFrameImageUrl.value && !previewLoader.isLoadingFrame.value;
});


const navigationFrameIndicatorText = computed(() => {
  if (navigationTotalFrames.value === 0) return '无帧';
  const prefix = isInResultsMode.value ? '结果: ' : '预览: ';
  const displayIndex = currentNavigationIndex.value >= 0 ? currentNavigationIndex.value + 1 : 1;
  return `${prefix}${displayIndex} / ${navigationTotalFrames.value}`;
});

function handleSliderChange(newIndex) {
  if (isInResultsMode.value) {
    emit('update:currentResultFrameIndex', newIndex);
  } else {
    if (!previewLoader.isLoadingFrame.value) {
      previewLoader.loadFrame(newIndex);
    }
  }
}

function navigateFrames(direction) {
  let newCalculatedIndex = currentNavigationIndex.value + direction;

  if (newCalculatedIndex < 0) newCalculatedIndex = 0;
  if (newCalculatedIndex >= navigationTotalFrames.value) newCalculatedIndex = navigationTotalFrames.value - 1;

  if (isInResultsMode.value) {
    if (props.currentResultFrameIndex !== newCalculatedIndex) {
      emit('update:currentResultFrameIndex', newCalculatedIndex);
    }
  } else {
    if (!previewLoader.isLoadingFrame.value) {
      if (direction === -1 && previewLoader.currentIndex.value > 0) {
        previewLoader.prevFrame();
      } else if (direction === 1 && previewLoader.currentIndex.value < previewLoader.totalFrames.value - 1) {
        previewLoader.nextFrame();
      }
    }
  }
}

function syncPreviewFrameToIndex(index) {
  if (previewLoader && typeof previewLoader.loadFrame === 'function') {
    const totalPreviewFrames = previewLoader.totalFrames?.value;
    // 确保索引在预览帧的有效范围内
    if (typeof totalPreviewFrames === 'number' && index >= 0 && index < totalPreviewFrames) {
      if (!previewLoader.isLoadingFrame.value) { // 避免在加载时再次加载
        previewLoader.loadFrame(index);
        console.log(`外部请求同步预览帧到索引: ${index}`);
      } else {
        console.warn(`syncPreviewFrameToIndex: 预览加载器繁忙，无法同步到索引 ${index}。`);
      }
    } else {
      console.warn(`syncPreviewFrameToIndex: 索引 ${index} 无效或总预览帧数 (${totalPreviewFrames}) 不可用。`);
    }
  } else {
    console.warn(`syncPreviewFrameToIndex: previewLoader.loadFrame 不可用。`);
  }
}

function formatNavigationSliderTooltip(value) {
  const prefix = isInResultsMode.value ? '结果帧 ' : '预览帧 ';
  if (!isInResultsMode.value && previewLoader.fileListNames.value[value]) {
    return previewLoader.fileListNames.value[value];
  }
  return `${prefix}${value + 1}`;
}

function requestFolderSelectionForPreview() {
  emit('request-folder-select');
}

watch(previewLoader.currentFrameFile, (newFile) => {
}, {deep: true});

function loadFolderForPreview(htmlFileList, precision) {
  if (props.imageRows > 0 && props.imageCols > 0) {
    previewLoader.processSelectedFiles(htmlFileList, props.imageRows, props.imageCols, precision);
    if (!isInResultsMode.value && previewLoader.totalFrames.value > 0) {
    }
  } else {
    notifications.showNotification('❌ 无法加载预览：图像的行数和列数无效。', 2000);
  }
}

function handleDeleteAllPreviewFrames() {
  const didClearPreview = previewLoader.totalFrames.value > 0;
  emit('delete-all-frames', { previewCleared: didClearPreview });
}

defineExpose({
  loadFolder: loadFolderForPreview,
  clearPreviewFrames: previewLoader.clearFrames,
  syncPreviewFrame: syncPreviewFrameToIndex
});

</script>

<style scoped>
.multi-frame-system-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.controls-bar-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid rgb(40, 40, 40);
  flex-shrink: 0;
  background-color: rgb(30,30,30);
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

.bar-button, .nav-btn {
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
.bar-button:hover, .nav-btn:hover {
  background-color: rgb(80, 148, 193);
}
.bar-button:disabled, .nav-btn:disabled {
  background-color: #5a5a5a;
  color: #888;
  cursor: not-allowed;
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
  min-width: 90px;
  text-align: right;
  white-space: nowrap;
}

.image-display-area {
  position: relative;
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: rgb(56, 56, 56);
  overflow: hidden;
  transition: all 0.3s ease;
  flex: 1;
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