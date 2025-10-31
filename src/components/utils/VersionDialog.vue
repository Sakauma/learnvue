/*VersionDialog.vue*/
<template>
  <el-dialog
      :model-value="visible"
      title="关于软件"
      width="400px"
      @update:model-value="$emit('update:visible', $event)"
      center
  >
    <div class="version-info">
      <h3>XJYTXFX 软件</h3>
      <p>版本: 0.1.0 (Build 20250925)</p>
      <p>版权所有 © 2025</p>
    </div>
    <template #footer>
      <el-button type="primary" @click="$emit('update:visible', false)">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElDialog, ElButton } from 'element-plus';

defineProps({
  visible: Boolean,
});

defineEmits(['update:visible']);
</script>

<style scoped>
.version-info {
  text-align: center;
  padding: 10px 0;
}
.version-info h3 {
  margin-top: 0;
}
</style>