import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useProcessStore } from '../store/processStore.js';
import { storeToRefs } from 'pinia';

// 导入所有需要的其他 Composables
import { useMultiFrameResult } from './useMultiFrameResult.js';
import { useNotifications } from './useNotifications.js';
import { useImageHandler } from './useImageHandler.js';
import { useSseLogs } from './useSseLogs.js';
import { useZoom } from "./useZoom.js";
// --- 新增：导入数据产品处理器 ---
import { useDataProduct } from './useDataProduct.js';
import {useMultiFrameLoader} from "./useMultiFrameLoader.js";

/**
 * @description 图像处理页面的业务流程编排器 (Orchestrator)。
 * 这是一个核心的 Composable，它封装了页面的所有响应式状态、业务逻辑、
 * 事件处理和派生状态。其主要目的是让主视图组件 (ImgProcess.vue) 保持纯净，
 * 只负责UI渲染和将事件绑定到此处的处理函数，从而实现视图与逻辑的深度分离。
 *
 * @param {import('vue').Ref} mainViewerRef - 对 MainImageViewer 组件的模板引用 (ref)，用于调用其内部方法（如确认裁剪）。
 * @param {import('vue').Ref} multiFrameSystemRef - 对 MultiFrameSystem 组件的模板引用 (ref)，用于调用其方法（如加载、清空、同步帧）。
 * @param {import('vue').Ref} dataColumnRef - 对 DataColumn 组件的模板引用 (ref)，用于调用其方法（如清空报告）。
 * @param {import('vue').Ref} folderInputRef - 对隐藏的文件夹输入框元素的模板引用 (ref)，用于程序化地触发文件选择对话框。
 * @returns {object} 返回一个包含所有需要暴露给视图组件的状态和方法的对象。
 */
