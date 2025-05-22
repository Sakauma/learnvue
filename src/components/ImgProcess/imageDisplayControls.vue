<template>
  <div class="button-container">
    <input type="file" ref="fileInputRef" style="display: none" @change="onFileSelected" accept="image/*,.dat">
    <el-button class="overlay-button" :icon="Upload" title="上传图像" @click="triggerFileUpload"></el-button>
    <el-button class="overlay-button" :icon="Delete" title="删除图像" @click="$emit('delete-image')" :disabled="!canDelete"></el-button>
    <el-button class="overlay-button" :icon="ZoomIn" title="放大" @click="$emit('zoom-in')"></el-button>
    <el-button class="overlay-button" :icon="ZoomOut" title="缩小" @click="$emit('zoom-out')"></el-button>
    <el-button class="overlay-button" :icon="Crop" title="感兴趣区域截取" @click="$emit('toggle-crop')" :disabled="!canCrop"></el-button>
    <el-button v-if="isCropping" class="overlay-button" :icon="Check" title="确认裁剪" @click="$emit('confirm-crop')"></el-button>
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
});

const emit = defineEmits(['file-selected', 'delete-image', 'zoom-in', 'zoom-out', 'toggle-crop', 'confirm-crop']);

const fileInputRef = ref(null);

function triggerFileUpload() {
  fileInputRef.value?.click();
}

function onFileSelected(event) {
  const file = event.target.files?.[0];
  console.log('[ImageDisplayControls] Input "change" event fired. File from event.target.files:', file); // <-- 日志1
  if (file) {
    console.log(`[ImageDisplayControls] Emitting "file-selected" event with file: ${file.name}, type: ${file.type}, size: ${file.size}`); // <-- 日志2
    emit('file-selected', file);
  }
  if (event.target) {
    event.target.value = '';
  }
}
</script>

<style scoped>
.button-container {
  position: absolute; /* Or relative, depending on parent */
  top: 10px;
  left: 10px; /* Adjusted from 20px for tighter fit if needed */
  display: flex;
  gap: 5px; /* Adjusted from 0 */
  z-index: 10;
}
.overlay-button {
  width: 30px;
  height: 30px;
  padding: 0;
  background-color: rgb(40, 108, 153);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.overlay-button:hover {
  background-color: rgb(53, 53, 53);
}
.overlay-button:disabled {
  background-color: #a0cfff; /* Element Plus disabled color */
  cursor: not-allowed;
}
</style>