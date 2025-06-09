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
        cropCoordinates: null, // 存储裁剪坐标
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
            this.resetAllState();
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

        // [BUG修复] 新增 Action，用于保存裁剪坐标
        setCropCoordinates(coords) {
            this.cropCoordinates = coords;
        },

        resetSingleFrameData() {
            this.singleFrameFile = null;
            this.singleFrameFileMD5 = '';
            this.cropCoordinates = null;
            this.allFeaturesData = null;
            notifications.showNotification('单帧图像及数据已清除。');
        },

        resetMultiFrameData() {
            this.manualFolderPath = '';
            this.originalFolderPath = '';
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;
            this.allFeaturesData = null;
            notifications.showNotification('所有多帧预览和结果已清除。');
        },

        resetAllState() {
            this.resetSingleFrameData();
            this.resetMultiFrameData();
            this.isLoading = false;
        },

        // --- 核心业务流程 Actions ---
        async inferSingleFrame() {
            if (!this.canInferInCurrentMode) return { success: false };
            this.isLoading = true;
            this.allFeaturesData = null;

            const result = await inferenceHandler.performInference(
                this.singleFrameFile,
                this.singleFrameFileMD5,
                this.selectedSpecificAlgorithm,
                this.imageRows,
                this.imageCols,
                this.cropCoordinates
            );

            this.isLoading = false;

            if (result.success) {
                if (result.newChartValues?.length > 0) {
                    // TODO: 单帧模式下的图表数据结构不完整，等待后续算法开发完全后在此处修改
                    this.allFeaturesData = { "variance": result.newChartValues };
                } else {
                    notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
                }
                return {
                    success: true,
                    resultImage: result.data.processedImage ? `data:image/png;base64,${result.data.processedImage}` : null,
                    textResults: result.data.message || '识别成功'
                };
            }
            return { success: false };
        },

        async inferMultiFrame() {
            if (!this.canInferInCurrentMode) return;
            this.isLoading = true;
            this.allFeaturesData = null;
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