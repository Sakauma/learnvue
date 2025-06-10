/*MainImageViewer.vue*/
<template>
  <div class="image-container" ref="imageContainerRef">
    <el-image
        v-if="imageUrl && !isCroppingActive"
        :src="imageUrl"
        fit="contain"
        class="responsive-image"
        :style="{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }"
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
import { ref, defineExpose } from 'vue';
import { ElImage } from 'element-plus';
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const props = defineProps({
  imageUrl: String,
  zoomLevel: {
    type: Number,
    default: 100,
  },
  isCroppingActive: Boolean,
});

const emit = defineEmits(['crop-confirmed']);

const imageContainerRef = ref(null);
const cropperRef = ref(null);

/**
 * @description 父组件可以通过调用此方法来获取裁剪结果
 */
async function confirmCrop() {
  if (!cropperRef.value) return;
  try {
    const { canvas, coordinates } = await cropperRef.value.getResult({ mimeType: 'image/png' });
    // 将裁剪结果派发出去
    emit('crop-confirmed', {
      croppedImageBase64: canvas.toDataURL('image/png'),
      coordinates,
    });
  } catch (error) {
    console.error('裁剪失败:', error);
  }
}

// 通过 defineExpose 将 confirmCrop 方法暴露给父组件
defineExpose({
  confirmCrop,
});
</script>

<style scoped>
.image-container {
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
  color: #aaa;
  font-size: 1.2rem;
}
</style>