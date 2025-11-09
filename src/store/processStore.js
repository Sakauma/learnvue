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
        /** @type {'manual' | 'automatic'} 当前选择的处理模式 */
        selectedMode: 'automatic',
        /** @type {string} 选择的算法大类 */
        selectedAlgorithmType: 'traditional',
        /** @type {string} 选择的具体算法名称 */
        selectedSpecificAlgorithm: 'GJDeal',
        /** @type {number} 图像的行数，用于.dat文件解析和后端处理 */
        imageRows: 512,
        /** @type {number} 图像的列数，用于.dat文件解析和后端处理 */
        imageCols: 512,
        /** @type {string} 选择的图像数据精度 (例如 'float64') */
        selectedPrecision: 'float64',

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
        /** 用于存储待上传文件的 state */
        multiFrameFiles: [],

        /** @type {File | null} 轨迹模式下上传的轨迹文件 */
        trajectoryFile: null,

        /** @type {string} API返回的结果文件所在的基础路径 */
        resultFolderPathFromApi: '',
        /** @type {string} API返回的分析ID (用于持久化) */
        analysisId: '',
        /** @type {object | null} API返回的结果文件列表，包含原始、ROI和输出图像名 */
        resultFilesFromApi: null,
        /** @type {number} 多帧模式下，当前正在查看的结果帧的索引 */
        currentMultiFrameIndex: -1,
        /** @type {object | null} 从API获取的所有特征数据，用于图表渲染 */
        allFeaturesData: null,
        /** @type {boolean} 全局加载状态，true表示正在进行异步操作（如识别） */
        isLoading: false,
        /** @type {Array} 存储用于世界地图的标记点数据 [{lat, lng, resultType, taskId, name, value}] */
        mapMarkerData: [],

        /** @type {'disconnected' | 'connecting' | 'connected' | 'error'} 自动模式SSE连接状态 */
        autoModeConnectionStatus: 'disconnected',
        /** @type {string[]} 后端推送的自动模式 .dat文件URL列表*/
        autoModeDatFileUrls: [],
    }),

    /**
     * @description 定义 store 的计算属性 (Getters)。
     * Getters 用于从 state 派生出新的状态，具有缓存和响应性。
     */
    getters: {
        /**
         * @description 判断当前是否为手动处理模式。
         * @param {object} state - 当前的 store state。
         * @returns {boolean} 如果是手动模式则返回 true。
         */
        isManualMode: (state) => state.selectedMode === 'manual',

        /**
         * @description 获取多帧结果的总数量。
         * @param {object} state - 当前的 store state。
         * @returns {number} 结果文件的数量。
         */
        numberOfResultFrames: (state) => {
            // 自动模式下，结果帧数也来自 resultFilesFromApi
            return state.resultFilesFromApi?.outputImageNames?.length || 0;
        },

        /** @type {number} 预览帧的总数 (手动或自动) */
        totalPreviewFrames: (state) => {
            //return state.isManualMode ? state.multiFrameFiles.length : state.autoModePreviewUrls.length;
            return state.multiFrameFiles.length;
        },

        uploadProgress: () => inferenceHandler.uploadProgress.value,
        /**
         * @description 判断在当前模式和状态下是否满足执行“识别”操作的条件。
         * @param {object} state - 当前的 store state。
         * @returns {boolean} 如果可以执行识别则返回 true。
         */
        canInferInCurrentMode: (state) => {
            if (!state.selectedSpecificAlgorithm) return false; // 必须选择算法

            if (state.isManualMode) {
                // 手动模式
                return state.multiFrameFiles.length > 0 && !!state.trajectoryFile;
            } else {
                // 自动模式：必须已连接SSE，并且后端已推送了可用的 .dat 文件 URL
                //return state.autoModeConnectionStatus === 'connected' && state.autoModeDatFileUrls.length > 0;
                return false;
            }
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
         * @param {'manual' | 'automatic'} newMode - 要设置的新模式。
         */
        setMode(newMode) {
            if (this.selectedMode === newMode) return;
            this.selectedMode = newMode;
            let modeName = '未知模式';
            if (newMode === 'manual') modeName = '手动模式';
            if (newMode === 'automatic') modeName = '自动模式';

            this.resetAllState();
            notifications.showNotification(`模式已切换为: ${modeName}。`);
        },

        setMultiFrameFiles(files) {
            this.multiFrameFiles = files;
            if (files.length > 0) {
                notifications.showNotification(`已加载 ${files.length} 个文件准备识别。`);
            }
        },

        setTrajectoryFile(file) {
            this.trajectoryFile = file;
            if (file) {
                notifications.showNotification(`已加载轨迹文件: ${file.name}`);
            } else {
                notifications.showNotification('轨迹文件已清除。');
            }
        },

        /**
         * @description 设置自动模式的SSE连接状态
         * @param {'disconnected' | 'connecting' | 'connected' | 'error'} status
         */
        setAutoModeConnectionStatus(status) {
            this.autoModeConnectionStatus = status;
        },

        /**
         * @description 设置自动模式的.dat文件URL列表
         * @param {string[]} urls
         */
        setAutoModeDatFileUrls(urls) {
            if (Array.isArray(urls)) {
                this.autoModeDatFileUrls = urls;
                if (urls.length > 0) {
                    notifications.showNotification(`✅ 自动模式：已接收 ${urls.length} 个 .dat 文件列表。`);
                }
            } else {
                this.autoModeDatFileUrls = [];
                notifications.showNotification(`⚠️ 自动模式：收到的 .dat 文件列表格式不正确。`);
            }
        },

        /**
         * @description 重置所有与多帧模式相关的状态。
         */
        resetMultiFrameData() {
            this.multiFrameFiles = [];
            this.trajectoryFile = null;
            this.resultFolderPathFromApi = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;
            this.allFeaturesData = null;
            this.autoModeDatFileUrls = [];
            this.mapMarkerData = [];
            notifications.showNotification('所有预览和结果已清除。');
        },

        /**
         * @description 重置所有模式的状态，通常在模式切换时调用。
         */
        resetAllState() {
            this.resetMultiFrameData();
            this.isLoading = false;

            this.autoModeConnectionStatus = 'disconnected';
            this.autoModeDatFileUrls = [];
            this.mapMarkerData = [];
            //notifications.showNotification('界面数据已经清空。');
        },

        // --- 核心业务流程 Actions ---
        /**
         * @description 执行多帧（文件夹）识别的异步操作。
         */
        async inferMultiFrame(abortSignal) {
            if (!this.canInferInCurrentMode || !this.isManualMode) return;
            // 重置状态
            this.isLoading = true;
            this.allFeaturesData = null;
            this.resultFolderPathFromApi = '';
            this.analysisId = '';
            this.resultFilesFromApi = null;
            this.currentMultiFrameIndex = -1;

            let result = await inferenceHandler.performMultiFrameInference(
                this.multiFrameFiles,
                this.selectedSpecificAlgorithm,
                2,
                this.trajectoryFile, // trackFile
                abortSignal
            );

            if (result?.success && result.data) {
                this.resultFolderPathFromApi = result.data.resultPath || '';
                this.resultFilesFromApi = result.data.resultFiles || null;
                // 从后端响应中获取正确的 analysisId 并存储
                this.analysisId = result.data.analysisId || '';
                if (this.numberOfResultFrames > 0) {
                    this.currentMultiFrameIndex = 0;
                    if (this.resultFolderPathFromApi) {
                        await this._fetchFeatureDataForCharts('manual');
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
         * @description (自动模式) 处理后端推送的 SSE 最终结果
         * @param {object} resultData - 后端推送的 MultiFrameResultResponse 对象
         */
        async processAutoModeResult(resultData) {
            if (resultData) {
                notifications.showNotification('✅ 自动模式任务完成，收到结果！');
                this.isLoading = true; // 在处理结果时显示加载
                // 重置旧数据
                this.allFeaturesData = null;
                // 填充新数据
                this.resultFolderPathFromApi = resultData.resultPath || '';
                this.resultFilesFromApi = resultData.resultFiles || null;
                this.analysisId = resultData.analysisId || '';

                const taskId = resultData.taskId;

                if (this.numberOfResultFrames > 0) {
                    this.currentMultiFrameIndex = 0;
                    if (this.resultFolderPathFromApi) {
                        // 异步获取图表数据
                        await this._fetchFeatureDataForCharts(taskId);
                    } else {
                        notifications.showNotification('⚠️ 未能获取结果文件夹路径，无法加载图表数据。', 2500);
                    }
                } else {
                    notifications.showNotification('识别完成，但未返回有效的结果文件列表。', 2500);
                }
                this.isLoading = false; // 处理完成，隐藏加载
            } else {
                notifications.showNotification('⚠️ 收到空的自动模式结果。', 2500);
            }
        },

        /**
         * @description (内部方法) 根据结果路径从后端获取用于图表的特征数据。
         * @private
         * @param {string | number} taskId - 'manual' 或 自动模式的任务ID
         */
        // async _fetchFeatureDataForCharts(taskId = 'unknown') {
        //     if (!this.resultFolderPathFromApi) return;
        //     try {
        //         const response = await axios.get('get_feature_data', { params: { resultPath: this.resultFolderPathFromApi } });
        //         if (response.data?.success && response.data.features) {
        //             this.allFeaturesData = response.data.features;
        //             notifications.showNotification("图表特征数据加载成功！", 2000);
        //             this.parseMapDataFromFeatures(response.data.features);
        //         } else {
        //             notifications.showNotification(`⚠️ ${response.data?.message || "未能加载图表特征数据。"}`, 2500);
        //         }
        //     } catch (error) {
        //         notifications.showNotification(`❌ 请求图表特征数据失败: ${error.response?.data?.message || error.message}`, 3000);
        //     }
        // },
        async _fetchFeatureDataForCharts(taskId = 'unknown') { // [修改] 接受 taskId
            if (!this.resultFolderPathFromApi) return;
            try {
                const response = await axios.get('get_feature_data', { params: { resultPath: this.resultFolderPathFromApi } });
                if (response.data?.success && response.data.features) {
                    this.allFeaturesData = response.data.features;
                    notifications.showNotification("图表特征数据加载成功！", 2000);
                    // 将 features 和 taskId 都传递给解析器
                    this.parseMapDataFromFeatures(response.data.features, taskId);
                } else {
                    notifications.showNotification(`⚠️ ${response.data?.message || "未能加载图表特征数据。"}`, 2500);
                }
            } catch (error) {
                notifications.showNotification(`❌ 请求图表特征数据失败: ${error.response?.data?.message || error.message}`, 3000);
            }
        },

        /**
         * @description 解析特征数据以提取地图标记点
         * @param {object} features - 后端返回的 allFeaturesData 对象
         * @param {string | number} taskId - 'manual' 或 自动模式的任务ID
         */
        // parseMapDataFromFeatures(features) {
        //     if (!features || !features.lat || !features.lgt || features.category_type === undefined) {
        //         console.warn("[parseMapData] 缺少 lat, lgt, 或 category_type 数据，无法生成地图标记。");
        //         this.mapMarkerData = [];
        //         return;
        //     }
        //
        //     const latitudes = features.lat;
        //     const longitudes = features.lgt;
        //     // category_type 是一个单一值，应用于所有帧
        //     const type = features.category_type;
        //
        //     if (!Array.isArray(latitudes) || !Array.isArray(longitudes) || latitudes.length !== longitudes.length) {
        //         console.warn("[parseMapData] lat 或 lgt 不是数组，或长度不匹配。");
        //         this.mapMarkerData = [];
        //         return;
        //     }
        //
        //     const newMarkers = [];
        //     for (let i = 0; i < latitudes.length; i++) {
        //         // 确保经纬度数据有效
        //         if (typeof latitudes[i] === 'number' && typeof longitudes[i] === 'number') {
        //             newMarkers.push({
        //                 name: `分析点 ${i + 1}`, // 自动生成一个名称
        //                 lat: latitudes[i],
        //                 lng: longitudes[i],
        //                 resultType: type, // 将 category_type 赋给 resultType
        //                 value: i + 1 // 可以放一个占位值，比如帧索引
        //             });
        //         }
        //     }
        //     this.mapMarkerData = newMarkers;
        //     console.log(`[parseMapData] 成功解析并存储 ${newMarkers.length} 个地图标记点。`);
        // },
        parseMapDataFromFeatures(features, taskId) {
            if (!features || !features.lat || !features.lgt || features.category_type === undefined) {
                console.warn("[parseMapData] 缺少 lat, lgt, 或 category_type 数据，无法生成地图标记。");
                return;
            }

            const latitudes = features.lat;
            const longitudes = features.lgt;
            const type = features.category_type; // category_type 是一个单一值

            if (!Array.isArray(latitudes) || !Array.isArray(longitudes) || latitudes.length !== longitudes.length) {
                console.warn("[parseMapData] lat 或 lgt 不是数组，或长度不匹配。");
                return;
            }

            // --- [新增] 去重逻辑 ---

            // 1. 创建一个 Set，用于快速查找已存在的标记点
            // 我们使用 "纬度:经度:类型" 格式的字符串作为唯一键
            const existingMarkersSet = new Set(
                this.mapMarkerData.map(m => `${m.taskId}:${m.lat}:${m.lng}:${m.resultType}`)
            );

            const newMarkers = [];

            for (let i = 0; i < latitudes.length; i++) {
                const lat = latitudes[i];
                const lng = longitudes[i];

                if (typeof lat !== 'number' || typeof lng !== 'number') {
                    continue; // 跳过无效数据
                }

                // [修改] 使用新的4部分唯一键
                const markerKey = `${taskId}:${lat}:${lng}:${type}`;

                if (!existingMarkersSet.has(markerKey)) {
                    existingMarkersSet.add(markerKey);

                    // [修改] 在存储的对象中包含 taskId
                    newMarkers.push({
                        taskId: taskId,
                        name: `任务 ${taskId} (点 ${i + 1})`,
                        lat: lat,
                        lng: lng,
                        resultType: type,
                        value: i + 1 // 帧索引
                    });
                }
            }

            if (newMarkers.length > 0) {
                this.mapMarkerData.push(...newMarkers);
                console.log(`[parseMapData] 成功累积 ${newMarkers.length} 个新的地图标记点。总数: ${this.mapMarkerData.length}`);
                notifications.showNotification(`✅ 地图新增 ${newMarkers.length} 个分析结果`);
            } else {
                console.log("[parseMapData] 本次分析未产生新的地图标记点 (数据已存在)。");
            }
        },
    },
});