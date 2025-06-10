/*AlgorithmReport.vue*/
<template>
  <div class="report-container">
    <div class="head">
      <span>算法运行报告</span>
    </div>
    <div class="report-display-container">
      <el-scrollbar>
        <div class="report-display">
          <div v-if="reports.length === 0" class="empty-report">
            等待算法运行...
          </div>
          <div
              v-for="(report, index) in reports"
              :key="index"
              class="report-entry"
          >
            <span>{{ report }}</span>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { ElScrollbar } from 'element-plus';

const props = defineProps({
  logs: {
    type: Array,
    required: true,
  },
});

const reports = ref([]);

watch(() => props.logs.length, (newLength, oldLength) => {
  oldLength = oldLength || 0;

  if (newLength > oldLength) {
    const newItems = props.logs.slice(oldLength);

    newItems.forEach(log => {
      const message = log.message;
      let reportMessage = '';

      if (message.includes("调用C++ processImageWrapper (单帧模式)")) {
        reportMessage = `[${log.timestamp}] 单帧处理算法启动`;
      } else if (message.includes("C++ (单帧) 处理成功")) {
        reportMessage = `[${log.timestamp}] 单帧处理算法结束`;
      } else if (message.includes("调用C++ processImageWrapper (多帧模式)")) {
        reportMessage = `[${log.timestamp}] 多帧处理算法启动`;
      } else if (message.includes("C++ (多帧) 处理成功")) {
        reportMessage = `[${log.timestamp}] 多帧处理算法结束`;
      }

      if (reportMessage) {
        reports.value.push(reportMessage);
      }
    });
  }
});

const clearReports = () => {
  reports.value = [];
};

defineExpose({
  clearReports,
});

</script>

<style scoped>
.report-container {
  font-family: "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
  background-color: rgb(56, 56, 56);
  border: 1px solid rgb(80, 80, 80);
  border-radius: 6px;
  color: #d4d4d4;
  font-size: 14px;
  padding: 10px;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-height: 260px;
}

.head {
  color: #cce7ff;
  font-weight: bold;
  padding-bottom: 10px;
  margin-bottom: 10px;
  border-bottom: 1px solid rgb(80, 80, 80);
  flex-shrink: 0;
  text-align: center;
}

.report-display-container {
  flex: 1;
  position: relative;
  background-color: #1e1e1e;
  border-radius: 4px;
  max-height: 200px;
}

.el-scrollbar {
  height: 100%;
}

.report-display {
  padding: 0.5rem;
  box-sizing: border-box;
  min-height: 0;
}

.empty-report {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.report-entry {
  padding: 4px 2px;
  line-height: 1.5;
  color: #9cdcfe;
}

.report-entry:not(:last-child) {
  border-bottom: 1px solid #2d2d2d;
}
</style>