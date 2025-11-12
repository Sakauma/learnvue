import { ref, readonly, shallowRef, onUnmounted } from 'vue';
import { logService } from './useLogService.js';

/**
 * 使用Server-Sent Events (SSE) 来接收和显示日志消息的组合式函数
 * @param {string} url - SSE端点的URL
 * @returns {Object} - 包含日志数据、连接状态和相关操作函数的对象
 */
export function useSseLogs(url) {
    const lastLog = shallowRef(null);
    //const logs = ref([]);
    const connectionStatus = ref('disconnected');
    const connectionAttempts = ref(0);
    const eventSource = shallowRef(null);
    const hasEverConnected = ref(false);
    let reconnectTimer = null;

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
        hasEverConnected.value = false;
        connectionStatus.value = 'disconnected';
    };

    /**
     * 连接到SSE服务器
     */
    const connect = () => {
        // 如果已经连接或正在连接，则不再重复连接
        if (eventSource.value || connectionStatus.value === 'connecting') return;

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
                hasEverConnected.value = true;
                connectionAttempts.value = 0;
            };

            // 监听自定义的'log'事件（假设服务器发送该事件）
            eventSource.value.addEventListener('log', (event) => {
                lastLog.value = { data: event.data, id: event.lastEventId };
                //logs.value.push(parseLog(event.data));
                logService.addLog(event.data, 'INFO', 'Backend');
            });

            // 监听错误事件
            eventSource.value.onerror = () => {
                if (!hasEverConnected.value) {
                    connectionStatus.value = 'error';
                }
                logService.addLog('日志服务连接错误，3秒后尝试重连...', 'ERROR', 'System');
                // 关闭并清理EventSource连接
                if (eventSource.value) {
                    eventSource.value.close();
                    eventSource.value = null;
                }
                // 设置一个定时器，3秒后尝试重新连接
                reconnectTimer = setTimeout(() => {
                    if (connectionStatus.value === 'error' || hasEverConnected.value) {
                        connect();
                    }
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
        // logs.value = [];
        logService.clearLogs(); // <-- 调用 LogService 的 clearLogs
        logService.addLog('日志已清空', 'WARN', 'System');
    };

    // 组件卸载时自动断开连接，防止内存泄漏
    onUnmounted(disconnect);

    // 返回一个对象，包含只读的响应式数据和可调用的函数
    // 使用readonly确保外部无法直接修改返回的ref值
    return {
        //logs: readonly(logs),               // 日志数组（只读）
        connectionStatus: readonly(connectionStatus), // 连接状态
        connectionAttempts: readonly(connectionAttempts), // 连接尝试次数
        connect,                            // 连接函数
        disconnect,                         // 断开连接函数
        clearLogs,                          // 清空日志函数
    };
}