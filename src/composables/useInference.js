import { ref } from 'vue';
import axios from 'axios';

// 设置axios的默认基础URL为'api'
axios.defaults.baseURL = 'api';

/**
 * 提供识别功能的组合式函数
 * @param {Function} showNotificationCallback - 用于显示通知的回调函数
 * @returns {Object} - 包含识别状态和方法的响应式对象
 */
export function useInference(showNotificationCallback) {
    // 响应式变量：表示当前是否正在加载
    const isLoading = ref(false);
    // 响应式变量：存储处理后的图像URL（Base64格式）
    const resultImageUrl = ref(null);
    // 响应式变量：存储文本结果数组
    const textResults = ref([]);

    /**
     * 执行文件识别操作
     * @param {File} file - 要识别的文件对象
     * @param {string} fileMD5 - 文件的MD5哈希值
     * @param {string} algorithm - 使用的算法名称
     * @param {number} rows - 行数（可选）
     * @param {number} cols - 列数（可选）
     * @param {Object} cropData - 裁剪数据（可选）
     * @returns {Promise<Object>} - 返回包含识别结果的对象
     */
    async function performInference(file, fileMD5, algorithm, rows, cols, cropData = null) {
        // 检查必要参数是否存在
        if (!file || !algorithm) {
            showNotificationCallback('请选择图像和算法后再进行识别。');
            return { success: false, error: 'Missing file or algorithm', newChartValues: null };
        }

        // 开始加载状态
        isLoading.value = true;
        // 重置结果
        resultImageUrl.value = null;
        textResults.value = [];
        // 显示开始识别的通知
        showNotificationCallback(`🚧 正在使用 ${algorithm} 进行识别`);

        // 创建FormData对象用于发送表单数据
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileMD5', fileMD5);
        formData.append('algorithm', algorithm);
        formData.append('rows', String(rows));
        formData.append('cols', String(cols));
        // 如果有裁剪数据，添加到表单中
        if (cropData) {
            formData.append('cropData', JSON.stringify(cropData));
        }

        try {
            // 发送POST请求到/infer端点
            const response = await axios.post('/infer', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // 处理成功响应
            if (response.data.processedImage) {
                // 设置处理后的图像URL
                resultImageUrl.value = `data:image/png;base64,${response.data.processedImage}`;
            }

            // 准备文本结果
            const tempTextResults = [];
            if (response.data.algorithm) {
                tempTextResults.push({ label: '算法名称', value: response.data.algorithm });
            }
            if (response.data.timestamp) {
                tempTextResults.push({ label: '时间戳', value: response.data.timestamp });
            }
            if (response.data.message) {
                tempTextResults.push({ label: '消息', value: response.data.message });
            }
            // 更新文本结果
            textResults.value = tempTextResults;

            // 提取图表Y轴值
            let newChartYValues = null;
            if (response.data && response.data.result && Array.isArray(response.data.result)) {
                if (response.data.result.length > 0) {
                    newChartYValues = response.data.result;
                }
            }

            // 显示成功通知
            showNotificationCallback(response.data.message || '✅ 识别成功！');
            return { success: true, data: response.data, newChartValues: newChartYValues };
        } catch (error) {
            // 处理错误
            console.error('识别请求失败:', error);
            let errorMessage = '❌ 识别失败，请检查网络或联系管理员。';
            if (error.response?.data?.error) {
                errorMessage = `❌ 识别失败: ${error.response.data.error}`;
            } else if (error.message) {
                errorMessage = `❌ 识别失败: ${error.message}`;
            }
            showNotificationCallback(errorMessage);
            return { success: false, error: errorMessage, newChartValues: null };
        } finally {
            // 无论成功或失败，都结束加载状态
            isLoading.value = false;
        }
    }

    /**
     * 执行文件夹路径识别操作
     * @param {string} folderPath - 要识别的文件夹路径
     * @param {string} algorithm - 使用的算法名称
     * @returns {Promise<Object>} - 返回包含识别结果的对象
     */
    async function performFolderPathInference(folderPath, algorithm) {
        // 检查必要参数是否存在
        if (!folderPath || !algorithm) {
            showNotificationCallback('请提供文件夹路径和算法后再进行识别。');
            return { success: false, error: 'Missing folder path or algorithm' };
        }

        // 开始加载状态
        isLoading.value = true;
        // 显示开始识别的通知
        showNotificationCallback(`🚧 正在对文件夹路径 ${folderPath} 使用 ${algorithm} 进行识别...`);

        try {
            // 发送POST请求到/infer_folder_path端点
            const response = await axios.post('/infer_folder_path', {
                folderPath: folderPath,
                algorithm: algorithm,
            });

            // 处理成功响应
            if (response.data && response.data.success) {
                showNotificationCallback(response.data.message || '✅ 文件夹识别任务已发送并处理成功！');
                return { success: true, data: response.data };
            } else {
                // 处理后端返回的错误
                const errorMessage = response.data?.message || response.data?.error || '后端处理失败但未提供明确错误信息。';
                showNotificationCallback(`❌ 文件夹识别失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            // 处理错误
            console.error('文件夹识别请求失败:', error);
            let errorMessage = '❌ 文件夹识别请求失败，请检查网络或联系管理员。';
            if (error.response?.data?.error) {
                errorMessage = `❌ 识别失败: ${error.response.data.error}`;
            } else if (error.message) {
                errorMessage = `❌ 识别失败: ${error.message}`;
            }
            showNotificationCallback(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            // 无论成功或失败，都结束加载状态
            isLoading.value = false;
        }
    }

    // 返回所有响应式变量和方法
    return {
        isLoading,
        resultImageUrl,
        textResults,
        performInference,
        performFolderPathInference,
    };
}