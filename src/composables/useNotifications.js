import { reactive, readonly } from 'vue';

export function useNotifications() {
    const notificationState = reactive({
        show: false,
        message: '',
        timeoutId: null,
    });

    function showNotification(message, duration = 1500) {
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