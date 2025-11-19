import { ref, readonly } from 'vue';
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
    // 用于跟踪上传进度的
    const uploadProgress = ref(0);

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
    async function performInference(file, fileMD5, algorithm, rows, cols, cropData = null, abortSignal) {
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
                signal: abortSignal,
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
            // 处理取消操作的错误
            if (axios.isCancel(error)) {
                showNotificationCallback('操作已取消');
                return { success: false, error: 'Cancelled' };
            }
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

    async function performMultiFrameInference(files, algorithm, mode, trackFile, taskId, abortSignal) {

        // 1. 检查算法 (所有模式都需要)
        if (!algorithm) {
            showNotificationCallback('请选择一个算法。');
            return { success: false, error: 'Missing algorithm' };
        }

        // 2. 根据模式检查输入文件
        if (mode === 1 && (!files || files.length === 0)) {
            // 模式 1 (多帧) 需要图像文件
            showNotificationCallback('请选择包含有效文件的文件夹。');
            return { success: false, error: 'Missing files for MultiFrame mode' };
        }

        if (mode === 2 && !trackFile) {
            // 模式 2 (轨迹) 需要轨迹文件
            showNotificationCallback('请选择一个轨迹文件。');
            return { success: false, error: 'Missing track file for GJ mode' };
        }

        isLoading.value = true;
        uploadProgress.value = 0;
        showNotificationCallback(`🚧 准备上传 ${files.length} 个文件...`);

        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });
        formData.append('algorithm', algorithm);
        formData.append('mode', String(mode));
        if (trackFile) {
            formData.append('trackFile', trackFile);
        }

        if (taskId) {
            formData.append('taskId', String(taskId));
        }

        try {
            const response = await axios.post('/infer_multi_frame', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    uploadProgress.value = percentCompleted;
                },
                signal: abortSignal,
            });

            if (response.data && response.data.success) {
                showNotificationCallback(response.data.message || '✅ 多帧识别任务处理成功！');
                return { success: true, data: response.data };
            } else {
                const errorMessage = response.data?.message || '后端处理失败。';
                showNotificationCallback(`❌ 多帧识别失败: ${errorMessage}`);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            // 处理取消操作的错误
            if (axios.isCancel(error)) {
                showNotificationCallback('上传已取消');
                return { success: false, error: 'Cancelled' };
            }
            console.error('多帧识别请求失败:', error);
            const errorMessage = error.response?.data?.message || error.message || '请求失败，请检查网络或联系管理员。';
            showNotificationCallback(`❌ 多帧识别失败: ${errorMessage}`);
            return { success: false, error: errorMessage };
        } finally {
            isLoading.value = false;
        }
    }

    // 返回所有响应式变量和方法
    return {
        isLoading: readonly(isLoading),
        resultImageUrl: readonly(resultImageUrl),
        textResults: readonly(textResults),
        uploadProgress: readonly(uploadProgress),
        performInference,
        performMultiFrameInference,
    };
}