<!--/*MainImageViewer.vue*/-->
<!--<template>-->
<!--  <div class="image-container" ref="imageContainerRef">-->
<!--    <SingleFrameSystem-->
<!--        :is-cropping="isCroppingActive"-->
<!--        :can-delete="!!imageUrl"-->
<!--        :can-crop="!!imageUrl"-->
<!--        :file-name="imageUrl ? imageNameFromProps : ''"-->
<!--        @file-selected="(file) => $emit('file-selected', file)"-->
<!--        @delete-image="$emit('delete-image')"-->
<!--        @zoom-in="$emit('zoom-in')"-->
<!--        @zoom-out="$emit('zoom-out')"-->
<!--        @toggle-crop="toggleCropping"-->
<!--        @confirm-crop="handleConfirmCrop"-->
<!--    />-->
<!--    <el-image-->
<!--        v-if="imageUrl && !isCroppingActive"-->
<!--        :src="imageUrl"-->
<!--        fit="contain"-->
<!--        class="responsive-image"-->
<!--        :style="{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }"-->
<!--        ref="mainImageRef"-->
<!--    ></el-image>-->
<!--    <div v-if="!imageUrl && !isCroppingActive" class="image-placeholder">请上传图像</div>-->

<!--    <Cropper-->
<!--        v-if="imageUrl && isCroppingActive"-->
<!--        ref="cropperRef"-->
<!--        :src="imageUrl"-->
<!--        :aspect-ratio="1"-->
<!--        view-mode="1"-->
<!--        style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;"-->
<!--    />-->
<!--  </div>-->
<!--</template>-->

<!--<script setup>-->
<!--import {computed, ref, watch} from 'vue';-->
<!--import { ElImage } from 'element-plus';-->
<!--import { Cropper } from 'vue-advanced-cropper';-->
<!--import 'vue-advanced-cropper/dist/style.css';-->
<!--import SingleFrameSystem from './SingleFrameSystem.vue';-->

<!--const props = defineProps({-->
<!--  imageUrl: String,-->
<!--  zoomLevel: {-->
<!--    type: Number,-->
<!--    default: 100,-->
<!--  },-->
<!--  imageNameToDisplay: String,-->
<!--});-->

<!--const emit = defineEmits([-->
<!--  'file-selected',-->
<!--  'delete-image',-->
<!--  'zoom-in',-->
<!--  'zoom-out',-->
<!--  'crop-confirmed',-->
<!--]);-->

<!--const imageContainerRef = ref(null);-->
<!--const mainImageRef = ref(null);-->
<!--const cropperRef = ref(null);-->
<!--const isCroppingActive = ref(false);-->
<!--const imageNameFromProps = computed(() => props.imageNameToDisplay);-->

<!--function toggleCropping() {-->
<!--  if (!props.imageUrl) {-->
<!--    console.warn("Cannot crop without an image.");-->
<!--    return;-->
<!--  }-->
<!--  isCroppingActive.value = !isCroppingActive.value;-->
<!--}-->

<!--async function handleConfirmCrop() {-->
<!--  if (!cropperRef.value) return;-->
<!--  try {-->
<!--    const { canvas, coordinates } = await cropperRef.value.getResult({ mimeType: 'image/png' });-->
<!--    emit('crop-confirmed', {-->
<!--      croppedImageBase64: canvas.toDataURL('image/png'),-->
<!--      coordinates,-->
<!--    });-->
<!--    isCroppingActive.value = false;-->
<!--  } catch (error) {-->
<!--    console.error('裁剪失败:', error);-->
<!--  }-->
<!--}-->

<!--watch(() => props.imageUrl, (newUrl) => {-->
<!--  if (!newUrl) {-->
<!--    isCroppingActive.value = false;-->
<!--  }-->
<!--});-->
<!--</script>-->

<!--<style scoped>-->
<!--.image-container {-->
<!--  position: relative;-->
<!--  width: 100%;-->
<!--  height: 60vh;-->
<!--  display: flex;-->
<!--  justify-content: center;-->
<!--  border: 1px solid #ccc;-->
<!--  background-color: rgb(56, 56, 56);-->
<!--  overflow: hidden;-->
<!--  transition: all 0.3s ease;-->
<!--}-->
<!--.responsive-image {-->
<!--  max-width: 100%;-->
<!--  max-height: 100%;-->
<!--  object-fit: contain;-->
<!--}-->
<!--.image-placeholder {-->
<!--  position: absolute;-->
<!--  top: 20px; left: 0;-->
<!--  width: 100%; height: 100%;-->
<!--  display: flex;-->
<!--  align-items: center;-->
<!--  justify-content: center;-->
<!--  color: #aaa;-->
<!--  font-size: 1.2rem;-->
<!--}-->
<!--</style>-->

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

// Props 被大大简化，只接收和显示相关的数据
const props = defineProps({
  imageUrl: String,
  zoomLevel: {
    type: Number,
    default: 100,
  },
  // 新增 prop，由父组件告知当前是否处于裁剪状态
  isCroppingActive: Boolean,
});

// 定义向外派发的事件
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
  /* 高度不再由自己决定，而是由父组件的样式控制 */
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center; /* 新增，让占位符居中更好看 */
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
  /* 移除了 position: absolute, 让 flex 布局来居中它 */
  color: #aaa;
  font-size: 1.2rem;
}
</style>