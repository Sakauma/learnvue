import { ref } from 'vue';
import axios from 'axios';

axios.defaults.baseURL = 'api';

export function useInference(showNotificationCallback) {
    const isLoading = ref(false);
    const resultImageUrl = ref(null);
    const textResults = ref([]);
    const chartValues = ref(null); // 存储后端返回的图表数据

    async function performInference(file, fileMD5, algorithm, cropData = null) {
        if (!file || !algorithm) {
            showNotificationCallback('请选择图像和算法后再进行识别。');
            return { success: false, error: 'Missing file or algorithm', newChartData: null }; // 返回 newChartData
        }

        isLoading.value = true;
        resultImageUrl.value = null;
        textResults.value = [];
        chartValues.value = null; // 图表数据重置
        showNotificationCallback(`🚧 正在使用 ${algorithm} 进行识别`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileMD5', fileMD5);
        formData.append('algorithm', algorithm);
        if (cropData) {
            formData.append('cropData', JSON.stringify(cropData));
        }

        try {
            const response = await axios.post('/infer', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // 处理结果图像
            if (response.data.processedImage) {
                resultImageUrl.value = `data:image/png;base64,${response.data.processedImage}`;
            }
            // 处理文本结果
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

            // 处理图表数据 (response.data.result 是包含Y值的float数组)
            if (response.data && response.data.result && Array.isArray(response.data.result)) {
                const expectedLength = response.data.result_length;
                if (typeof expectedLength === 'number' && response.data.result.length !== expectedLength) {
                    console.warn(`后端返回的 result 数组长度 (${response.data.result.length}) 与 result_length 字段 (${expectedLength}) 不符。将使用数组实际长度。`);
                }
                if (response.data.result.length > 0) {
                    chartValues.value = response.data.result;
                } else {
                    console.warn('后端返回的 "result" 数组为空。图表数据将不会更新。');
                    chartValues.value = null;
                }
            } else {
                console.warn('后端响应中未找到有效的 "result" 字段作为图表Y值数组，或其不是数组。图表数据将不会更新。实际result:', response.data.result);
                chartValues.value = null;
            }

            showNotificationCallback('✅ 识别成功！');
            return { success: true, data: response.data, newChartValues: chartValues.value };

        } catch (error) {
            console.error('识别请求失败:', error);
            showNotificationCallback('❌ 识别失败，请稍后重试或检查网络连接。');
            return { success: false, error, newChartValues: null };
        } finally {
            isLoading.value = false;
        }
    }

    return {
        isLoading,
        resultImageUrl,
        textResults,
        performInference,
    };
}