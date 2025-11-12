import { ref, readonly, shallowRef, onUnmounted } from 'vue';

/**
 * 使用Server-Sent Events (SSE) 来接收自动模式数据更新的组合式函数
 * @returns {Object} - 包含数据、连接状态和相关操作函数的对象
 */
export function useSseAutoUpdate() {
    // 存储从后端收到的最新数据
    const latestData = shallowRef(null);
    const latestResult = shallowRef(null);
    const connectionStatus = ref('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
    const eventSource = shallowRef(null);
    let reconnectTimer = null;

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
        latestResult.value = null;
    };

    const connect = () => {
        if (eventSource.value || connectionStatus.value === 'connecting') return;

        connectionStatus.value = 'connecting';

        try {
            const fullSseUrl = '/sse/auto_updates';
            eventSource.value = new EventSource(fullSseUrl);

            eventSource.value.onopen = () => {
                connectionStatus.value = 'connected';
            };

            // 监听 'auto_update' 事件
            eventSource.value.addEventListener('auto_update', (event) => {
                try {
                    // 假设后端发送的是JSON字符串
                    const data = JSON.parse(event.data);
                    latestData.value = data; // 存储最新数据
                } catch (e) {
                    console.error('SSE auto_update: 解析JSON失败', e);
                    latestData.value = null; // 解析失败则清空
                }
            });

            eventSource.value.addEventListener('auto_mode_result', (event) => {
                try {
                    // 假设后端发送的是JSON字符串
                    const data = JSON.parse(event.data);
                    latestResult.value = data; // 存储最新结果
                } catch (e) {
                    console.error('SSE auto_mode_result: 解析JSON失败', e);
                    latestResult.value = null; // 解析失败则清空
                }
            });

            eventSource.value.onerror = () => {
                connectionStatus.value = 'error';
                if (eventSource.value) {
                    eventSource.value.close();
                    eventSource.value = null;
                }
                reconnectTimer = setTimeout(() => {
                    if (connectionStatus.value === 'error') connect();
                }, 3000);
            };

        } catch (error) {
            connectionStatus.value = 'error';
        }
    };
    onUnmounted(disconnect);

    return {
        latestData: readonly(latestData),
        latestResult: readonly(latestResult),
        connectionStatus: readonly(connectionStatus),
        connect,
        disconnect,
    };
}