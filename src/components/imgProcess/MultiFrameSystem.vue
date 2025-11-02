/*MultiFrameSystem.vue*/
<template>
  <div class="multi-frame-system-wrapper">
    <div class="controls-bar-area">
      <div class="common-controls">
        <el-button
            class="bar-button"
            :icon="Upload"
            title="选择图像文件夹"
            @click="$emit('request-folder-select')"
            :disabled="props.loader.isProcessingList.value">
        </el-button>
        <el-button
            class="bar-button"
            :icon="DocumentAdd"
            title="选择轨迹文件"
            @click="$emit('request-trajectory-select')"
            :disabled="props.loader.isProcessingList.value"
            :type="trajectoryFile ? 'success' : ''">
        </el-button>
        <el-button class="bar-button" :icon="Delete" title="清除所有帧" @click="handleDeleteAllFrames" :disabled="!isAnyFrameLoaded"></el-button>
        <el-button class="bar-button" :icon="ZoomIn" title="放大" @click="$emit('zoom-in')" :disabled="!isAnyFrameDisplayable"></el-button>
        <el-button class="bar-button" :icon="ZoomOut" title="缩小" @click="$emit('zoom-out')" :disabled="!isAnyFrameDisplayable"></el-button>
      </div>

      <div class="frame-navigation-controls" v-if="navControlsVisible">
      </div>
      <div v-else class="frame-navigation-controls no-frames-placeholder">
        {{ placeholderText }}
      </div>
    </div>

    <div class="image-display-area" @wheel.prevent="handleWheel">
      <el-image
          v-if="props.loader.currentFrameImageUrl.value"
          :key="props.loader.currentFrameImageUrl.value"
          :src="props.loader.currentFrameImageUrl.value"
          fit="contain"
          class="responsive-image"
          :style="{ transform: `scale(${props.zoomLevel / 100})` }"
      ></el-image>
      <div v-if="!props.loader.currentFrameImageUrl.value && !props.loader.isLoadingFrame.value" class="image-placeholder">
        {{ placeholderText }}
      </div>
      <div v-if="props.loader.isLoadingFrame.value" class="image-placeholder">加载中...</div>
    </div>
  </div>
</template>

<!--      <div class="frame-navigation-controls" v-if="navControlsVisible">-->
<!--        <el-button class="nav-btn" :icon="ArrowLeftBold" @click="navigateFrames(-1)" :disabled="isNavigationDisabled || currentNavigationIndex <= 0"></el-button>-->
<!--        <el-slider-->
<!--            class="frame-slider"-->
<!--            :model-value="currentNavigationIndex"-->
<!--            @update:modelValue="handleSliderChange"-->
<!--            :min="0"-->
<!--            :max="navigationTotalFrames > 0 ? navigationTotalFrames - 1 : 0"-->
<!--            :disabled="isNavigationDisabled || navigationTotalFrames <= 1"-->
<!--            :format-tooltip="formatNavigationSliderTooltip"-->
<!--        ></el-slider>-->
<!--        <el-button class="nav-btn" :icon="ArrowRightBold" @click="navigateFrames(1)" :disabled="isNavigationDisabled || currentNavigationIndex >= navigationTotalFrames - 1"></el-button>-->
<!--        <span class="frame-indicator">{{ navigationFrameIndicatorText }}</span>-->
<!--      </div>-->
<!--      <div v-else class="frame-navigation-controls no-frames-placeholder">-->
<!--        {{ props.isTrajectoryMode ? '点击左上角按钮选择轨迹文件' : '点击左上角按钮选择文件夹' }}-->
<!--      </div>-->
<!--    </div>-->

<!--    <div class="image-display-area" @wheel.prevent="handleWheel">-->
<!--      <el-image-->
<!--          v-if="props.loader.currentFrameImageUrl.value && !isTrajectoryModeBeforeResults"-->
<!--          :key="props.loader.currentFrameImageUrl.value"-->
<!--          :src="props.loader.currentFrameImageUrl.value"-->
<!--          fit="contain"-->
<!--          class="responsive-image"-->
<!--          :style="{ transform: `scale(${props.zoomLevel / 100})` }"-->
<!--      ></el-image>-->
<!--      <div v-if="(!props.loader.currentFrameImageUrl.value || isTrajectoryModeBeforeResults) && !props.loader.isLoadingFrame.value" class="image-placeholder">-->
<!--        {{ placeholderText }}-->
<!--      </div>-->
<!--      <div v-if="props.loader.isLoadingFrame.value" class="image-placeholder">加载中...</div>-->
<!--    </div>-->
<!--  </div>-->
<!--</template>-->

<script setup>
import { computed } from 'vue';
import { ElImage, ElButton, ElSlider } from 'element-plus';
import { Upload, Delete, ZoomIn, ZoomOut, ArrowLeftBold, ArrowRightBold, DocumentAdd} from '@element-plus/icons-vue';

