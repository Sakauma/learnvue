import { ref } from 'vue';
import axios from 'axios';

axios.defaults.baseURL = 'api';

export function useInference(showNotificationCallback) {
    const isLoading = ref(false);
    const resultImageUrl = ref(null); // 单帧：处理后的图像Base64
    const textResults = ref([]);    // 单帧：文本结果

    async function performInference(file, fileMD5, algorithm, rows, cols, cropData = null) {
        if (!file || !algorithm) {
            showNotificationCallback('请选择图像和算法后再进行识别。');
            return { success: false, error: 'Missing file or algorithm', newChartValues: null };
        }
        isLoading.value = true;
        resultImageUrl.value = null;
        textResults.value = [];
        showNotificationCallback(`🚧 正在使用 ${algorithm} 进行识别`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileMD5', fileMD5);
        formData.append('algorithm', algorithm);
        formData.append('rows', String(rows));
        formData.append('cols', String(cols));
        if (cropData) {
            formData.append('cropData', JSON.stringify(cropData));
        }
        try {
            const response = await axios.post('/infer', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (response.data.processedImage) {
                resultImageUrl.value = `data:image/png;base64,${response.data.processedImage}`;
            }
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
            textResults.value = tempTextResults;
            let newChartYValues = null;
            if (response.data && response.data.result && Array.isArray(response.data.result)) {
                const expectedLength = response.data.result_length;
                if (typeof expectedLength === 'number' && response.data.result.length !== expectedLength) {
                    console.warn(`后端返回的 result 数组长度 (${response.data.result.length}) 与 result_length 字段 (${expectedLength}) 不符。`);
                }
                if (response.data.result.length > 0) {
                    newChartYValues = response.data.result;
                } else {
                    console.warn('后端返回的 "result" 数组为空。');
                }
            } else {
                console.warn('后端响应中未找到有效的 "result" 字段作为图表Y值数组。实际result:', response.data.result);
            }
            showNotificationCallback(response.data.message || '✅ 识别成功！'); // 使用后端消息或默认成功消息
            // 返回整个 response.data，ImgProcess.vue 可以从中提取所需信息
            return { success: true, data: response.data, newChartValues: newChartYValues };
        } catch (error) {
            console.error('识别请求失败:', error);
            let errorMessage = '❌ 识别失败，请检查网络或联系管理员。';
            if (error.response && error.response.data && (error.response.data.error || error.response.data.message) ) {
                errorMessage = `❌ 识别失败: ${error.response.data.error || error.response.data.message}`;
            } else if (error.message) {
                errorMessage = `❌ 识别失败: ${error.message}`;
            }
            showNotificationCallback(errorMessage);
            return { success: false, error: errorMessage, newChartValues: null };
        } finally {
            isLoading.value = false;
        }
    }

    async function performFolderPathInference(folderPath, algorithm) {
        if (!folderPath || !algorithm) {
            showNotificationCallback('请提供文件夹路径和算法后再进行识别。');
            return { success: false, error: 'Missing folder path or algorithm' };
        }
        isLoading.value = true;
        showNotificationCallback(`🚧 正在对文件夹路径 ${folderPath} 使用 ${algorithm} 进行识别...`);
        try {
            const response = await axios.post('/infer_folder_path', {
                folderPath: folderPath,
                algorithm: algorithm,
            });
            // 假设后端成功时直接返回 MultiFrameResultResponse 的内容作为 response.data
            // 即 response.data = { success: true, resultPath: "...", resultFiles: {...}, message: "..." }
            if (response.data && response.data.success) {
                showNotificationCallback(response.data.message || '✅ 文件夹识别任务已发送并处理成功！');
                // 将整个 response.data 返回，ImgProcess.vue 会从中提取 resultPath 和 resultFiles
                return { success: true, data: response.data };
            } else {
                const errorMessage = response.data?.message || response.data?.error || '后端处理失败但未提供明确错误信息。';
                showNotificationCallback(`❌ 文件夹识别失败: ${errorMessage}`);
                console.error('文件夹识别响应格式错误或处理失败:', response.data);
                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error('文件夹识别请求失败:', error);
            let errorMessage = '❌ 文件夹识别请求失败，请检查网络或联系管理员。';
            if (error.response && error.response.data && (error.response.data.error || error.response.data.message)) {
                errorMessage = `❌ 识别失败: ${error.response.data.error || error.response.data.message}`;
            } else if (error.message) {
                errorMessage = `❌ 识别失败: ${error.message}`;
            }
            showNotificationCallback(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        resultImageUrl,
        textResults,
        performInference,
        performFolderPathInference,
    };
}