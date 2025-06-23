/*IniConfigEditor.vue*/
<template>
  <el-dialog
      :model-value="visible"
      title="编辑配置"
      width="500px"
      @update:model-value="$emit('update:visible', $event)"
      :close-on-click-modal="false"
  >
    <el-form
        :model="formData"
        label-position="left"
        label-width="150px"
        ref="formRef"
        style="width: 100%;"
    >
      <el-form-item label="[Region]" class="form-section-header" />

      <el-form-item label="x" prop="region.x">
        <el-input-number v-model="formData.region.x" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="y" prop="region.y">
        <el-input-number v-model="formData.region.y" :min="0" controls-position="right" />
      </el-form-item>
      <el-form-item label="width" prop="region.width">
        <el-input-number v-model="formData.region.width" :min="1" controls-position="right" />
      </el-form-item>
      <el-form-item label="height" prop="region.height">
        <el-input-number v-model="formData.region.height" :min="1" controls-position="right" />
      </el-form-item>

      <el-form-item label="[ALGORITHM]" class="form-section-header" />

      <el-form-item label="Learning Rate (lr)" prop="algorithm.lr">
        <el-input-number v-model="formData.algorithm.lr" :precision="5" :step="0.00001" controls-position="right" />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>


<script setup>
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInputNumber, ElButton } from 'element-plus';

const props = defineProps({
  visible: Boolean,
  initialData: {
    type: Object,
    default: () => ({
      region: { x: 0, y: 0, width: 0, height: 0 },
      algorithm: { lr: 0 },
    }),
  },
});

const emit = defineEmits(['update:visible', 'save']);

const formData = ref({});

watch(() => props.initialData, (newData) => {
  formData.value = JSON.parse(JSON.stringify(newData));
}, { deep: true, immediate: true });

const handleSave = () => {
  emit('save', formData.value);
};
</script>

<style scoped>
.el-form-item {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.el-form-item :deep(.el-form-item__content) {
  flex-grow: 1;
}
.el-input-number {
  width: 100%;
}

.form-section-header {
  margin-bottom: 15px;
}
.form-section-header :deep(.el-form-item__label) {
  font-size: 1.05em;
  font-weight: 600;
  color: #606266;
}
</style>