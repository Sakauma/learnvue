import { ref, readonly, shallowRef, onUnmounted } from 'vue';

export function useSseLogs(url) {
    const lastLog = shallowRef(null);
    const logs = ref([]);
    const connectionStatus = ref('disconnected');
    const connectionAttempts = ref(0);
    const eventSource = shallowRef(null);
    let reconnectTimer = null;

    let logIdCounter = 0;
    const logRegex = /^(?<timestamp>\d{2}:\d{2}:\d{2}\.\d{3})\s+\[(?<thread>[^\]]+)\]\s+(?<level>\w+)\s+(?<logger>[^\s-]+)\s+-\s+(?<message>.*)$/;
    const parseLog = (logString) => {
        logIdCounter++;
        const match = logString.match(logRegex);
        if (match && match.groups) {
            return { ...match.groups, raw: logString, id: logIdCounter };
        }
        return {
            timestamp: new Date().toLocaleTimeString('en-GB'),
            thread: '?', level: 'INFO', logger: 'RAW',
            message: logString, raw: logString, id: logIdCounter,
        };
    };

    const disconnect = () => {
        if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
        if (eventSource.value) { eventSource.value.close(); eventSource.value = null; }
        connectionStatus.value = 'disconnected';
    };

    const connect = () => {
        if (eventSource.value || connectionStatus.value === 'connecting') return;
        logs.value = []; // 开始新连接时自动清空日志
        connectionStatus.value = 'connecting';
        connectionAttempts.value++;
        try {
            eventSource.value = new EventSource(url);
            eventSource.value.onopen = () => {
                connectionStatus.value = 'connected';
                connectionAttempts.value = 0;
            };
            eventSource.value.addEventListener('log', (event) => {
                lastLog.value = { data: event.data, id: event.lastEventId };
                logs.value.push(parseLog(event.data));
            });
            eventSource.value.onerror = () => {
                connectionStatus.value = 'error';
                if (eventSource.value) { eventSource.value.close(); eventSource.value = null; }
                reconnectTimer = setTimeout(() => { if (connectionStatus.value === 'error') connect(); }, 3000);
            };
        } catch (error) {
            connectionStatus.value = 'error';
        }
    };

    const clearLogs = () => {
        logs.value = [];
    };

    onUnmounted(disconnect);

    return {
        logs: readonly(logs),
        connectionStatus: readonly(connectionStatus),
        connectionAttempts: readonly(connectionAttempts),
        connect,
        disconnect,
        clearLogs,
    };
}