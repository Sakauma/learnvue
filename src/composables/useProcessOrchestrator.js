import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useProcessStore } from '../store/processStore.js';
import { storeToRefs } from 'pinia';

// 导入所有需要的其他 Composables
import { useMultiFrameResult } from './useMultiFrameResult.js';
import { useNotifications } from './useNotifications.js';
import { useImageHandler } from './useImageHandler.js';
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
    const store = useProcessStore();
    const router = useRouter();
    const notifications = useNotifications();

    // --- 2. 状态管理 ---
    const {
        selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
        imageRows, imageCols, selectedPrecision, manualFolderPath,
        resultFolderPathFromApi, resultFilesFromApi, currentMultiFrameIndex,
        allFeaturesData, isLoading, canInferInCurrentMode,
    } = storeToRefs(store);

    const { zoomLevel, zoomIn, zoomOut } = useZoom();
    const singleFrameImageHandler = useImageHandler(notifications.showNotification);
    const { logs: parsedLogs, connectionStatus, connectionAttempts, connect, disconnect, clearLogs } = useSseLogs('/sse/logs');
    const { interestImageUrl: multiFrameRoiImage, outputImageUrl: multiFrameResultImage } = useMultiFrameResult(
        resultFolderPathFromApi,
        resultFilesFromApi,
        currentMultiFrameIndex
    );

    // additionalImages 现在是所有结果卡片的唯一来源
    const additionalImages = ref([]);

    const isCroppingActive = ref(false);

    // --- 3. 计算属性 (Computed Properties) ---
    const numberOfResultFrames = computed(() => resultFilesFromApi.value?.outputImageNames?.length || 0);

    // --- 4. 事件处理函数 (Methods) ---

    const handleModeChange = (newMode) => {
        store.setMode(newMode);
        isCroppingActive.value = false;
        additionalImages.value = []; // 清空附加图像
    };

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
            if (result.success && result.resultImage) {
                additionalImages.value.push({
                    id: `result-${Date.now()}`,
                    url: result.resultImage,
                    label: '结果图像'
                });
            }
        }
    };

    const receiveFileFromMainViewer = async (file) => {
        if (!file) return;
        handleModeChange('singleFrame');
        await singleFrameImageHandler.handleFileSelected(file, imageRows.value, imageCols.value, selectedPrecision.value);
        store.setSingleFrameFile(singleFrameImageHandler.originalFile.value, singleFrameImageHandler.fileMD5.value);
        additionalImages.value = []; // 上传新图片时，清空旧的结果
    };

    const handleDeleteSingleFrameImage = () => {
        singleFrameImageHandler.deleteImage();
        store.resetSingleFrameData();
        isCroppingActive.value = false;
        additionalImages.value = []; // 清空附加图像
    };

    const toggleCropping = () => {
        if (!singleFrameImageHandler.originalFile.value) {
            notifications.showNotification('请先上传图像再进行裁剪。');
            return;
        }
        isCroppingActive.value = !isCroppingActive.value;
    };

    const handleConfirmCrop = () => {
        if (mainViewerRef.value) {
            mainViewerRef.value.confirmCrop();
        }
    };

    // [BUG修复] 裁剪确认后，将图片添加到 additionalImages 数组
    const onSingleFrameCropConfirmed = ({ croppedImageBase64, coordinates }) => {
        additionalImages.value.push({
            id: `crop-${Date.now()}`,
            url: croppedImageBase64,
            label: '感兴趣区域'
        });
        store.setCropCoordinates(coordinates); // 将坐标保存到 store
        isCroppingActive.value = false;
        notifications.showNotification('✅ 感兴趣区域已截取');
    };

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
        if (multiFrameSystemRef.value) {
            multiFrameSystemRef.value.loadFolder(files, selectedPrecision.value);
        }
        if (event.target) event.target.value = '';
    };

    const confirmManualFolderPath = () => {
        store.setOriginalFolderPath(manualFolderPath.value);
    };

    const handleClearAllMultiFrames = () => {
        if (multiFrameSystemRef.value) {
            multiFrameSystemRef.value.clearPreviewFrames();
        }
        store.resetMultiFrameData();
    };

    const triggerFolderDialogForPathHint = () => {
        folderInputRef.value?.click();
    };

    const logOut = () => {
        router.replace("/home");
    };

    const handleCustomAction3 = () => {
        // TODO: “感兴趣图像区域计算”功能尚未实现，等待后续实现
        notifications.showNotification('功能 “感兴趣图像区域计算” 尚未实现。', 2000);
    };

    const toggleSseConnection = () => {
        (['connecting', 'connected'].includes(connectionStatus.value)) ? disconnect() : connect();
    };

    const clearAllLogsAndReports = () => {
        clearLogs();
        if (dataColumnRef.value?.report) {
            dataColumnRef.value.report.clearReports();
        }
        notifications.showNotification('日志和报告已清空');
    };

    // --- 5. 生命周期钩子 ---
    onMounted(connect);
    onUnmounted(disconnect);
    /**
     * @description 侦听多帧模式下 "结果帧" 索引的变化
     * 当用户在结果导航条上切换时，同步更新上方预览区的 "原始帧"
     */
    watch(currentMultiFrameIndex, (newIndex) => {
        if (isMultiFrameMode.value && multiFrameSystemRef.value && newIndex >= 0) {
            multiFrameSystemRef.value.syncPreviewFrame(newIndex);
        }
    });

    // --- 6. 返回所有需要暴露给组件的属性和方法 ---
    return {
        // 状态和 Refs
        selectedMode, isMultiFrameMode, selectedAlgorithmType, selectedSpecificAlgorithm,
        imageRows, imageCols, selectedPrecision, manualFolderPath,
        currentMultiFrameIndex, allFeaturesData, isLoading, canInferInCurrentMode,
        zoomLevel, singleFrameImageHandler, parsedLogs, connectionStatus, connectionAttempts,
        notifications,
        additionalImages,
        isCroppingActive,
        numberOfResultFrames,
        multiFrameResultImage,
        multiFrameRoiImage,

        // 方法
        handleModeChange, handleInfer, receiveFileFromMainViewer, handleDeleteSingleFrameImage,
        onSingleFrameCropConfirmed, handleFolderSelectedViaDialog, confirmManualFolderPath,
        handleClearAllMultiFrames, triggerFolderDialogForPathHint, logOut, handleCustomAction3,
        toggleSseConnection, clearAllLogsAndReports, zoomIn, zoomOut,
        toggleCropping, handleConfirmCrop
    };
}