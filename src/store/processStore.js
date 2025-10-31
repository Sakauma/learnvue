import { defineStore } from 'pinia';
import axios from 'axios';
import { useInference } from '../composables/useInference.js';
import { useNotifications } from '../composables/useNotifications.js';

// --- 初始化外部模块 ---
/**
 * @description 通知系统 Composable，提供显示全局通知的功能。
 */
const notifications = useNotifications();
/**
 * @description 推理（识别）逻辑处理器 Composable，封装了与后端API的实际通信。
 */
const inferenceHandler = useInference(notifications.showNotification);

/**
 * @description `process` store 的定义。
 * 这是应用程序的核心状态管理中心，负责存储、管理和处理与图像处理流程相关的所有数据。
 * 它包括UI状态（如加载状态、当前模式）、输入数据（如文件、路径）以及从API获取的结果。
 * 通过 getters 提供派生状态，通过 actions 封装业务逻辑和异步操作。
 */
export const useProcessStore = defineStore('process', {
    /**
     * @description 定义 store 的所有核心状态属性。
     * @returns {object} 包含所有状态的初始值的对象。
     */
    state: () => ({
        /** @type {'singleFrame' | 'multiFrame'| 'gjMode'} 当前选择的处理模式 */
        selectedMode: 'multiFrame',
        /** @type {string} 选择的算法大类 (例如 'classification', 'detection') */
        selectedAlgorithmType: '',
        /** @type {string} 选择的具体算法名称 */
        selectedSpecificAlgorithm: '',
        /** @type {number} 图像的行数，用于.dat文件解析和后端处理 */
        imageRows: 512,
        /** @type {number} 图像的列数，用于.dat文件解析和后端处理 */
        imageCols: 512,
        /** @type {string} 选择的图像数据精度 (例如 'float64') */
        selectedPrecision: 'float64',
        // /** @type {string} 用户在UI中手动输入的文件夹路径（多帧模式） */
        // manualFolderPath: '',

        // --- 【新增】新参数的状态 ---
        /** @type {string} 卫星型号 ('H' 或 'G') */
        satelliteType: 'H',
        /** @type {string} 具体卫星型号 (例如 'H03', 'G01') */
        satelliteModel: 'H03',
        /** @type {string} 段波类型 (例如 'gazeShort') */
        waveType: 'gazeShort',
        /** @type {string} 轨迹条目 (例如 '1001') */
        trajectoryEntry: '1001',

        /** @type {File | null} 单帧模式下上传的原始文件对象 */
        singleFrameFile: null,
        /** @type {string} 单帧模式下上传文件的MD5校验值 */
        singleFrameFileMD5: '',
        /** @type {object | null} 单帧模式下的裁剪坐标 */
        cropCoordinates: null,
        // /** @type {string} 多帧模式下，最终确认用于识别的文件夹路径 */
        // originalFolderPath: '',
        /** 用于存储待上传文件的 state */
        multiFrameFiles: [],
        /** @type {string} API返回的结果文件所在的基础路径 */
        resultFolderPathFromApi: '',
        /** @type {object | null} API返回的结果文件列表，包含原始、ROI和输出图像名 */
        resultFilesFromApi: null,
        /** @type {number} 多帧模式下，当前正在查看的结果帧的索引 */
        currentMultiFrameIndex: -1,
        /** @type {object | null} 从API获取的所有特征数据，用于图表渲染 */
        allFeaturesData: null,
        /** @type {boolean} 全局加载状态，true表示正在进行异步操作（如识别） */
        isLoading: false,
    }),

    /**
     * @description 定义 store 的计算属性 (Getters)。
     * Getters 用于从 state 派生出新的状态，具有缓存和响应性。
     */
    getters: {
        /**
         * @description 判断当前是否为多帧处理模式。
         * @param {object} state - 当前的 store state。
         * @returns {boolean} 如果是多帧模式则返回 true。
         */
        isMultiFrameMode: (state) => state.selectedMode === 'multiFrame',

        /**
         * @description 获取多帧结果的总数量。
         * @param {object} state - 当前的 store state。
         * @returns {number} 结果文件的数量。
         */
        numberOfResultFrames: (state) => state.resultFilesFromApi?.outputImageNames?.length || 0,


        uploadProgress: () => inferenceHandler.uploadProgress.value,
        /**
         * @description 判断在当前模式和状态下是否满足执行“识别”操作的条件。
         * @param {object} state - 当前的 store state。
         * @returns {boolean} 如果可以执行识别则返回 true。
         */
        canInferInCurrentMode: (state) => {
            if (!state.selectedSpecificAlgorithm) return false; // 必须选择一个算法
            // 【新增】GJ 模式暂时不可用
            if (state.selectedMode === 'gjMode') {
                return false;
            }
            if (state.selectedMode === 'multiFrame') {
                return state.multiFrameFiles.length > 0;
                //return !!state.originalFolderPath.trim(); // 多帧模式下必须有确认的文件夹路径
            }
            return !!state.singleFrameFile; // 单帧模式下必须有上传的文件
        },
    },

    /**
     * @description 定义可以修改 state 的方法 (Actions)。
     * Actions 可以是同步的也可以是异步的，用于封装业务逻辑。
     */
    actions: {
        // --- 状态设置与重置 Actions ---

        /**
         * @description 设置当前的 işlem modu。
         * @param {'singleFrame' | 'multiFrame'| 'gjMode'} newMode - 要设置的新模式。
         */
        setMode(newMode) {
            if (this.selectedMode === newMode) return;
            this.selectedMode = newMode;
            let modeName = '未知模式';
            if (newMode === 'singleFrame') modeName = '单帧模式';
            if (newMode === 'multiFrame') modeName = '多帧模式';
            if (newMode === 'gjMode') modeName = 'GJ 模式';
            notifications.showNotification(`模式已切换为: ${modeName}`);
            this.resetAllState(); // 切换模式时清空所有相关状态
        },

        /**
         * @description 设置单帧模式下的文件及其MD5值。
         * @param {File} file - 文件对象。
         * @param {string} md5 - 文件的MD5哈希值。
         */
        setSingleFrameFile(file, md5) {
            this.singleFrameFile = file;
            this.singleFrameFileMD5 = md5;
        },

        // --- 新增：用于设置待上传文件的 action ---
        setMultiFrameFiles(files) {
            this.multiFrameFiles = files;
            if (files.length > 0) {
                notifications.showNotification(`已加载 ${files.length} 个文件准备识别。`);
            }
        },

        /**
         * @description 保存单帧模式下的图像裁剪坐标。
         * @param {object} coords - 包含 x, y, width, height 的坐标对象。
         */
        setCropCoordinates(coords) {
            this.cropCoordinates = coords;
        },

        /**
         * @description 重置所有与单帧模式相关的状态。
         */
        resetSingleFrameData() {
            this.singleFrameFile = null;
            this.singleFrameFileMD5 = '';
            this.cropCoordinates = null;
            this.allFeaturesData = null;
            notifications.showNotification('单帧图像及数据已清除。');
        },

        /**
         * @description 重置所有与多帧模式相关的状态。
         */
        resetMultiFrameData() {
            this.multiFrameFiles = []; // <-- 新增
            //this.manualFolderPath = '';
            //this.originalFolderPath = '';
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;
            this.allFeaturesData = null;
            notifications.showNotification('所有多帧预览和结果已清除。');
        },

        /**
         * @description 重置所有模式的状态，通常在模式切换时调用。
         */
        resetAllState() {
            this.resetSingleFrameData();
            this.resetMultiFrameData();
            this.isLoading = false;
        },

        // --- 核心业务流程 Actions ---

        /**
         * @description 执行单帧图像识别的异步操作。
         * @returns {Promise<{success: boolean, resultImage?: string | null, textResults?: string}>} 返回一个包含操作结果的对象。
         */
        async inferSingleFrame(abortSignal) {
            if (!this.canInferInCurrentMode) return { success: false };
            this.isLoading = true;
            this.allFeaturesData = null;

            // 调用外部 handler 执行实际的 API 请求
            const result = await inferenceHandler.performInference(
                this.singleFrameFile,
                this.singleFrameFileMD5,
                this.selectedSpecificAlgorithm,
                this.imageRows,
                this.imageCols,
                this.cropCoordinates,
                abortSignal
            );

            this.isLoading = false;

            if (result.success) {
                if (result.newChartValues?.length > 0) {
                    // TODO: 单帧模式下的图表数据结构不完整，等待后续算法开发完全后在此处修改
                    this.allFeaturesData = { "variance": result.newChartValues };
                } else {
                    notifications.showNotification('单帧识别成功，但未返回图表数据。', 2000);
                }
                // 成功后，返回格式化的结果给调用方 (Orchestrator)
                return {
                    success: true,
                    resultImage: result.data.processedImage ? `data:image/png;base64,${result.data.processedImage}` : null,
                    textResults: result.data.message || '识别成功'
                };
            }
            return { success: false };
        },

        /**
         * @description 执行多帧（文件夹）识别的异步操作。
         */
        async inferMultiFrame(abortSignal) {
            if (!this.canInferInCurrentMode) return;
            // 重置状态
            this.isLoading = true;
            this.allFeaturesData = null;
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;

            const result = await inferenceHandler.performMultiFrameInference(
                this.multiFrameFiles,
                this.selectedSpecificAlgorithm,
                1,       // mode = 1
                null,    // trackFile = null
                abortSignal
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

        /**
         * @description (内部方法) 根据结果路径从后端获取用于图表的特征数据。
         * @private
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