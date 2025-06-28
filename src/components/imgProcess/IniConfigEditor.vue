/*IniConfigEditor.vue*/
<template>
  <!-- 对话框组件，用于编辑配置 -->
  <el-dialog
      :model-value="visible"
      title="编辑配置"
      width="500px"
      @update:model-value="$emit('update:visible',$event)"
      :close-on-click-modal="false"
  >
    <!-- 表单组件，用于收集用户输入的数据 -->
    <el-form
        :model="formData"
        label-position="left"
        label-width="150px"
        ref="formRef"
        style="width: 100%;"
    >
      <!-- 表单项，用于分隔区域 -->
      <el-form-item label="[Region]" class="form-section-header" />

      <!-- 表单项，用于输入x坐标 -->
      <el-form-item label="x" prop="region.x">
        <el-input-number v-model="formData.region.x" :min="0" controls-position="right" />
      </el-form-item>
      <!-- 表单项，用于输入y坐标 -->
      <el-form-item label="y" prop="region.y">
        <el-input-number v-model="formData.region.y" :min="0" controls-position="right" />
      </el-form-item>
      <!-- 表单项，用于输入宽度 -->
      <el-form-item label="width" prop="region.width">
        <el-input-number v-model="formData.region.width" :min="1" controls-position="right" />
      </el-form-item>
      <!-- 表单项，用于输入高度 -->
      <el-form-item label="height" prop="region.height">
        <el-input-number v-model="formData.region.height" :min="1" controls-position="right" />
      </el-form-item>

      <!-- 表单项，用于分隔算法部分 -->
      <el-form-item label="[ALGORITHM]" class="form-section-header" />

      <!-- 表单项，用于输入学习率 -->
      <el-form-item label="Learning Rate (lr)" prop="algorithm.lr">
        <el-input-number v-model="formData.algorithm.lr" :precision="5" :step="0.00001" controls-position="right" />
      </el-form-item>
    </el-form>

    <!-- 对话框底部 -->
    <template #footer>
      <span class="dialog-footer">
        <!-- 取消按钮，点击后关闭对话框 -->
        <el-button @click="$emit('update:visible', false)">取消</el-button>
        <!-- 保存按钮，点击后触发保存操作 -->
        <el-button type="primary" @click="handleSave">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>


<script setup>
import { ref, watch } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElInputNumber, ElButton } from 'element-plus';

// 定义组件的props
const props = defineProps({
  visible: Boolean,  // 控制对话框显示/隐藏的布尔值
  initialData: {     // 初始数据对象
    type: Object,
    default: () => ({
      region: { x: 0, y: 0, width: 0, height: 0 },  // 区域初始数据
      algorithm: { lr: 0 },                         // 算法初始数据
    }),
  },
});

// 定义组件的emit事件
const emit = defineEmits(['update:visible', 'save']);

// 表单数据响应式引用
const formData = ref({});

// 监听initialData的变化，并深度拷贝到formData
watch(() => props.initialData, (newData) => {
  formData.value = JSON.parse(JSON.stringify(newData));
}, { deep: true, immediate: true });

// 保存按钮点击处理函数
const handleSave = () => {
  emit('save', formData.value);  // 触发save事件，传递表单数据
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