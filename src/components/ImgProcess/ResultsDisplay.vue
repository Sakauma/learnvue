/*ResultsDisplay.vue*/
<template>
  <div class="cropped-result-container">
    <div class="image-box">
      <el-image
          v-if="croppedImageUrl"
          :src="croppedImageUrl"
          fit="contain"
          class="cropped-image"
          alt="感兴趣区域图像"
      >
        <template #error>
          <div class="image-error-slot">
            <span>无感兴趣区域图像</span>
          </div>
        </template>
        <template #placeholder>
          <div class="image-placeholder-slot">
            <span>加载中...</span>
          </div>
        </template>
      </el-image>
      <div v-else class="image-placeholder-small">无感兴趣区域图像</div>
      <div class="image-label">感兴趣区域图像</div>
    </div>
    <div class="image-box">
      <el-image
          v-if="resultImageUrl"
          :src="resultImageUrl"
          fit="contain"
          class="result-image"
          alt="结果图像"
      >
        <template #error>
          <div class="image-error-slot">
            <span>无结果图像</span>
          </div>
        </template>
        <template #placeholder>
          <div class="image-placeholder-slot">
            <span>加载中...</span>
          </div>
        </template>
      </el-image>
      <div v-else class="image-placeholder-small">无结果图像</div>
      <div class="image-label">结果图像</div>
    </div>
  </div>
  <div v-if="textResults && textResults.length > 0" class="text-results-container">
    <h4>识别结果文本:</h4>
    <ul>
      <li v-for="(item, index) in textResults" :key="index">
        <span v-if="item.label">{{ item.label }}: </span>{{ item.value || item }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ElImage } from 'element-plus';

defineProps({
  croppedImageUrl: String,
  resultImageUrl: String,
  textResults: Array,
});
</script>

<style scoped>
.cropped-result-container {
  width: 100%;
  margin-top: 5px;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  border: 1px solid rgb(56, 56, 56);
  background-color: rgb(27, 40, 56);
}

.image-box {
  width: 48%;
  height: 30vh;
  position: relative;
  background-color: rgb(56, 56, 56);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.cropped-image, .result-image {
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
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 5px;
  text-align: center;
  overflow: hidden;
  font-size: 0.8em;
}

.image-placeholder-small {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #aaa;
  font-size: 0.9rem;
  text-align: center;
  background-color: rgb(56, 56, 56);
}

.image-error-slot, .image-placeholder-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background-color: rgb(56, 56, 56);
  color: #888;
  font-size: 0.9rem;
  text-align: center;
}

.text-results-container {
  margin-top: 10px;
  margin-bottom: 20px;
  background-color: rgb(56, 56, 56);
  color: white;
  border-radius: 4px;
  padding: 10px;
}

.text-results-container h4 {
  margin-top: 0;
  margin-bottom: 8px;
}

.text-results-container ul {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 0;
}

.text-results-container li {
  margin-bottom: 4px;
}
</style>