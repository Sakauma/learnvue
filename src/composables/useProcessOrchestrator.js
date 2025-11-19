import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useProcessStore } from '../store/processStore.js';
import { storeToRefs } from 'pinia';

// 导入所有需要的其他 Composables
import { useMultiFrameResult } from './useMultiFrameResult.js';
import { useNotifications } from './useNotifications.js';
import { logService } from './useLogService.js';
import { useSseLogs } from './useSseLogs.js';
import { useZoom } from "./useZoom.js";
import { useDataProduct } from './useDataProduct.js';
import {useMultiFrameLoader} from "./useMultiFrameLoader.js";
import { useSseAutoUpdate } from './useSseAutoUpdate.js';

/**
 * @description 图像处理页面的业务流程编排器 (Orchestrator)。
 * 这是一个核心的 Composable，它封装了页面的所有响应式状态、业务逻辑、
 * 事件处理和派生状态。其主要目的是让主视图组件 (ImgProcess.vue) 保持纯净，
 * 只负责UI渲染和将事件绑定到此处的处理函数，从而实现视图与逻辑的深度分离。
 *
 * @param {import('vue').Ref} multiFrameSystemRef - 对 MultiFrameSystem 组件的模板引用 (ref)，用于调用其方法（如加载、清空、同步帧）。
 * @param {import('vue').Ref} dataColumnRef - 对 DataColumn 组件的模板引用 (ref)，用于调用其方法（如清空报告）。
 * @param {import('vue').Ref} folderInputRef - 对隐藏的文件夹输入框元素的模板引用 (ref)，用于程序化地触发文件选择对话框。
 * @returns {object} 返回一个包含所有需要暴露给视图组件的状态和方法的对象。
 */