const props = defineProps({
  loader: { type: Object, required: true },
  zoomLevel: { type: Number, default: 100 },
  imageRows: { type: Number, required: true },
  imageCols: { type: Number, required: true },
  actualResultFrameCount: { type: Number, default: 0 },
  currentResultFrameIndex: { type: Number, default: -1 },
  //isTrajectoryMode: { type: Boolean, default: false },
  trajectoryFile: { type: Object, default: null }
});

const emit = defineEmits([
  'request-folder-select',
  'request-trajectory-select',
  'zoom-in',
  'zoom-out',
  'delete-all-frames',
  'update:currentResultFrameIndex'
]);

const isInResultsMode = computed(() => props.actualResultFrameCount > 0);
const isAnyFrameLoaded = computed(() =>
    props.loader.totalFrames.value > 0 ||
    props.actualResultFrameCount > 0 ||
    !!props.trajectoryFile // <--- 修改
);

const navigationTotalFrames = computed(() =>
    isInResultsMode.value ? props.actualResultFrameCount : props.loader.totalFrames.value
);

const currentNavigationIndex = computed(() =>
    isInResultsMode.value ? props.currentResultFrameIndex : props.loader.currentIndex.value
);

// const isTrajectoryModeBeforeResults = computed(() =>
//     props.isTrajectoryMode && props.actualResultFrameCount === 0
// );

const navControlsVisible = computed(() => navigationTotalFrames.value > 0);
const isNavigationDisabled = computed(() => !isInResultsMode.value && props.loader.isLoadingFrame.value);

const isAnyFrameDisplayable = computed(() => {
  if (isInResultsMode.value) return props.actualResultFrameCount > 0;
  // <--- 修改：移除 isTrajectoryMode 检查
  return !!props.loader.currentFrameImageUrl.value && !props.loader.isLoadingFrame.value;
});

const navigationFrameIndicatorText = computed(() => {
  if (navigationTotalFrames.value === 0) return '无帧';
  // <--- 修改：简化 prefix
  const prefix = isInResultsMode.value ? '结果: ' : '预览: ';
  const displayIndex = currentNavigationIndex.value >= 0 ? currentNavigationIndex.value + 1 : 1;
  return `${prefix}${displayIndex} / ${navigationTotalFrames.value}`;
});

const placeholderText = computed(() => {
  if (props.actualResultFrameCount > 0) return '结果已生成，请使用导航查看';
  if (props.loader.totalFrames.value > 0 && !props.trajectoryFile) return '请加载轨迹文件';
  if (props.loader.totalFrames.value > 0 && props.trajectoryFile) return '文件已加载，请点击分析';
  if (props.trajectoryFile) return '请加载图像文件夹';
  return '请选择图像文件夹和轨迹文件'; // <--- 修改
});

function handleWheel(event) {
  if (event.deltaY < 0) {
    emit('zoom-in');
  } else {
    emit('zoom-out');
  }
}

function handleSliderChange(newIndex) {
  if (isInResultsMode.value) {
    emit('update:currentResultFrameIndex', newIndex);
  } else if (!isNavigationDisabled.value) {
    props.loader.loadFrame(newIndex);
  }
}

function navigateFrames(direction) {
  if (isInResultsMode.value) {
    let newIndex = props.currentResultFrameIndex + direction;
    if (newIndex >= 0 && newIndex < props.actualResultFrameCount) {
      emit('update:currentResultFrameIndex', newIndex);
    }
  } else if (!isNavigationDisabled.value) {
    if (direction === 1) props.loader.nextFrame();
    else props.loader.prevFrame();
  }
}

function formatNavigationSliderTooltip(value) {
  const prefix = isInResultsMode.value ? '结果帧 ' : '预览: ';
  if (!isInResultsMode.value && props.loader.fileListNames.value[value]) {
    return props.loader.fileListNames.value[value];
  }
  return `${prefix}${value + 1}`;
}

function handleDeleteAllFrames() {
  emit('delete-all-frames');
}

/**
 * 暴露给 Orchestrator 的方法，用于同步预览帧。
 * @param {number} index - 要同步到的目标帧索引。
 */
function syncPreviewFrame(index) {
  if (!props.loader.isLoadingFrame.value) {
    props.loader.loadFrame(index);
  } else {
    console.warn(`syncPreviewFrame: 预览加载器繁忙，无法同步到索引 ${index}。`);
  }
}
// 暴露 syncPreviewFrame 方法，以便 Orchestrator 可以调用它
defineExpose({ syncPreviewFrame });

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

.bar-button[type="success"] {
  background-color: #67c23a; /* Element Plus 的 success 颜色 */
}
.bar-button[type="success"]:hover {
  background-color: #85d661;
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