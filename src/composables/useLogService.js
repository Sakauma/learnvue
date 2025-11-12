import { ref, readonly } from 'vue';

// 1. 在函数外部创建状态，使其成为全局单例
const logs = ref([]);
let logIdCounter = 0;

// 2. 正则表达式，用于解析后端日志格式
const logRegex = /^(?<timestamp>\d{2}:\d{2}:\d{2}\.\d{3})\s+\[(?<thread>[^\]]+)\]\s+(?<level>\w+)\s+(?<logger>[^\s-]+)\s+-\s+(?<message>.*)$/;

/**
 * @description 向全局日志数组中添加一条新日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别 (INFO, WARN, ERROR)
 * @param {string} source - 日志来源 (Frontend, Backend)
 */
const addLog = (message, level = 'INFO', source = 'Frontend') => {
    logIdCounter++;
    const rawMessage = String(message); // 确保是字符串

    // 尝试解析后端格式
    const match = rawMessage.match(logRegex);

    if (match && match.groups) {
        // 如果是后端日志，直接使用解析后的结构
        logs.value.push({ ...match.groups, raw: rawMessage, id: logIdCounter });
    } else {
        // 如果是前端日志，手动构建结构
        logs.value.push({
            timestamp: new Date().toLocaleTimeString('en-GB', { hour12: false }).substring(0, 8),
            thread: source,
            level: level.toUpperCase(),
            logger: 'App', // 前端日志统一使用 'App'
            message: rawMessage,
            raw: rawMessage,
            id: logIdCounter,
        });
    }
};

/**
 * @description 清空所有日志
 */
const clearLogs = () => {
    logs.value = [];
};

// 3. 导出一个包含状态和方法的单例对象
export const logService = {
    logs: readonly(logs), // 只读状态
    addLog,
    clearLogs,
};