/*MainImageViewer.vue*/
<template>
  <div class="image-container" ref="imageContainerRef">
    <SingleFrameSystem
        :is-cropping="isCroppingActive"
        :can-delete="!!imageUrl"
        :can-crop="!!imageUrl"
        :file-name="imageUrl ? imageNameFromProps : ''"
        @file-selected="(file) => $emit('file-selected', file)"
        @delete-image="$emit('delete-image')"
        @zoom-in="$emit('zoom-in')"
        @zoom-out="$emit('zoom-out')"
        @toggle-crop="toggleCropping"
        @confirm-crop="handleConfirmCrop"
    />
    <el-image
        v-if="imageUrl && !isCroppingActive"
        :src="imageUrl"
        fit="contain"
        class="responsive-image"
        :style="{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }"
        ref="mainImageRef"
    ></el-image>
    <div v-if="!imageUrl && !isCroppingActive" class="image-placeholder">请上传图像</div>

    <Cropper
        v-if="imageUrl && isCroppingActive"
        ref="cropperRef"
        :src="imageUrl"
        :aspect-ratio="1"
        view-mode="1"
        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"
    />
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';
import SingleFrameSystem from './SingleFrameSystem.vue';

const props = defineProps({
  imageUrl: String,
  zoomLevel: {
    type: Number,
    default: 100,
  },
  imageNameToDisplay: String,
});

const emit = defineEmits([
  'file-selected',
  'delete-image',
  'zoom-in',
  'zoom-out',
  'crop-confirmed',
]);

const imageContainerRef = ref(null);
const mainImageRef = ref(null);
const cropperRef = ref(null);
const isCroppingActive = ref(false);
const imageNameFromProps = computed(() => props.imageNameToDisplay);

function toggleCropping() {
  if (!props.imageUrl) {
    console.warn("Cannot crop without an image.");
    return;
  }
  isCroppingActive.value = !isCroppingActive.value;
}

async function handleConfirmCrop() {
  if (!cropperRef.value) return;
  try {
    const { canvas, coordinates } = await cropperRef.value.getResult({ mimeType: 'image/png' });
    emit('crop-confirmed', {
      croppedImageBase64: canvas.toDataURL('image/png'),
      coordinates,
    });
    isCroppingActive.value = false;
  } catch (error) {
    console.error('裁剪失败:', error);
  }
}

watch(() => props.imageUrl, (newUrl) => {
  if (!newUrl) {
    isCroppingActive.value = false;
  }
});
</script>

<style scoped>
.image-container {
  position: relative;
  width: 100%;
  height: 60vh;
  display: flex;
  justify-content: center;
  border: 1px solid #ccc;
  background-color: rgb(56, 56, 56);
  overflow: hidden;
  transition: all 0.3s ease;
}
.responsive-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.image-placeholder {
  position: absolute;
  top: 20px; left: 0;
  width: 100%; height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #aaa;
  font-size: 1.2rem;
}
</style>