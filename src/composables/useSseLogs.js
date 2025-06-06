import { ref, readonly, shallowRef, onUnmounted } from 'vue';

export function useSseLogs(url) {
    // state
    const lastLog = shallowRef(null); // 使用 shallowRef 优化，只关心顶层替换
    const connectionStatus = ref('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
    const connectionAttempts = ref(0);
    const eventSource = shallowRef(null);

    let reconnectTimer = null;

    // actions
    const disconnect = () => {
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (eventSource.value) {
            eventSource.value.close();
            eventSource.value = null;
        }
        connectionStatus.value = 'disconnected';
        console.log('SSE connection closed by client.');
    };

    const connect = () => {
        if (eventSource.value || connectionStatus.value === 'connecting') {
            return; // 防止重复连接
        }

        connectionStatus.value = 'connecting';
        connectionAttempts.value++;

        try {
            eventSource.value = new EventSource(url);

            eventSource.value.onopen = () => {
                console.log('SSE connection opened successfully.');
                connectionStatus.value = 'connected';
                connectionAttempts.value = 0; // 连接成功后重置尝试次数
            };

            eventSource.value.addEventListener('log', (event) => {
                // 当收到 'log' 事件时，更新 lastLog 的值
                lastLog.value = { data: event.data, id: event.lastEventId };
            });

            eventSource.value.onerror = (error) => {
                console.error('SSE connection error:', error);
                connectionStatus.value = 'error';

                // 关闭当前可能损坏的连接
                if (eventSource.value) {
                    eventSource.value.close();
                    eventSource.value = null;
                }

                // 3秒后尝试重连
                reconnectTimer = setTimeout(() => {
                    // 检查状态，如果用户在此期间手动断开，则不重连
                    if (connectionStatus.value === 'error') {
                        connect();
                    }
                }, 3000);
            };

        } catch (error) {
            console.error('Failed to create EventSource instance:', error);
            connectionStatus.value = 'error';
        }
    };

    // 在组件卸载时自动断开连接，防止内存泄漏
    onUnmounted(disconnect);

    // 返回只读的状态和可调用的方法
    return {
        lastLog: readonly(lastLog),
        connectionStatus: readonly(connectionStatus),
        connectionAttempts: readonly(connectionAttempts),
        connect,
        disconnect,
    };
}