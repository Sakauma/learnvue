/*ParameterSettingsDialog.vue*/
<template>
  <el-dialog
      :model-value="visible"
      title="参数设置"
      width="600px"
      @update:model-value="$emit('update:visible', $event)"
      :close-on-click-modal="false"
      @open="onDialogOpen"
  >
    <el-form :model="localSettings" label-position="right" label-width="120px">
      <el-form-item label="处理模式:">
        <el-select v-model="localSettings.selectedMode" placeholder="选择模式">
          <el-option label="单帧模式" value="singleFrame"></el-option>
          <el-option label="多帧模式" value="multiFrame"></el-option>
          <el-option label="轨迹模式" value="gjMode"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="算法选择:">
        <AlgorithmSelector
            v-model:algorithmType="localSettings.algorithmType"
            v-model:specificAlgorithm="localSettings.specificAlgorithm"
        />
      </el-form-item>

      <el-form-item label="卫星型号:">
        <div class="composite-select-group">
          <el-select
              v-model="localSettings.satelliteType"
              placeholder="选择星型"
              class="short-select"
              @change="onSatelliteTypeChange"
          >
            <el-option label="H星" value="H"></el-option>
            <el-option label="G星" value="G"></el-option>
          </el-select>

          <el-select
              v-model="localSettings.satelliteModel"
              placeholder="选择型号"
              class="short-select"
          >
            <el-option
                v-for="model in availableModels"
                :key="model.value"
                :label="model.label"
                :value="model.value"
            ></el-option>
          </el-select>
        </div>
      </el-form-item>

      <el-form-item label="段波类型:">
        <el-select v-model="localSettings.waveType" placeholder="选择段波类型" class="full-width-select">
          <el-option label="凝视短波" value="gazeShort"></el-option>
          <el-option label="凝视中波" value="gazeMid"></el-option>
          <el-option label="扫描短波" value="scanShort"></el-option>
          <el-option label="扫描中波" value="scanMid"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="轨迹条目:">
        <el-select v-model="localSettings.trajectoryEntry" placeholder="选择轨迹条目" class="full-width-select">
          <el-option label="1001" value="1001"></el-option>
          <el-option label="1002" value="1002"></el-option>
          <el-option label="1004" value="1004"></el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="图像尺寸:">
        <el-input-number v-model="localSettings.imageRows" :min="1" controls-position="right" placeholder="行数"></el-input-number>
        <span style="margin: 0 10px;">x</span>
        <el-input-number v-model="localSettings.imageCols" :min="1" controls-position="right" placeholder="列数"></el-input-number>
      </el-form-item>

      <el-form-item label="数据精度:">
        <el-select v-model="localSettings.selectedPrecision">
          <el-option label="64位浮点" value="float64" />
          <el-option label="32位浮点" value="float32" />
          <el-option label="16位整型" value="uint16" />
          <el-option label="8位整型" value="uint8" />
        </el-select>
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
import { ref, computed } from 'vue';
import { ElDialog, ElForm, ElFormItem, ElSelect, ElOption, ElInputNumber, ElButton } from 'element-plus';
import AlgorithmSelector from './AlgorithmSelector.vue';

const props = defineProps({
  visible: Boolean,
  settings: { type: Object, required: true },
});

const emit = defineEmits(['update:visible', 'save']);

const localSettings = ref({});

const satelliteModelOptions = {
  H: [
    { label: 'H03', value: 'H03' },
    { label: 'H04', value: 'H04' },
  ],
  G: [
    { label: 'G01', value: 'G01' },
    { label: 'G02', value: 'G02' },
    { label: 'G03', value: 'G03' },
  ],
};

const availableModels = computed(() => {
  const type = localSettings.value.satelliteType;
  return type ? satelliteModelOptions[type] : [];
});

function onSatelliteTypeChange(newType) {
  const models = satelliteModelOptions[newType];
  if (models && models.length > 0) {
    localSettings.value.satelliteModel = models[0].value;
  } else {
    localSettings.value.satelliteModel = '';
  }
}

function onDialogOpen() {
  localSettings.value = JSON.parse(JSON.stringify(props.settings));
}

function handleSave() {
  emit('save', localSettings.value);
  emit('update:visible', false);
}
</script>

<style scoped>
.el-form-item {
  display: flex;
  align-items: center;
  margin-bottom: 22px;
}
.el-select, .el-input-number {
  width: 180px;
}

.full-width-select {
  width: 100%;
}

.composite-select-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.composite-select-group .short-select {
  flex: 1;
  width: auto; /* 覆盖默认的180px，使其在flex中自由伸缩 */
}

.el-form-item :deep(.algorithm-selectors) {
  width: 100%;
}
.el-form-item :deep(.algorithm-selectors .algorithm-select),
.el-form-item :deep(.algorithm-selectors .specific-algorithm-select) {
  flex: 1;
  width: auto;
}
</style>