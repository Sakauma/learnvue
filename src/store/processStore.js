import { defineStore } from 'pinia';
import axios from 'axios';
import { useInference } from '../composables/useInference.js';
import { useNotifications } from '../composables/useNotifications.js';

// 在 Store 文件顶部实例化一次，供所有 action 使用
const notifications = useNotifications();
const inferenceHandler = useInference(notifications.showNotification);

export const useProcessStore = defineStore('process', {
    state: () => ({
        // 全局及UI状态
        selectedMode: 'singleFrame',
        selectedAlgorithmType: '',
        selectedSpecificAlgorithm: '',
        imageRows: 240,
        imageCols: 320,
        selectedPrecision: 'float64',

        // 输入状态
        cropCoordinates: null,      // 单帧的裁剪坐标
        originalFolderPath: '',     // 多帧的原始路径

        // 结果状态
        resultFolderPathFromApi: '',
        resultFilesFromApi: null,
        currentMultiFrameIndex: -1,
        allFeaturesData: null,      // 多帧图表数据
        singleFrameChartData: null, // 单帧图表数据
    }),

    getters: {
        isMultiFrameMode: (state) => state.selectedMode === 'multiFrame',
        numberOfResultFrames: (state) => state.resultFilesFromApi?.outputImageNames?.length || 0,
    },

    actions: {
        // --- 状态设置 Actions ---
        setMode(newMode) {
            if (this.selectedMode === newMode) return;
            this.selectedMode = newMode;
        },
        setAlgorithmType(type) { this.selectedAlgorithmType = type; },
        setSpecificAlgorithm(algorithm) { this.selectedSpecificAlgorithm = algorithm; },
        setImageRows(rows) { this.imageRows = rows; },
        setImageCols(cols) { this.imageCols = cols; },
        setPrecision(precision) { this.selectedPrecision = precision; },
        setCropCoordinates(coordinates) { this.cropCoordinates = coordinates; },
        setOriginalFolderPath(path) { this.originalFolderPath = path; },

        // --- 核心业务流程 Actions ---

        /**
         * Action: 执行单帧识别
         * @param {object} payload - 包含单帧文件所需的数据 { file, md5 }
         */
        async inferSingleFrame(payload) {
            this.allFeaturesData = null; // 清理旧图表
            const result = await inferenceHandler.performInference(
                payload.file,
                payload.md5,
                this.selectedSpecificAlgorithm,
                this.imageRows,
                this.imageCols,
                this.cropCoordinates
            );
            if (result.success && result.newChartValues?.length > 0) {
                // 更新单帧图表状态，让组件监听并更新UI
                this.singleFrameChartData = result.newChartValues;
            } else if (result.success) {
                notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
            }
        },

        /**
         * Action: 执行多帧识别
         */
        async inferMultiFrame() {
            this.allFeaturesData = null; // 清理旧图表
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;

            const result = await inferenceHandler.performFolderPathInference(
                this.originalFolderPath,
                this.selectedSpecificAlgorithm
            );

            if (result?.success && result.data) {
                this.resultFolderPathFromApi = result.data.resultPath || '';
                if (result.data.resultFiles?.outputImageNames) {
                    this.resultFilesFromApi = result.data.resultFiles;
                } else {
                    notifications.showNotification('⚠️ 后端响应的 result.data.resultFiles 结构不符合预期。', 3000);
                }
                if (this.numberOfResultFrames > 0) {
                    this.currentMultiFrameIndex = 0;
                    if (this.resultFolderPathFromApi) {
                        await this._fetchFeatureDataForCharts();
                    } else {
                        notifications.showNotification('⚠️ 未能获取结果文件夹路径，无法加载图表数据。', 2500);
                    }
                } else {
                    notifications.showNotification('识别完成，但未返回有效的结果文件列表。', 2500);
                }
                notifications.showNotification(result.data.message || `结果信息已接收。`, 3500);
            } else {
                const errorMessage = result?.data?.message || result?.error || "识别请求失败或后端未返回有效数据。";
                notifications.showNotification(`❌ ${errorMessage}`, 3000);
            }
        },

        /**
         * 内部 Action: 获取多帧结果的特征数据
         */
        async _fetchFeatureDataForCharts() {
            if (!this.resultFolderPathFromApi) return;
            try {
                const response = await axios.get('get_feature_data', { params: { resultPath: this.resultFolderPathFromApi } });
                if (response.data?.success && response.data.features) {
                    this.allFeaturesData = response.data.features;
                    notifications.showNotification("图表特征数据加载成功！", 2000);
                } else {
                    notifications.showNotification(`⚠️ ${response.data?.message || "未能加载图表特征数据。"}`, 2500);
                }
            } catch (error) {
                notifications.showNotification(`❌ 请求图表特征数据失败: ${error.response?.data?.message || error.message}`, 3000);
            }
        },
    },
});