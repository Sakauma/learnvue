/*AlgorithmReport.vue*/
<template>
  <div class="report-container">
    <!-- 头部标题区域，显示"算法运行状态" -->
    <div class="head">
      <span>算法运行状态</span>
    </div>
    <!-- 报告显示容器，包含滚动条 -->
    <div class="report-display-container">
      <el-scrollbar>
        <!-- 报告内容区域 -->
        <div class="report-display">
          <!-- 当没有报告时显示的提示信息 -->
          <div v-if="reports.length === 0" class="empty-report">
            等待算法运行...
          </div>
          <!-- 遍历 reports 数组，动态生成报告条目 -->
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

// 定义 props，接收 logs 数组
const props = defineProps({
  logs: {
    type: Array,
    required: true,
  },
});

// 使用 ref 创建 reports 数组，存储处理后的报告
const reports = ref([]);

// 监听 logs 数组长度变化
watch(() => props.logs.length, (newLength, oldLength) => {
  oldLength = oldLength || 0; // 确保 oldLength 不为 undefined

  // 如果新长度大于旧长度，说明有新日志
  if (newLength > oldLength) {
    const newItems = props.logs.slice(oldLength); // 获取新增的日志项

    newItems.forEach(log => {
      const message = log.message;
      let reportMessage = '';

      // 根据日志消息内容生成对应的报告消息
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

// 清空报告的方法
const clearReports = () => {
  reports.value = [];
};

// 暴露 clearReports 方法，供外部调用
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