export function useProcessOrchestrator(mainViewerRef, multiFrameSystemRef, dataColumnRef, folderInputRef) {

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
        selectedMode, // 当前选择的处理模式 ('singleFrame' 或 'multiFrame')
        isMultiFrameMode, // 计算属性，判断当前是否为多帧模式
        selectedAlgorithmType, // 选择的算法大类
        selectedSpecificAlgorithm, // 选择的具体算法名称
        imageRows, // 图像行数
        imageCols, // 图像列数
        selectedPrecision, // 选择的图像精度
        //manualFolderPath, // 用户手动输入的文件夹路径
        resultFolderPathFromApi, // 从后端API获取的结果文件夹路径
        resultFilesFromApi, // 从后端API获取的结果文件列表
        currentMultiFrameIndex, // 多帧模式下，当前查看的结果帧索引
        allFeaturesData, // 从后端获取的所有特征数据
        isLoading, // 全局加载状态，用于显示加载指示器
        uploadProgress, // <-- 新增
        canInferInCurrentMode, // 计算属性，判断在当前模式下是否满足执行识别的条件
    } = storeToRefs(store);

    /**
     * @description 缩放功能 Composable，提供缩放级别状态和操作方法。
     */
    const { zoomLevel, zoomIn, zoomOut } = useZoom();
    /**
     * @description 单帧图像处理 Composable，封装了文件选择、MD5计算和预览图生成逻辑。
     */
    const singleFrameImageHandler = useImageHandler(notifications.showNotification);
    /**
     * @description SSE (Server-Sent Events) 日志 Composable，用于从后端接收实时日志。
     */
    const { logs: parsedLogs, connectionStatus, connectionAttempts, connect, disconnect, clearLogs } = useSseLogs('/sse/logs');
    /**
     * @description 多帧结果图像 URL 管理 Composable。
     * 根据结果路径和当前帧索引，动态计算感兴趣区域（ROI）和结果图像的完整 URL。
     */
    const { interestImageUrl: multiFrameRoiImage, outputImageUrl: multiFrameResultImage } = useMultiFrameResult(
        resultFolderPathFromApi,
        resultFilesFromApi,
        currentMultiFrameIndex
    );

    // --- 新增：实例化数据产品处理器 ---
    // 将 store 中的 allFeaturesData 和 currentMultiFrameIndex 作为响应式数据源传入
    const {
        canGenerateFullProduct,
            downloadFullProduct,
            transmitFullProduct,
    } = useDataProduct(allFeaturesData);

    const multiFramePreviewLoader = useMultiFrameLoader(notifications.showNotification);

    /**
     * @description 存储附加图像卡片的数组（例如裁剪后的图像、识别结果图）。
     * 这是单帧模式下右侧结果展示区的唯一数据源。
     * @type {import('vue').Ref<Array<{id: string, url: string, label: string}>>}
     */
    const additionalImages = ref([]);

    /**
     * @description 控制单帧模式下裁剪功能是否激活的响应式状态。
     * @type {import('vue').Ref<boolean>}
     */
    const isCroppingActive = ref(false);

    // --- 3. 计算属性 (Computed Properties) ---
    /**
     * @description 计算多帧模式下结果的总帧数。
     * @returns {number} 结果帧的数量。
     */
    const numberOfResultFrames = computed(() => resultFilesFromApi.value?.outputImageNames?.length || 0);

    // --- 4. 事件处理函数 (Methods) ---
    /**
     * @description 处理模式切换（单帧/多帧）。
     * @param {'singleFrame' | 'multiFrame'} newMode - 新的模式。
     */
    const handleModeChange = (newMode) => {
        store.setMode(newMode);
        isCroppingActive.value = false; // 切换模式时重置裁剪状态
        additionalImages.value = []; // 清空旧模式下的结果图像
    };

    /**
     * @description 执行核心的识别（推断）操作。
     * 会根据当前模式（单帧/多帧）调用 store 中对应的 action。
     */
    const handleInfer = async () => {
        if (imageRows.value <= 0 || imageCols.value <= 0) {
            notifications.showNotification('请输入有效的图像行数和列数。');
            return;
        }

        if (isMultiFrameMode.value) {
            await store.inferMultiFrame();
            // 注意：多帧模式的结果展示不通过 additionalImages，而是由 MultiFrameSystem 内部处理
        } else {
            // 等待 store action 返回结果，并直接更新 additionalImages
            const result = await store.inferSingleFrame();
            if (result && result.success && result.resultImage) {
                additionalImages.value.push({
                    id: `result-${Date.now()}`,
                    url: result.resultImage,
                    label: '结果图像'
                });
            }
        }
    };

    /**
     * @description 从 MainImageViewer 组件接收用户上传的文件。
     * @param {File} file - 用户通过拖拽或点击上传的文件对象。
     */
    const receiveFileFromMainViewer = async (file) => {
        if (!file) return;
        handleModeChange('singleFrame'); // 自动切换到单帧模式
        // 使用 image handler 处理文件
        await singleFrameImageHandler.handleFileSelected(file, imageRows.value, imageCols.value, selectedPrecision.value);
        // 将处理后的文件和 MD5 保存到 store
        store.setSingleFrameFile(singleFrameImageHandler.originalFile.value, singleFrameImageHandler.fileMD5.value);
        additionalImages.value = []; // 上传新图片时，清空旧的结果
    };

    /**
     * @description 删除当前单帧图像及其所有相关数据。
     */
    const handleDeleteSingleFrameImage = () => {
        singleFrameImageHandler.deleteImage(); // 清空 handler 中的图像
        store.resetSingleFrameData(); // 重置 store 中的单帧数据
        isCroppingActive.value = false; // 关闭裁剪状态
        additionalImages.value = []; // 清空附加图像结果
    };

    /**
     * @description 切换单帧图像的裁剪模式。
     */
    const toggleCropping = () => {
        if (!singleFrameImageHandler.originalFile.value) {
            notifications.showNotification('请先上传图像再进行裁剪。');
            return;
        }
        isCroppingActive.value = !isCroppingActive.value;
    };

    /**
     * @description 触发 MainImageViewer 组件执行确认裁剪的操作。
     */
    const handleConfirmCrop = () => {
        if (mainViewerRef.value) {
            mainViewerRef.value.confirmCrop();
        }
    };

    /**
     * @description 接收 MainImageViewer 确认裁剪后发送的数据。
     * @param {object} payload - 包含裁剪后图像和坐标的对象。
     * @param {string} payload.croppedImageBase64 - 裁剪后图像的 Base64 编码。
     * @param {object} payload.coordinates - 裁剪区域的坐标。
     */
    const onSingleFrameCropConfirmed = ({ croppedImageBase64, coordinates }) => {
        // 将裁剪后的图像作为一个新的卡片添加到结果区
        additionalImages.value.push({
            id: `crop-${Date.now()}`,
            url: croppedImageBase64,
            label: '感兴趣区域'
        });
        store.setCropCoordinates(coordinates); // 将裁剪坐标保存到 store
        isCroppingActive.value = false; // 关闭裁剪模式
        notifications.showNotification('✅ 感兴趣区域已截取');
    };

    const handleFolderSelectedViaDialog = (event) => {
            const files = event.target.files;
            if (!files || files.length === 0) return;
            handleModeChange('multiFrame');
            // 使用独立的 loader 处理预览
            multiFramePreviewLoader.processSelectedFiles(files, imageRows.value, imageCols.value, selectedPrecision.value);
            if (event.target) event.target.value = '';
        };

    const handleClearAllMultiFrames = () => {
            multiFramePreviewLoader.clearFrames();
            store.resetMultiFrameData();

            notifications.showNotification('预览及结果已清空。');
        };

    /**
     * @description 程序化地触发隐藏的文件夹输入框的点击事件。
     */
    const triggerFolderDialogForPathHint = () => {
        folderInputRef.value?.click();
    };

    /**
     * @description 登出并返回主页。
     */
    const logOut = () => {
        router.replace("/home");
    };

    /**
     * @description 处理一个自定义操作（当前为占位符）。
     */
    const handleCustomAction3 = () => {
        // TODO: “感兴趣图像区域计算”功能尚未实现，等待后续实现
        notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000);
    };

    /**
     * @description 切换 SSE 日志的连接状态（连接/断开）。
     */
    const toggleSseConnection = () => {
        (['connecting', 'connected'].includes(connectionStatus.value)) ? disconnect() : connect();
    };

    /**
     * @description 清空所有SSE日志和DataColumn中的报告。
     */
    const clearAllLogsAndReports = () => {
        clearLogs();
        if (dataColumnRef.value?.report) {
            dataColumnRef.value.report.clearReports();
        }
        notifications.showNotification('日志和报告已清空');
    };

    // --- 配置文件相关状态和方法 ---
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
    onMounted(connect);
    /**
     * @description 组件卸载时，断开 SSE 日志服务，防止内存泄漏。
     */
    onUnmounted(disconnect);

    watch(multiFramePreviewLoader.fileList, (newFiles) => {
        if (newFiles && newFiles.length > 0) {
            store.setMultiFrameFiles(newFiles);
        }
    }, { deep: true });

    watch(currentMultiFrameIndex, (newIndex) => {
        if (isMultiFrameMode.value && multiFrameSystemRef.value && newIndex >= 0) {
            // 【关键】调用 multiFrameSystemRef 的方法来同步预览帧
            // 注意：multiFrameSystemRef 上的这个方法也需要修改
            multiFrameSystemRef.value.syncPreviewFrame(newIndex);
        }
    });

    // --- 6. 返回所有需要暴露给组件的属性和方法 ---
    return {
        // 状态和 Refs
        selectedMode,
        isMultiFrameMode,
        selectedAlgorithmType,
        selectedSpecificAlgorithm,
        imageRows,
        imageCols,
        selectedPrecision,
        currentMultiFrameIndex,
        allFeaturesData,
        isLoading,
        canInferInCurrentMode,
        zoomLevel,
        singleFrameImageHandler,
        parsedLogs,
        connectionStatus,
        connectionAttempts,
        notifications,
        additionalImages,
        isCroppingActive,
        numberOfResultFrames,
        multiFrameResultImage,
        multiFrameRoiImage,
        isConfigEditorVisible,
        currentConfig,
        multiFramePreviewLoader,
        uploadProgress, // <-- 新增

        // 暴露数据产品相关的状态和方法
        canGenerateFullProduct,
        downloadFullProduct,
        transmitFullProduct,

        // 方法
        handleModeChange,
        handleInfer,
        receiveFileFromMainViewer,
        handleDeleteSingleFrameImage,
        onSingleFrameCropConfirmed,
        handleFolderSelectedViaDialog,
        handleClearAllMultiFrames,
        triggerFolderDialogForPathHint,
        logOut,
        handleCustomAction3,
        toggleSseConnection,
        clearAllLogsAndReports,
        zoomIn,
        zoomOut,
        toggleCropping,
        handleConfirmCrop,
        openConfigEditor,
        handleSaveConfig,
    };
}