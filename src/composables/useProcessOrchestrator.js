import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useProcessStore } from '../store/processStore.js';
import { storeToRefs } from 'pinia';

// 导入所有需要的其他 Composables
import { useNotifications } from './useNotifications.js';
import { useImageHandler } from './useImageHandler.js';
import { useMultiFrameResult } from './useMultiFrameResult.js';
import { useSseLogs } from './useSseLogs.js';
import { useZoom } from "./useZoom.js";

/**
 * @description 图像处理页面的业务流程编排器 (Orchestrator)。
 * 这是一个核心的 Composable，它像一个“指挥官”，封装了页面的所有业务逻辑、
 * 事件处理和派生状态。目的是让主视图组件 (ImgProcess.vue) 保持纯净，
 * 只负责UI渲染和事件绑定，从而实现视图和逻辑的深度分离。
 * @param {import('vue').Ref} mainViewerRef - 对 MainImageViewer 组件的引用
 * @param {import('vue').Ref} multiFrameSystemRef - 对 MultiFrameSystem 组件的模板引用 (ref)
 * @param {import('vue').Ref} dataColumnRef - 对 DataColumn 组件的模板引用 (ref)
 * @param {import('vue').Ref} folderInputRef - 对隐藏的文件夹输入框元素的模板引用 (ref)
 */
