/*BackendLogs.vue*/
<template>
  <!-- 日志容器 -->
  <div class="log-container">
    <!-- 连接状态显示区域 -->
    <div class="connection-status" :class="connectionStatusClass">
      {{ connectionStatusText }}
      <!-- 显示最后一条日志的时间 -->
      <span v-if="lastLogTime">最后日志: {{ lastLogTime }}</span>
    </div>

    <!-- 控制区域 -->
    <div class="controls">
      <!-- 控制组 -->
      <div class="control-group">
        <!-- 切换连接状态的按钮 -->
        <button @click="toggleConnection">
          {{ isConnected ? '停止接收' : '开始接收' }}日志
        </button>
        <!-- 清空日志的按钮 -->
        <button @click="clearLogs">清空日志</button>
        <!-- 自动滚动复选框 -->
        <label class="checkbox-label">
          <input type="checkbox" v-model="autoScroll" />
          自动滚动
        </label>
      </div>
      <!-- 过滤控制组 -->
      <div class="control-group filter-group">
        <!-- 关键词过滤输入框 -->
        <input class="filter-input" type="text" v-model="filterKeyword" placeholder="按关键字过滤..." />
        <!-- 日志级别过滤复选框组 -->
        <div class="level-filters">
          <label v-for="(enabled, level) in filterLevels" :key="level" :class="['level-label', 'log-' + level.toLowerCase()]">
            <input type="checkbox" v-model="filterLevels[level]" /> {{ level }}
          </label>
        </div>
      </div>
    </div>

    <!-- 日志显示区域 -->
    <div ref="logDisplay" class="log-display">
      <!-- 过滤后的日志列表 -->
      <div v-if="filteredLogs.length > 0">
        <div
            v-for="log in filteredLogs"
            :key="log.id"
            :class="['log-entry', logLevelClass(log)]"
        >
          <!-- 日志时间戳 -->
          <span class="timestamp">{{ log.timestamp }}</span>
          <!-- 日志级别 -->
          <span class="level">{{ log.level }}</span>
          <!-- 日志内容 -->
          <span class="message">{{ log.message }}</span>
        </div>
      </div>
      <!-- 空日志提示 -->
      <div v-else class="empty-logs">
        {{ emptyMessage }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, computed, watch } from 'vue';

// 定义组件的props，接收父组件传递的日志数据、连接状态和连接尝试次数
const props = defineProps({
  logs: {  // 日志数组
    type: Array,
    required: true,
  },
  connectionStatus: {  // 连接状态
    type: String,
    required: true,
  },
  connectionAttempts: {  // 连接尝试次数
    type: Number,
    required: true,
  }
});

// 定义组件的emit，用于向父组件发送事件
const emit = defineEmits(['toggle-connection', 'clear-logs']);

// 定义响应式变量
const autoScroll = ref(true);  // 是否自动滚动到底部
const logDisplay = ref(null);  // 日志显示区域的DOM引用
const filterKeyword = ref('');  // 日志过滤关键词
const filterLevels = ref({  // 日志级别过滤设置
  'ERROR': true,
  'WARN': true,
  'INFO': true,
  'DEBUG': false,
  'TRACE': false,
});

// 计算属性：是否已连接（连接中或已连接）
const isConnected = computed(() =>
    ['connecting', 'connected'].includes(props.connectionStatus)
);

// 计算属性：获取最后一条日志的时间戳
const lastLogTime = computed(() => {
  if (props.logs && props.logs.length > 0) {
    const lastLog = props.logs[props.logs.length - 1];
    if (lastLog && typeof lastLog.timestamp === 'string') {
      return lastLog.timestamp.substring(0, 8);  // 提取前8个字符作为日期
    }
  }
  return null;
});

// 计算属性：过滤后的日志列表
const filteredLogs = computed(() => {
  return props.logs.filter(log => {
    const levelMatch = filterLevels.value[log.level];  // 检查日志级别是否匹配
    const keywordMatch = filterKeyword.value  // 检查日志内容是否包含关键词
        ? log.raw.toLowerCase().includes(filterKeyword.value.toLowerCase())
        : true;
    return levelMatch && keywordMatch;  // 返回同时满足级别和关键词的日志
  });
});

