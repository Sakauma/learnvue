import { reactive, readonly } from 'vue';

const notificationState = reactive({
    show: false,
    message: '',
    timeoutId: null,
});

export function useNotifications() {
    /**
     * 显示一个通知
     * @param {string} message - 要显示的消息
     * @param {number} duration - 显示时长 (毫秒)
     */
    function showNotification(message, duration = 1500) {
        // 操作的是全局单例 state
        notificationState.message = message;
        notificationState.show = true;

        if (notificationState.timeoutId) {
            clearTimeout(notificationState.timeoutId);
        }

        notificationState.timeoutId = setTimeout(() => {
            notificationState.show = false;
            notificationState.message = '';
        }, duration);
    }

    return {
        notificationState: readonly(notificationState),
        showNotification,
    };
}