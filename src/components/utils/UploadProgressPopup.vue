<template>
  <el-dialog
      :model-value="visible"
      title="正在上传文件"
      width="40%"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      center
      class="progress-dialog"
  >
    <div class="progress-content">
      <p>正在处理并上传文件到服务器，请稍候...</p>

      <el-progress
          :percentage="progress"
          :stroke-width="15"
          striped
          striped-flow
          :duration="10"
          status="success"
      >
        <span>{{ progress }}%</span>
      </el-progress>

      <p v-if="progress < 100" class="tip">
        数据量较大时，上传过程可能需要一些时间。
      </p>
      <p v-else class="tip">
        上传完成！等待后端处理...
      </p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ElDialog, ElProgress } from 'element-plus';

// 定义组件的 props
defineProps({
  // 控制弹窗是否可见
  visible: {
    type: Boolean,
    required: true,
  },
  // 进度百分比 (0-100)
  progress: {
    type: Number,
    required: true,
  },
});
</script>

<style scoped>
.progress-dialog :deep(.el-dialog__header) {
  padding-bottom: 10px;
  margin-right: 0;
  border-bottom: 1px solid #444;
}

.progress-dialog :deep(.el-dialog__title) {
  color: #e0e0e0;
  font-weight: bold;
}

.progress-dialog :deep(.el-dialog__body) {
  padding: 25px 30px;
}

.progress-content {
  text-align: center;
  color: #cccccc;
}

.progress-content p {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 15px;
}

.el-progress {
  margin-bottom: 20px;
}

.tip {
  font-size: 13px;
  color: #999999;
}
</style>