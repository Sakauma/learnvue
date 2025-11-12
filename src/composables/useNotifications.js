import { reactive, readonly } from 'vue';
import { logService } from './useLogService.js';

export function useNotifications() {
    /**
     * 显示一个通知 (现在重定向到日志服务)
     * @param {string} message - 要显示的消息
     * @param {number} duration - (此参数被忽略)
     * @param {string} level - (可选) 日志级别
     */
    function showNotification(message, duration = 1500, level = 'INFO') {
        // 自动检测级别
        let logLevel = level;
        if (message.includes('❌') || message.includes('失败') || message.includes('错误')) {
            logLevel = 'ERROR';
        } else if (message.includes('⚠️') || message.includes('警告')) {
            logLevel = 'WARN';
        } else if (message.includes('✅') || message.includes('成功')) {
            logLevel = 'INFO';
        }

        // 调用 logService
        logService.addLog(message, logLevel, 'Frontend');
    }

    return {
        // 保持返回一个空状态，以防止使用此状态的组件 (AppNotification) 报错
        notificationState: readonly({ show: false, message: '' }),
        showNotification,
    };
}