export function useProcessOrchestrator(mainViewerRef, multiFrameSystemRef, dataColumnRef, folderInputRef) {

    // --- 1. 初始化核心模块 ---
    // 初始化工具
    const store = useProcessStore(); // 获取 Pinia store 实例，用于状态管理
    const router = useRouter(); // 获取路由实例，用于页面跳转
    const notifications = useNotifications(); // 获取通知模块的实例

    // --- 2. 状态管理 ---
    // 定义和管理页面的所有状态

    // 从 Pinia Store 中解构出所有需要的状态和 getter。
    // 使用 storeToRefs 是为了确保解构出的所有属性都保持响应式，
    // 这样当 store 中的状态变化时，UI 依然可以自动更新。
    const {
        selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
        imageRows, imageCols, selectedPrecision, manualFolderPath,
        resultFolderPathFromApi, resultFilesFromApi, currentMultiFrameIndex,
        allFeaturesData, isLoading, canInferInCurrentMode,
        singleFrameResultImageUrl, singleFrameTextResults
    } = storeToRefs(store);

    // 初始化那些与核心业务逻辑关系不大，主要服务于本地UI交互的 composable
    const { zoomLevel, zoomIn, zoomOut } = useZoom(); // 图像缩放
    const singleFrameImageHandler = useImageHandler(notifications.showNotification); // 单帧图像上传和预览URL生成
    const { logs: parsedLogs, connectionStatus, connectionAttempts, connect, disconnect, clearLogs } = useSseLogs('/sse/logs'); // 后端SSE日志

    // 多帧结果图像URL的生成逻辑
    const { interestImageUrl: multiFrameInterestUrl, outputImageUrl: multiFrameOutputUrl } = useMultiFrameResult(resultFolderPathFromApi, resultFilesFromApi, currentMultiFrameIndex);

    // 创建一个数组，用于存放所有动态生成的附加图像
    const additionalImages = ref([]);

    // 单帧模式下裁剪后的预览图 URL
    const singleFrameCroppedPreviewUrl = ref(null);

    // 管理单帧模式是否正在裁剪
    const isCroppingActive = ref(false);

    // --- 3. 计算属性 (Computed Properties) ---
    // 这些计算属性像“派生状态”，它们根据基础状态的变化自动计算出新的值，用于UI展示

    // 计算当前应在“感兴趣区域”框中显示的图像URL
    const currentDisplayCroppedOrInterestImageUrl = computed(() => {
        if (isMultiFrameMode.value) {
            // 多帧模式下，显示多帧结果的感兴趣区图像
            return multiFrameInterestUrl.value;
        }
        // 单帧模式下，返回裁剪预览图的URL
        return singleFrameCroppedPreviewUrl.value;
    });

    // 计算当前应在“结果图像”框中显示的图像URL
    const currentDisplayResultImageUrl = computed(() => isMultiFrameMode.value ? multiFrameOutputUrl.value : singleFrameResultImageUrl.value);

    // 计算当前应显示的文本结果
    const currentDisplayTextResults = computed(() => isMultiFrameMode.value ? [] : singleFrameTextResults.value);

    // 计算当前是否处于“结果展示”模式（主要用于多帧，判断是否有结果返回）
    const isResultsModeActive = computed(() => numberOfResultFrames.value > 0);

    // 计算结果的总帧数
    const numberOfResultFrames = computed(() => resultFilesFromApi.value?.outputImageNames?.length || 0);


    // --- 4. 事件处理函数 (Methods) ---
    // 这些函数是响应用户在UI上操作的“动作”，它们通常会调用 store 的 actions 来改变状态

    /**
     * 处理模式切换
     * @param {string} newMode - 新的模式值 ('singleFrame' 或 'multiFrame')
     */
    const handleModeChange = (newMode) => {
        store.setMode(newMode);
        isCroppingActive.value = false;
        additionalImages.value = []; // 清空附加图像
    };

    /**
     * 处理主识别按钮的点击事件，分发到 store 中对应的 action
     */
    const handleInfer = async () => { // 添加 async
        if (imageRows.value <= 0 || imageCols.value <= 0) { /* ... */ return; }

        if (isMultiFrameMode.value) {
            await store.inferMultiFrame();
        } else {
            // 等待 store action 返回结果
            const result = await store.inferSingleFrame();
            if (result.success && result.resultImage) {
                // 将返回的结果图像添加到 additionalImages 数组中
                additionalImages.value.push({
                    id: `result-${Date.now()}`,
                    url: result.resultImage,
                    label: '结果图像'
                });
            }
        }
    };

    /**
     * 接收从 MainImageViewer 组件上传的单帧文件
     * @param {File} file - 用户选择的文件
     */
    const receiveFileFromMainViewer = async (file) => {
        if (!file) return;
        handleModeChange('singleFrame');
        await singleFrameImageHandler.handleFileSelected(file, imageRows.value, imageCols.value, selectedPrecision.value);
        store.setSingleFrameFile(singleFrameImageHandler.originalFile.value, singleFrameImageHandler.fileMD5.value);
    };

    /**
     * 处理单帧图像的删除
     */
    const handleDeleteSingleFrameImage = () => {
        singleFrameImageHandler.deleteImage();
        store.resetSingleFrameData();
        isCroppingActive.value = false;
        additionalImages.value = []; // 清空附加图像
    };

    /**
     * 切换裁剪状态
     */
    const toggleCropping = () => {
        if (!singleFrameImageHandler.originalFile.value) {
            notifications.showNotification('请先上传图像再进行裁剪。');
            return;
        }
        isCroppingActive.value = !isCroppingActive.value;
    };

    /**
     * 命令 MainImageViewer 执行并确认裁剪
     */
    const handleConfirmCrop = () => {
        if (mainViewerRef.value) {
            mainViewerRef.value.confirmCrop();
        }
    };

    /**
     * 处理单帧图像裁剪确认
     * @param {{ croppedImageBase64: string, coordinates: object }} cropData - 裁剪数据
     */
    const onSingleFrameCropConfirmed = ({ croppedImageBase64, coordinates }) => {
        additionalImages.value.push({
            id: `crop-${Date.now()}`,
            url: croppedImageBase64,
            label: '感兴趣区域'
        });
        store.cropCoordinates = coordinates;
        isCroppingActive.value = false;
        notifications.showNotification('✅ 感兴趣区域已截取');
    };

    /**
     * 处理用户通过对话框选择文件夹后的事件
     * @param {Event} event - 文件输入事件
     */
    const handleFolderSelectedViaDialog = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        handleModeChange('multiFrame');
        let detectedPath = "";
        if (files[0].path) {
            const firstFilePath = files[0].path;
            const separator = firstFilePath.includes('/') ? '/' : '\\';
            detectedPath = firstFilePath.substring(0, firstFilePath.lastIndexOf(separator));
        }
        if (detectedPath) {
            manualFolderPath.value = detectedPath;
            notifications.showNotification(`路径提示已填充: ${detectedPath}。`, 3500);
        }
        // [Bug 3 修复] 使用从外部传入的、正确的 multiFrameSystemRef 来调用子组件方法
        if (multiFrameSystemRef.value) {
            multiFrameSystemRef.value.loadFolder(files, selectedPrecision.value);
        }
        if (event.target) event.target.value = '';
    };

    /**
     * 确认手动输入的文件夹路径，并存入 store
     */
    const confirmManualFolderPath = () => {
        store.setOriginalFolderPath(manualFolderPath.value);
    };

    /**
     * 处理清除所有多帧数据的事件
     */
    const handleClearAllMultiFrames = () => {
        if (multiFrameSystemRef.value) {
            multiFrameSystemRef.value.clearPreviewFrames();
        }
        store.resetMultiFrameData();
    };

    /**
     * 触发隐藏的文件夹选择对话框
     */
    const triggerFolderDialogForPathHint = () => {
        folderInputRef.value?.click();
    };

    /**
     * 登出/返回主页
     */
    const logOut = () => {
        router.replace("/home");
    };

    const handleCustomAction3 = () => {
        notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000);
    };

    /**
     * 切换SSE日志连接状态
     */
    const toggleSseConnection = () => {
        (['connecting', 'connected'].includes(connectionStatus.value)) ? disconnect() : connect();
    };

    /**
     * 清除所有日志和报告
     */
    const clearAllLogsAndReports = () => {
        clearLogs();
        if (dataColumnRef.value?.report) {
            dataColumnRef.value.report.clearReports();
        }
        notifications.showNotification('日志和报告已清空');
    };

    // --- 5. 生命周期钩子 ---
    // 利用 onMounted 和 onUnmounted 来自动管理SSE连接的建立和销毁
    onMounted(connect);
    onUnmounted(disconnect);

    // --- 6. 返回所有需要暴露给组件的属性和方法 ---
    // 这是 composable 的“接口”，定义了哪些东西可以被外部（ImgProcess.vue）访问和使用
    return {
        // 状态和 Refs
        selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
        imageRows, imageCols, selectedPrecision, manualFolderPath,
        currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,
        zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,
        notifications,

        // 计算属性
        currentDisplayCroppedOrInterestImageUrl, currentDisplayResultImageUrl,
        currentDisplayTextResults, isResultsModeActive, numberOfResultFrames,
        isCroppingActive,

        // 方法
        handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,
        onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,
        handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,
        toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut,
        toggleCropping, handleConfirmCrop
    };
}