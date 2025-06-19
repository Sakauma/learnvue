import { useProcessStore } from '../store/processStore.js';

/**
 * @description 管理多帧模式下的所有操作，如文件夹选择和路径处理。
 * @param {import('vue').Ref} multiFrameSystemRef - MultiFrameSystem 组件的 Vue 引用。
 * @param {import('vue').Ref} folderInputRef - 隐藏的文件夹 input 元素的 Vue 引用。
 * @returns {object} - 返回多帧模式下所有相关的方法。
 */
export function useMultiFrameManager(multiFrameSystemRef, folderInputRef) {
    const store = useProcessStore();

    /**
     * 触发隐藏的文件夹选择对话框。
     */
    const triggerFolderDialogForPathHint = () => {
        if (folderInputRef.value) {
            folderInputRef.value.click();
        }
    };

    /**
     * 处理用户通过对话框选择文件夹后的事件。
     * @param {Event} event - 文件输入框的 change 事件。
     */
    const handleFolderSelectedViaDialog = (event) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            // 从文件路径中提取文件夹名称作为提示
            const firstFilePath = files[0].webkitRelativePath;
            if (firstFilePath) {
                store.manualFolderPath = firstFilePath.split('/')[0];
            }
        }
        // 重置 input 的值，确保下次选择相同文件夹时仍能触发 change 事件
        if(event.target) event.target.value = '';
    };

    /**
     * 确认用户在输入框中输入的识别路径。
     */
    const confirmManualFolderPath = () => {
        if (!store.manualFolderPath) {
            console.warn("识别路径为空，无法确认。");
            return;
        }
        // 此处可以添加更复杂的逻辑，如调用后端API验证路径等
        console.log(`已确认用于识别的文件夹路径: ${store.manualFolderPath}`);
    };

    /**
     * 清理所有多帧相关的预览和结果数据。
     * @param {object} payload - 包含清理信息的对象。
     * @param {boolean} payload.previewCleared - 是否清理了预览帧。
     */
    const handleClearAllMultiFrames = (payload) => {
        if (payload.previewCleared && multiFrameSystemRef.value) {
            multiFrameSystemRef.value.clearPreviewFrames();
        }
        store.clearMultiFrameResults();
        store.manualFolderPath = '';
    };

    return {
        triggerFolderDialogForPathHint,
        handleFolderSelectedViaDialog,
        confirmManualFolderPath,
        handleClearAllMultiFrames,
    };
}