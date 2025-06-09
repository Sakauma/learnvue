// src/components/ImgProcess/ImageViewerCard.vue
<template>
  <div class="image-card">
    <el-image
        v-if="imageUrl"
        :src="imageUrl"
        fit="contain"
        class="card-image"
    >
      <template #error>
        <div class="image-slot-placeholder">
          <span>图像加载失败</span>
        </div>
      </template>
      <template #placeholder>
        <div class="image-slot-placeholder">
          <span>加载中...</span>
        </div>
      </template>
    </el-image>
    <div v-else class="image-slot-placeholder">
      <span>无图像数据</span>
    </div>
    <div class="image-label">{{ label }}</div>
  </div>
</template>

<script setup>
import { ElImage } from 'element-plus';

defineProps({
  imageUrl: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '图像',
  },
});
</script>

<style scoped>
.image-card {
  position: relative;
  background-color: rgb(56, 56, 56);
  border: 1px solid rgb(80, 80, 80);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  /* 由父级Flexbox布局决定尺寸 */
  width: 100%;
  height: 100%;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.image-label {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  box-sizing: border-box;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px;
  text-align: center;
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.image-slot-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #aaa;
  font-size: 0.9rem;
  text-align: center;
}
</style>