/*SingleFrameSystem.vue*/
<template>
  <!-- 控制栏容器，包含所有控制按钮和文件名显示 -->
  <div class="display-controls-bar">
    <!-- 控制按钮组 -->
    <div class="control-buttons">
      <!-- 隐藏的文件输入框，用于选择图像文件 -->
      <input
          type="file"
          ref="fileInputRef"
          style="display: none"
          @change="onFileSelected"
          accept="image/*,.dat,.tif,.tiff,.bmp,.gif,.jpeg,.jpg,.png"
      >
      <!-- 上传图像按钮 -->
      <el-button
          class="bar-btn"
          :icon="Upload"
          title="上传图像"
          @click="triggerFileUpload"
      ></el-button>

      <!-- 删除图像按钮 -->
      <el-button
          class="bar-btn"
          :icon="Delete"
          title="删除图像"
          @click="$emit('delete-image')"
          :disabled="!canDelete"
      ></el-button>

      <!-- 放大按钮 -->
      <el-button
          class="bar-btn"
          :icon="ZoomIn"
          title="放大"
          @click="$emit('zoom-in')"
      ></el-button>

      <!-- 缩小按钮 -->
      <el-button
          class="bar-btn"
          :icon="ZoomOut"
          title="缩小"
          @click="$emit('zoom-out')"
      ></el-button>

      <!-- 条件渲染的裁剪区域控制按钮 -->
      <el-button
          v-if="showCropControls"
          class="bar-btn"
          :icon="Crop"
          title="感兴趣区域截取"
          @click="$emit('toggle-crop')"
          :disabled="!canCrop"
      ></el-button>

      <!-- 条件渲染的确认裁剪按钮 -->
      <el-button
          v-if="showCropControls && isCropping"
          class="bar-btn"
          :icon="Check"
          title="确认裁剪"
          @click="$emit('confirm-crop')"
      ></el-button>
    </div>

    <!-- 文件名显示区域 -->
    <div class="file-name-display" :title="fileName || '未选择文件'">
      {{ fileName || '请选择文件' }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElButton } from 'element-plus';
import { ZoomIn, ZoomOut, Upload, Delete, Crop, Check } from '@element-plus/icons-vue';

defineProps({
  isCropping: Boolean,
  canDelete: Boolean,
  canCrop: Boolean,
  fileName: String,
  showCropControls: {
    type: Boolean,
    default: true,
  },
});

const emit = defineEmits(['file-selected', 'delete-image', 'zoom-in', 'zoom-out', 'toggle-crop', 'confirm-crop']);

// 创建文件输入框的引用
const fileInputRef = ref(null);

// 触发文件上传的函数
function triggerFileUpload() {
  // 通过引用触发文件输入框的点击事件
  fileInputRef.value?.click();
}

// 处理文件选择的函数
function onFileSelected(event) {
  // 获取选择的文件
  const file = event.target.files?.[0];
  // 如果有文件，则触发 file-selected 事件
  if (file) {
    emit('file-selected', file);
  }
  // 清空文件输入框的值，以便可以重复选择同一个文件
  if (event.target) {
    event.target.value = '';
  }
}
</script>

<style scoped>
.display-controls-bar {
  display: flex;
  align-items: center;
  padding: 6px 10px;
  background-color: rgb(30,30,30);
  border-bottom: 1px solid rgb(40, 40, 40);
  width: 100%;
  box-sizing: border-box;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}
.file-name-display {
  flex-grow: 1;
  color: #777;
  font-style: italic;
  text-align: center;
  overflow: hidden;
}
.control-buttons {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.bar-btn {
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
.bar-btn:hover {
  background-color: rgb(80, 148, 193);
}
.bar-btn:disabled {
  background-color: #5a5a5a;
  color: #888;
  cursor: not-allowed;
}
</style>