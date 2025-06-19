import { ref } from 'vue';
import { useProcessStore } from '../store/processStore.js';

/**
 * @description 管理单帧模式下的所有操作，包括文件选择、删除和裁剪。
 * @param {import('vue').Ref} mainViewerRef - MainImageViewer 组件的 Vue 引用。
 * @param {object} notifications - useNotifications 返回的通知服务实例。
 * @returns {object} - 返回单帧模式下所有相关的状态和方法。
 */
export function useSingleFrameManager(mainViewerRef, notifications) {
    const store = useProcessStore();
    const isCroppingActive = ref(false);

    /**
     * 接收从 SingleFrameSystem 组件选择的文件。
     * @param {File} file - 用户选择的文件。
     */
    const receiveFileFromMainViewer = (file) => {
        store.setSingleFrameFile(file);
        if(isCroppingActive.value) {
            isCroppingActive.value = false; // 上传新文件时，自动退出裁剪模式
        }
    };

    /**
     * 删除当前的单帧图像和所有相关数据。
     */
    const handleDeleteSingleFrameImage = () => {
        store.clearSingleFrameData();
        if(isCroppingActive.value) {
            isCroppingActive.value = false;
        }
    };

    /**
     * 切换图像裁剪模式的激活状态。
     */
    const toggleCropping = () => {
        if (!store.singleFrameImageHandler.originalFile.value) {
            notifications.showNotification('❌ 请先上传图像再进行裁剪', 2000);
            return;
        }
        isCroppingActive.value = !isCroppingActive.value;
    };

    /**
     * 触发 MainImageViewer 组件中的确认裁剪方法。
     */
    const handleConfirmCrop = () => {
        if (isCroppingActive.value && mainViewerRef.value) {
            mainViewerRef.value.confirmCrop();
        }
    };

    /**
     * 当 MainImageViewer 确认裁剪完成后的回调函数。
     * @param {object} cropResult - 包含裁剪后图像信息的对象。
     * @param {string} cropResult.croppedImageBase64 - 裁剪后图像的 Base64 编码。
     */
    const onSingleFrameCropConfirmed = ({ croppedImageBase64 }) => {
        store.setCroppedImage(croppedImageBase64);
        isCroppingActive.value = false;
        notifications.showNotification('✅ 截取成功', 1500);
    };

    return {
        isCroppingActive,
        receiveFileFromMainViewer,
        handleDeleteSingleFrameImage,
        toggleCropping,
        handleConfirmCrop,
        onSingleFrameCropConfirmed,
    };
}