export function useProcessOrchestrator(multiFrameSystemRef, dataColumnRef, folderInputRef) {

    // --- 1. 初始化核心模块 ---
    /**
     * @description Pinia 状态管理 store 的实例。
     */
    const store = useProcessStore();
    /**
     * @description Vue Router 的实例，用于导航。
     */
    const router = useRouter();
    /**
     * @description 通知系统 Composable，提供显示全局通知的功能。
     */
    const notifications = useNotifications();

    // --- 2. 状态管理 ---
    /**
     * @description 从 Pinia store 中解构出所有需要的状态。
     * 使用 storeToRefs 可以确保所有解构出的变量都是响应式的 ref。
     */
    const {
        selectedMode, // <--- 我们需要这个来检查旧模式
        isManualMode,
        selectedAlgorithmType,
        selectedSpecificAlgorithm,
        imageRows,
        imageCols,
        selectedPrecision,
        trajectoryFile,

        satelliteType,
        satelliteModel,
        waveType,
        trajectoryEntry,

        resultFolderPathFromApi, // 从后端API获取的结果文件夹路径
        resultFilesFromApi, // 从后端API获取的结果文件列表
        currentMultiFrameIndex, // 多帧模式下，当前查看的结果帧索引
        allFeaturesData, // 从后端获取的所有特征数据
        analysisId,
        isLoading, // 全局加载状态，用于显示加载指示器
        uploadProgress,
        canInferInCurrentMode, // 计算属性，判断在当前模式下是否满足执行识别的条件

        autoModeConnectionStatus,
        autoModeDatFileUrls,
        mapMarkerData,
        latestTaskId,
    } = storeToRefs(store);

    /**
     * @description 缩放功能 Composable，提供缩放级别状态和操作方法。
     */
    const { zoomLevel, zoomIn, zoomOut } = useZoom();

    /**
     * @description SSE (Server-Sent Events) 日志 Composable，用于从后端接收实时日志。
     */
    //const { logs: parsedLogs, connectionStatus, connectionAttempts, connect, disconnect, clearLogs } = useSseLogs('/sse/logs');
    const { connectionStatus, connectionAttempts, connect, disconnect, clearLogs } = useSseLogs('/sse/logs');
    const { logs: parsedLogs } = logService;

    // 初始化自动模式SSE
    const sseAutoUpdate = useSseAutoUpdate();

    watch(sseAutoUpdate.connectionStatus, (newStatus) => {
        store.setAutoModeConnectionStatus(newStatus);
    });

    /**
     * @description 多帧结果图像 URL 管理 Composable。
     * 根据结果路径和当前帧索引，动态计算感兴趣区域（ROI）和结果图像的完整 URL。
     */
    const { interestImageUrl: multiFrameRoiImage, outputImageUrl: multiFrameResultImage } = useMultiFrameResult(
        resultFolderPathFromApi,
        resultFilesFromApi,
        currentMultiFrameIndex
    );

    // 将 store 中的 allFeaturesData 和 currentMultiFrameIndex 作为响应式数据源传入
    const {
        canGenerateFullProduct,
            downloadFullProduct,
            transmitFullProduct,
    } = useDataProduct(allFeaturesData, analysisId);

    const multiFramePreviewLoader = useMultiFrameLoader(notifications.showNotification);

    // 控制参数设置弹窗的可见性
    const isSettingsDialogVisible = ref(false);
    const isVersionDialogVisible = ref(false);

    // [新增] 地图弹窗的状态
    const isMapVisible = ref(false);

    const fileInputMode = ref('images'); // 'images' 或 'trajectory'

    // 用于传递给弹窗的组合设置对象
    const parameterSettings = computed(() => ({
        selectedMode: selectedMode.value,
        algorithmType: selectedAlgorithmType.value,
        specificAlgorithm: selectedSpecificAlgorithm.value,
        imageRows: imageRows.value,
        imageCols: imageCols.value,
        selectedPrecision: selectedPrecision.value,
        satelliteType: satelliteType.value,
        satelliteModel: satelliteModel.value,
        waveType: waveType.value,
        trajectoryEntry: trajectoryEntry.value,
    }));

    // 保存设置的回调函数
    const handleSaveSettings = (newSettings) => {
        isSettingsDialogVisible.value = false;

        nextTick(() => {
            const modeChanged = store.selectedMode !== newSettings.selectedMode;

            if (modeChanged) {
                sseAutoUpdate.disconnect();
                //disconnect();// 断开日志SSE连接
                multiFramePreviewLoader.clearFrames();
                //clearAllLogsAndReports();
                store.setMode(newSettings.selectedMode);
            }

        store.selectedAlgorithmType = newSettings.algorithmType;
        store.selectedSpecificAlgorithm = newSettings.specificAlgorithm;
        store.imageRows = newSettings.imageRows;
        store.imageCols = newSettings.imageCols;
        store.selectedPrecision = newSettings.selectedPrecision;
        store.satelliteType = newSettings.satelliteType;
        store.satelliteModel = newSettings.satelliteModel;
        store.waveType = newSettings.waveType;
        store.trajectoryEntry = newSettings.trajectoryEntry;
        //notifications.showNotification('✅ 参数已保存');
        });
    };

    // --- 3. 计算属性 (Computed Properties) ---
    /**
     * @description 计算多帧模式下结果的总帧数。
     * @returns {number} 结果帧的数量。
     */
    const numberOfResultFrames = computed(() => resultFilesFromApi.value?.outputImageNames?.length || 0);

    // --- 4. 事件处理函数 (Methods) ---
    /**
     * @description 处理模式切换（手动/自动）。
     * @param {'manual' | 'automatic'} newMode - 新的模式。
     */
    const handleModeChange = (newMode) => {
            // --- 新增：切换模式时，如果切出自动模式，则断开连接 ---
            if (newMode !== 'automatic' && sseAutoUpdate.connectionStatus.value === 'connected') {
                sseAutoUpdate.disconnect();
            }
            store.setMode(newMode);
        };

    // 创建一个 ref 来持有 AbortController 实例
    const activeRequestController = ref(null);

    /**
     * @description 执行核心的识别（推断）操作。
     */
    const handleInfer = async () => {
            if (!canInferInCurrentMode.value) { // <--- 检查由 store 完成
                notifications.showNotification('❌ 当前状态无法分析，请检查算法和文件。');
                return;
            }

            if (imageRows.value <= 0 || imageCols.value <= 0) {
                notifications.showNotification('请输入有效的图像行数和列数。');
                return;
            }

            activeRequestController.value = new AbortController();
            await store.inferMultiFrame(activeRequestController.value.signal);

            activeRequestController.value = null;
        };

    // 处理键盘事件的函数
    const handleKeyDown = (event) => {
        if (event.key === 'Escape' && isLoading.value && activeRequestController.value) {
            console.log('ESC pressed, cancelling request...');
            activeRequestController.value.abort(); // 中断请求
            store.isLoading = false; // 手动重置加载状态
        }
    };

    /**
     * @description 统一的文件选择对话框回调
     */
    const handleFolderSelectedViaDialog = (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            if (fileInputMode.value === 'images') {

                multiFramePreviewLoader.processSelectedFiles(
                    files,
                    imageRows.value,
                    imageCols.value
                )

            } else if (fileInputMode.value === 'trajectory') {
                // 这是选择轨迹文件
                const file = files[0];
                store.setTrajectoryFile(file);
            }

            if (event.target) event.target.value = '';
        };

    const handleClearAllMultiFrames = () => {
            multiFramePreviewLoader.clearFrames();
            store.resetMultiFrameData();
            //notifications.showNotification('预览及结果已清空。');
        };

    /**
     * @description 程序化地触发隐藏的文件夹输入框的点击事件。
     * 【重要】根据当前模式动态修改 <input> 的属性。
     */
    const triggerFolderDialogForPathHint = () => {
            const input = folderInputRef.value;
            if (!input) return;

            fileInputMode.value = 'images';

            // 设置为多文件和文件夹选择
            input.webkitdirectory = true;
            input.directory = true;
            input.multiple = true;
            input.accept = ".dat,.jpg,.jpeg,.png,.bmp,.gif,.tif,.tiff";

            input.click();
        };

    /**
     * @description (新增) 触发隐藏的 <input> 点击事件以选择轨迹文件。
     */
    const triggerTrajectoryFileDialog = () => {
        const input = folderInputRef.value;
        if (!input) return;

        fileInputMode.value = 'trajectory';

        // 设置为单文件选择
        input.webkitdirectory = false;
        input.directory = false;
        input.multiple = false;
        input.accept = ".dat"; // 轨迹文件通常是 .dat

        input.click();
    };

    /**
     * @description 登出并返回主页。
     */
    const logOut = () => {
        router.replace("/home");
    };

    /**
     * @description 切换 SSE 日志的连接状态（连接/断开）。
     */
    const toggleSseConnection = () => {
        (['connecting', 'connected'].includes(connectionStatus.value)) ? disconnect() : connect();
    };

    // 自动模式连接控制
    const toggleAutoModeConnection = () => {
        const currentStatus = sseAutoUpdate.connectionStatus.value;
        if (currentStatus === 'connected' || currentStatus === 'connecting') {
            sseAutoUpdate.disconnect();
        } else {
            sseAutoUpdate.connect();
        }
    };

    /**
     * @description 清空所有SSE日志和DataColumn中的报告。
     */
    const clearAllLogsAndReports = () => {
        clearLogs();
        // if (dataColumnRef.value?.report) {
        //     dataColumnRef.value.report.clearReports();
        // }
        //notifications.showNotification('日志和报告已清空');
    };

    // 配置文件相关状态和方法
    /**
     * @description 控制配置编辑器弹窗是否可见。
     * @type {import('vue').Ref<boolean>}
     */
    const isConfigEditorVisible = ref(false);
    /**
     * @description 存储当前从后端获取或待保存的配置数据。
     * @type {import('vue').Ref<object>}
     */
    const currentConfig = ref({
        region: { x: 0, y: 0, width: 320, height: 240 },
        algorithm: { lr: 0.0001 },
    });

    /**
     * @description 打开配置编辑器，并异步从后端获取最新配置。
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
            // 失败时提供一个默认的空配置
            currentConfig.value = {
                region: { x: 0, y: 0, width: 0, height: 0 },
                algorithm: { lr: 0 },
            };
        }
    };

    /**
     * @description 保存配置到后端。
     * @param {object} newConfig - 从编辑器组件传来的新配置数据。
     */
    const handleSaveConfig = async (newConfig) => {
        try {
            await axios.post('http://localhost:8081/api/config', newConfig);
            console.log('新配置保存到后端成功:', newConfig);
            notifications.showNotification('✅ 配置保存成功', 2000);
            currentConfig.value = newConfig; // 更新本地状态
            isConfigEditorVisible.value = false; // 关闭编辑器
        } catch (error) {
            notifications.showNotification('❌ 配置保存失败', 2000);
            console.error("保存配置失败:", error);
        }
    };

    // --- 5. 生命周期钩子 ---
    /**
     * @description 组件挂载时，自动连接 SSE 日志服务。
     */
    onMounted(() => {
        connect(); // 原有的 connect()
        // 挂载时添加全局键盘事件监听器
        window.addEventListener('keydown', handleKeyDown);
    });
    /**
     * @description 组件卸载时，断开 SSE 日志服务，防止内存泄漏。
     */
    onUnmounted(() => {
        disconnect(); // 原有的 disconnect()
        // 卸载时移除监听器，防止内存泄漏
        sseAutoUpdate.disconnect();
        window.removeEventListener('keydown', handleKeyDown);
    });

    // 监听自动模式SSE数据
    watch(sseAutoUpdate.latestData, (newData) => {
        if (newData && newData.datFileUrls && newData.datFileUrls.length > 0) {
            store.resetResultImages();
            store.setAutoModeDatFileUrls(newData.datFileUrls);
            multiFramePreviewLoader.processAutoModeDatUrls(
                newData.datFileUrls,
                imageRows.value, // 传入当前的行列设置
                imageCols.value
            );
        } else {
            store.setAutoModeDatFileUrls([]);
            if (!isManualMode.value) {
                // 预览加载器会清空预览图像
                multiFramePreviewLoader.clearFrames();
                store.resetResultImages();
            }
        }
    });

    watch(sseAutoUpdate.latestResult, (newResult) => {
        // 确保是自动模式，并且有新结果
        if (newResult && !isManualMode.value) {
            console.log('Orchestrator: 收到自动模式最终结果', newResult);
            // 我们将整个 newResult (包含新的 taskId) 传递给 store
            // store 内部的 action 将负责解析它
            store.processAutoModeResult(newResult);
        }
    });

    watch(multiFramePreviewLoader.fileList, (newFrameList) => {
        if (newFrameList && newFrameList.length > 0) {
            // 关键：我们需要的是去重后的原始文件列表，以发送给后端
            // 使用 Map 来确保每个原始文件只被添加一次，同时保持原始的自然排序
            const uniqueOriginalFiles = [...new Map(newFrameList.map(item =>
                [item.originalFile.name, item.originalFile]
            )).values()];

            store.setMultiFrameFiles(uniqueOriginalFiles);
        } else {
            // 如果预览列表为空，也清空待上传文件列表
            store.setMultiFrameFiles([]);
        }
    }, { deep: true });

    watch(currentMultiFrameIndex, (newIndex) => {
        if (isManualMode.value && multiFrameSystemRef.value && newIndex >= 0) {
            multiFrameSystemRef.value.syncPreviewFrame(newIndex);
        }
    });

    watch(multiFramePreviewLoader.isProcessingList, (isLoading, wasLoading) => {
        if (wasLoading === true && isLoading === false) {
            if (!isManualMode.value) return;
            // 确保加载后确实有帧可供分析
            if (multiFramePreviewLoader.totalFrames.value > 0) {
            }
        }
    });

    // --- 6. 返回所有需要暴露给组件的属性和方法 ---
    return {
        // 状态和 Refs
        selectedMode,
        isManualMode,
        trajectoryFile,
        selectedAlgorithmType,
        selectedSpecificAlgorithm,
        imageRows,
        imageCols,
        selectedPrecision,
        satelliteType,
        satelliteModel,
        waveType,
        trajectoryEntry,
        currentMultiFrameIndex,
        allFeaturesData,
        isLoading,
        canInferInCurrentMode,
        zoomLevel,
        parsedLogs,
        connectionStatus,
        connectionAttempts,
        notifications,
        numberOfResultFrames,
        multiFrameResultImage,
        multiFrameRoiImage,
        isConfigEditorVisible,
        currentConfig,
        multiFramePreviewLoader,
        uploadProgress,
        isSettingsDialogVisible,
        isVersionDialogVisible,
        parameterSettings,
        canGenerateFullProduct,
        autoModeConnectionStatus,
        autoModeDatFileUrls,
        mapMarkerData,
        isMapVisible,
        latestTaskId,

        handleSaveSettings,
        downloadFullProduct,
        transmitFullProduct,
        handleModeChange,
        handleInfer,
        handleFolderSelectedViaDialog,
        handleClearAllMultiFrames,
        triggerFolderDialogForPathHint,
        triggerTrajectoryFileDialog,
        logOut,
        toggleSseConnection,
        clearAllLogsAndReports,
        zoomIn,
        zoomOut,
        openConfigEditor,
        handleSaveConfig,
        toggleAutoModeConnection,
        toggleMap: (visible) => { isMapVisible.value = visible; },
    };
}