// 计算属性：空日志提示消息
const emptyMessage = computed(() => {
  if (props.logs.length > 0 && filteredLogs.value.length === 0)
    return '没有匹配过滤条件的日志';
  if (props.connectionStatus === 'connected')
    return '已连接 - 等待日志数据...';
  if (props.connectionStatus === 'connecting')
    return '正在连接到日志服务...';
  return '未连接，点击"开始接收日志"连接服务';
});

// 计算属性：连接状态文本
const connectionStatusText = computed(() => {
  switch (props.connectionStatus) {
    case 'disconnected': return '未连接';
    case 'connecting': return `连接中... (尝试第 ${props.connectionAttempts} 次)`;
    case 'connected': return '已连接';
    case 'error': return '连接错误 - 3秒后尝试重连...';
    default: return '未知状态';
  }
});

// 计算属性：连接状态对应的CSS类名
const connectionStatusClass = computed(() => `status-${props.connectionStatus}`);

// 方法：根据日志级别返回对应的CSS类名
const logLevelClass = (logObject) => `log-${logObject.level.toLowerCase()}`;

// 监听过滤后日志数量的变化，自动滚动到底部
watch(
    () => filteredLogs.value.length,  // 监听过滤后日志数量
    () => {
      if (autoScroll.value) {
        nextTick(() => {  // 确保DOM更新后执行
          const display = logDisplay.value;
          if (display) {
            display.scrollTo({ top: display.scrollHeight, behavior: 'smooth' });  // 平滑滚动到底部
          }
        });
      }
    }
);

// 方法：切换连接状态
const toggleConnection = () => {
  emit('toggle-connection');  // 触发父组件的toggle-connection事件
};

// 方法：清空日志
const clearLogs = () => {
  emit('clear-logs');  // 触发父组件的clear-logs事件
};

</script>

<style scoped>
.log-container {
  font-family: "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
  background-color: #1e1e1e;
  color: #d4d4d4;
  font-size: 14px;
  overflow: hidden;
  border-radius: 4px;
  height: 100%;
  width: 100%;
}

.connection-status {
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}
.status-disconnected { background-color: #6c757d; }
.status-connecting { background-color: #ffc107; color: #000; }
.status-connected { background-color: #198754; }
.status-error { background-color: #dc3545; }

.controls {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #1e1e1e;
  border-radius: 4px;
  flex-shrink: 0;
}
.control-group {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
}
button {
  background-color: #3a3a3a;
  color: #d4d4d4;
  border: 1px solid #555;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 13px;
  font-weight: bold;
}
button:hover { background-color: #4a4a4a; }
.checkbox-label, .level-label { cursor: pointer; user-select: none; display: flex; align-items: center; gap: 0.3rem; font-weight: bold;}
.filter-input {
  background-color: #3c3c3c;
  border: 1px solid #555;
  color: #d4d4d4;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
  flex-grow: 1;
}

.level-filters { display: flex; gap: 0.75rem; }
.level-label { font-weight: bold; padding: 2px 4px; border-radius: 3px; }
.log-error { color: #f48771; }
.log-warn { color: #e5c07b; }
.log-info { color: #56b6c2; }
.log-debug { color: #c678dd; }
.log-trace { color: #7f848e; }

.log-display {
  flex: 1;
  overflow: auto;
  background-color: #1e1e1e;
  border: 1px solid #1e1e1e;
  border-radius: 4px;
  padding: 0.5rem;
  min-height: 0;
  max-height: 500px;
}
.empty-logs {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 2rem;
}

.log-entry {
  display: flex;
  gap: 1rem;
  line-height: 1.4;
  padding: 2px 0;
}
.log-entry:not(:last-child) {
  border-bottom: 1px solid #2d2d2d;
}
.log-entry > span { white-space: pre; }
.timestamp { color: #6a9955; width: 90px; text-align: left; flex-shrink: 0; }
.thread { color: #569cd6; min-width: 150px; }
.level { font-weight: bold; width: 55px; text-align: left; flex-shrink: 0;}
.logger { color: #9cdcfe; min-width: 200px; max-width: 350px; overflow: hidden; text-overflow: ellipsis; }
.message { flex: 1; white-space: pre-wrap; word-break: break-all; text-align: left; }
</style>