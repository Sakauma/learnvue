import { ref } from 'vue';
import axios from 'axios';

/**
 * @description 管理全局配置的编辑、获取和保存。
 * @param {object} notifications - useNotifications 返回的通知服务实例。
 * @returns {object} - 返回配置编辑器所有相关的状态和方法。
 */
export function useConfigManager(notifications) {
    const isConfigEditorVisible = ref(false);
    const currentConfig = ref({
        region: { x: 0, y: 0, width: 0, height: 0 },
        algorithm: { lr: 0 },
    });

    /**
     * 打开配置编辑器，并从后端异步获取最新配置。
     */
    const openConfigEditor = async () => {
        try {
            const response = await axios.get('http://localhost:8081/api/config');
            currentConfig.value = response.data;
            console.log('从后端获取配置成功:', response.data);
            notifications.showNotification('✅ 获取配置成功', 2000);

            isConfigEditorVisible.value = true;
        } catch (error) {
            notifications.showNotification('❌ 获取配置失败', 2000);
            console.error("获取配置失败:", error);
            currentConfig.value = {
                region: { x: 0, y: 0, width: 0, height: 0 },
                algorithm: { lr: 0 },
            };
        }
    };

    /**
     * 将新配置保存到后端。
     * @param {object} newConfig - 从编辑器传来的新配置数据。
     */
    const handleSaveConfig = async (newConfig) => {
        try {
            await axios.post('http://localhost:8081/api/config', newConfig);
            console.log('新配置保存到后端成功:', newConfig);
            notifications.showNotification('✅ 配置保存成功', 2000);
            currentConfig.value = newConfig;
            isConfigEditorVisible.value = false;
        } catch (error) {
            notifications.showNotification('❌ 配置保存失败', 2000);
            console.error("保存配置失败:", error);
        }
    };

    return {
        isConfigEditorVisible,
        currentConfig,
        openConfigEditor,
        handleSaveConfig,
    };
}