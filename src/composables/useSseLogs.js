import { ref, readonly, shallowRef, onUnmounted } from 'vue';

/**
 * 使用Server-Sent Events (SSE) 来接收和显示日志消息的组合式函数
 * @param {string} url - SSE端点的URL
 * @returns {Object} - 包含日志数据、连接状态和相关操作函数的对象
 */
export function useSseLogs(url) {
    const lastLog = shallowRef(null);
    const logs = ref([]);
    const connectionStatus = ref('disconnected');
    const connectionAttempts = ref(0);
    const eventSource = shallowRef(null);
    let reconnectTimer = null;

    let logIdCounter = 0;
    // 定义用于解析日志字符串的正则表达式
    const logRegex = /^(?<timestamp>\d{2}:\d{2}:\d{2}\.\d{3})\s+\[(?<thread>[^\]]+)\]\s+(?<level>\w+)\s+(?<logger>[^\s-]+)\s+-\s+(?<message>.*)$/;

    /**
     * 解析日志字符串，提取结构化信息
     * @param {string} logString - 原始日志字符串
     * @returns {Object} - 解析后的日志对象，包含时间戳、线程、级别、记录器、消息等
     */
    const parseLog = (logString) => {
        logIdCounter++;
        // 尝试使用正则表达式匹配日志字符串
        const match = logString.match(logRegex);
        if (match && match.groups) {
            // 如果匹配成功，返回带有命名捕获组结果的对象，并添加原始字符串和ID
            return { ...match.groups, raw: logString, id: logIdCounter };
        }
        // 如果匹配失败，返回一个带有默认值的对象
        return {
            timestamp: new Date().toLocaleTimeString('en-GB'), // 使用当前时间作为时间戳
            thread: '?', level: 'INFO', logger: 'RAW',        // 使用默认值
            message: logString, raw: logString, id: logIdCounter,
        };
    };

    /**
     * 断开与SSE服务器的连接
     */
    const disconnect = () => {
        // 清除可能存在的重连定时器
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        // 关闭EventSource连接（如果存在）
        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
        }
        // 更新连接状态为断开
        connectionStatus.value = 'disconnected';
    };

    /**
     * 连接到SSE服务器
     */
    const connect = () => {
        // 如果已经连接或正在连接，则不再重复连接
        if (eventSource.value || connectionStatus.value === 'connecting') return;

        // 开始新连接时，清空现有日志
        logs.value = [];
        // 更新连接状态为连接中
        connectionStatus.value = 'connecting';
        // 增加连接尝试次数
        connectionAttempts.value++;

        try {
            // 创建新的EventSource实例
            eventSource.value = new EventSource(url);

            // 监听连接成功事件
            eventSource.value.onopen = () => {
                connectionStatus.value = 'connected';
                connectionAttempts.value = 0;
            };

            // 监听自定义的'log'事件（假设服务器发送该事件）
            eventSource.value.addEventListener('log', (event) => {
                lastLog.value = { data: event.data, id: event.lastEventId };
                logs.value.push(parseLog(event.data));
            });

            // 监听错误事件
            eventSource.value.onerror = () => {
                connectionStatus.value = 'error';
                // 关闭并清理EventSource连接
                if (eventSource.value) {
                    eventSource.value.close();
                    eventSource.value = null;
                }
                // 设置一个定时器，3秒后尝试重新连接（如果状态仍然是错误）
                reconnectTimer = setTimeout(() => {
                    if (connectionStatus.value === 'error') connect();
                }, 3000);
            };
        } catch (error) {
            // 如果创建EventSource失败，更新连接状态为错误
            connectionStatus.value = 'error';
        }
    };

    /**
     * 清空日志数组
     */
    const clearLogs = () => {
        logs.value = [];
    };

    // 组件卸载时自动断开连接，防止内存泄漏
    onUnmounted(disconnect);

    // 返回一个对象，包含只读的响应式数据和可调用的函数
    // 使用readonly确保外部无法直接修改返回的ref值
    return {
        logs: readonly(logs),               // 日志数组（只读）
        connectionStatus: readonly(connectionStatus), // 连接状态
        connectionAttempts: readonly(connectionAttempts), // 连接尝试次数
        connect,                            // 连接函数
        disconnect,                         // 断开连接函数
        clearLogs,                          // 清空日志函数
    };
}