import { defineStore } from 'pinia';
import axios from 'axios';
import { useInference } from '../composables/useInference.js';
import { useNotifications } from '../composables/useNotifications.js';

const notifications = useNotifications();
const inferenceHandler = useInference(notifications.showNotification);

export const useProcessStore = defineStore('process', {
    state: () => ({
        selectedMode: 'singleFrame',
        selectedAlgorithmType: '',
        selectedSpecificAlgorithm: '',
        imageRows: 240,
        imageCols: 320,
        selectedPrecision: 'float64',
        manualFolderPath: '',
        singleFrameFile: null,
        singleFrameFileMD5: '',
        singleFrameResultImageUrl: null,
        singleFrameTextResults: [],
        cropCoordinates: null,
        originalFolderPath: '',
        resultFolderPathFromApi: '',
        resultFilesFromApi: null,
        currentMultiFrameIndex: -1,
        allFeaturesData: null,
        isLoading: false,
    }),

    getters: {
        isMultiFrameMode: (state) => state.selectedMode === 'multiFrame',
        numberOfResultFrames: (state) => state.resultFilesFromApi?.outputImageNames?.length || 0,
        canInferInCurrentMode: (state) => {
            if (!state.selectedSpecificAlgorithm) return false;
            if (state.selectedMode === 'multiFrame') {
                return !!state.originalFolderPath.trim();
            }
            return !!state.singleFrameFile;
        },
    },

    actions: {
        // --- 状态设置与重置 Actions ---
        setMode(newMode) {
            if (this.selectedMode === newMode) return;
            this.selectedMode = newMode;
            notifications.showNotification(`模式已切换为: ${newMode === 'singleFrame' ? '单帧模式' : '多帧模式'}`);
            this.resetAllState(); // 切换模式时重置所有状态
        },

        setSingleFrameFile(file, md5) {
            this.singleFrameFile = file;
            this.singleFrameFileMD5 = md5;
        },

        setOriginalFolderPath(path) {
            this.originalFolderPath = path.trim();
            if(this.originalFolderPath) {
                notifications.showNotification(`识别路径已确认为: ${this.originalFolderPath}。`);
            }
        },

        /**
         * 新增：重置单帧模式的数据（包括图表）
         */
        resetSingleFrameData() {
            this.singleFrameFile = null;
            this.singleFrameFileMD5 = '';
            this.singleFrameResultImageUrl = null;
            this.singleFrameTextResults = [];
            this.cropCoordinates = null;
            this.allFeaturesData = null; // 关键：同时重置图表数据
            notifications.showNotification('单帧图像及数据已清除。');
        },

        /**
         * 新增：重置多帧模式的数据（包括图表）
         */
        resetMultiFrameData() {
            this.manualFolderPath = '';
            this.originalFolderPath = '';
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;
            this.allFeaturesData = null; // 关键：同时重置图表数据
            notifications.showNotification('所有多帧预览和结果已清除。');
        },

        /**
         * 重置所有状态，用于模式切换
         */
        resetAllState() {
            this.resetSingleFrameData();
            this.resetMultiFrameData();
            this.isLoading = false;
        },

        // --- 核心业务流程 Actions ---
        async inferSingleFrame() {
            if (!this.canInferInCurrentMode) return;
            this.isLoading = true;
            this.allFeaturesData = null; // 清理旧图表数据

            const result = await inferenceHandler.performInference(
                this.singleFrameFile,
                this.singleFrameFileMD5,
                this.selectedSpecificAlgorithm,
                this.imageRows,
                this.imageCols,
                this.cropCoordinates
            );

            if (result.success) {
                this.singleFrameResultImageUrl = result.data.processedImage ? `data:image/png;base64,${result.data.processedImage}` : null;
                const tempTextResults = [];
                if (result.data.algorithm) tempTextResults.push({ label: '算法名称', value: result.data.algorithm });
                if (result.data.timestamp) tempTextResults.push({ label: '时间戳', value: result.data.timestamp });
                if (result.data.message) tempTextResults.push({ label: '消息', value: result.data.message });
                this.singleFrameTextResults = tempTextResults;

                if (result.newChartValues?.length > 0) {
                    this.allFeaturesData = { "variance": result.newChartValues }; // 将单帧结果放入通用图表数据结构
                } else {
                    notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
                }
            }
            this.isLoading = false;
        },

        async inferMultiFrame() {
            if (!this.canInferInCurrentMode) return;
            this.isLoading = true;
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
                this.resultFilesFromApi = result.data.resultFiles || null;
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
            }
            this.isLoading = false;
        },

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