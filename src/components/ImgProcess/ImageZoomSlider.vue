/*ImageZoomSlider.vue*/
<template>
  <div class="slider-input-container">
    <el-slider
        :model-value="modelValue"
        @update:modelValue="$emit('update:modelValue', $event)"
        @input="$emit('input', $event)"
        :min="20"
        :max="300"
        class="custom-slider"
    ></el-slider>
    <span class="zoom-percentage">{{ modelValue }}%</span>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { // for v-model
    type: Number,
    default: 100,
  },
});
defineEmits(['update:modelValue', 'input']);
</script>

<style scoped>
.slider-input-container {
  width: 100%;
  margin-top: 5px;
  display: flex;
  align-items: center;
}
.custom-slider {
  flex: 1;
  margin-right: 10px;
}
.zoom-percentage {
  margin-left: 10px;
  font-size: 1em;
  color: white;
}
</style>