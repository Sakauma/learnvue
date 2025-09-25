/*ImageViewerCard.vue*/
<template>
  <!-- 整个图像卡片容器 -->
  <div class="image-card">
    <!-- 使用Element Plus的图片组件 -->
    <el-image
        v-if="imageUrl"
        :src="imageUrl"
        fit="contain"
        class="card-image"
    >
      <!-- 图片加载失败时的占位内容 -->
      <template #error>
        <div class="image-slot-placeholder">
          <span>图像加载失败</span>
        </div>
      </template>
      <!-- 图片加载中的占位内容 -->
      <template #placeholder>
        <div class="image-slot-placeholder">
          <span>加载中...</span>
        </div>
      </template>
    </el-image>
    <!-- 当没有图片URL时的占位内容 -->
    <div v-else class="image-slot-placeholder">
      <span>无图像数据</span>
    </div>
    <!-- 图像标签显示区域 -->
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
  background-color: transparent;
  color: white;
  padding: 5px;
  text-align: center;
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
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