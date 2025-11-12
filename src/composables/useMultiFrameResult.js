import { ref, watch, readonly } from 'vue';

/**
 * 从文件路径中提取基本名称（文件名部分）
 * @param {string} filePath - 完整的文件路径
 * @returns {string} - 文件的基本名称，如果没有路径则返回空字符串
 */
function getBaseName(filePath) {
    if (!filePath) return '';
    // 查找最后一个斜杠（正斜杠或反斜杠）的位置
    const lastSlash = filePath.lastIndexOf('/');
    const lastBackslash = filePath.lastIndexOf('\\');
    const lastSeparator = Math.max(lastSlash, lastBackslash);
    // 从最后一个分隔符之后的部分开始截取，得到文件名
    return filePath.substring(lastSeparator + 1);
}

/**
 * 用于管理多帧结果图像URL的组合式函数
 * @param resultPathFromApiRef - 从API获取的结果基础路径的响应式引用
 * @param resultFilesFromApiRef - 从API获取的结果文件信息的响应式引用
 * @param currentFrameIndexRef - 当前帧索引的响应式引用
 * @returns {Object} - 包含只读的interestImageUrl和outputImageUrl
 */
export function useMultiFrameResult(
    resultPathFromApiRef,
    resultFilesFromApiRef,
    currentFrameIndexRef
) {
    // 创建响应式引用，用于存储兴趣图像和输出图像的URL
    const interestImageUrl = ref('');
    const outputImageUrl = ref('');

    /**
     * 根据当前API结果和帧索引更新图像URL
     * 这个函数会在依赖项变化时被调用
     */
    const updateImageUrls = () => {
        // 获取传入的响应式引用的当前值
        const basePathForApi = resultPathFromApiRef.value;
        const filesInfo = resultFilesFromApiRef.value;
        const currentIndex = currentFrameIndexRef.value;

        // 重置URL，避免旧数据残留
        interestImageUrl.value = '';
        outputImageUrl.value = '';

        // 检查必要的条件是否满足：基础路径存在，文件信息存在且包含outputImageNames数组，
        // 当前索引有效且在outputImageNames数组范围内
        if (basePathForApi && filesInfo &&
            Array.isArray(filesInfo.outputImageNames) &&
            currentIndex >= 0 && currentIndex < filesInfo.outputImageNames.length) {

            // 准备API查询路径
            let pathForApiQuery = basePathForApi;
            // 确保路径以分隔符结尾
            if (!pathForApiQuery.endsWith('/') && !pathForApiQuery.endsWith('\\')) {
                // 根据路径中已有的分隔符类型决定添加哪种
                const likelySeparator = pathForApiQuery.includes('/') ? '/' : '\\';
                if (pathForApiQuery.length > 0 && !pathForApiQuery.endsWith('/') && !pathForApiQuery.endsWith('\\')) {
                    pathForApiQuery += likelySeparator;
                }
            }

            // 获取当前索引对应的输出图像文件名
            const rawOutputFileName = filesInfo.outputImageNames[currentIndex];
            // 使用getBaseName清理文件名，只保留基本名称
            const cleanOutputFileName = getBaseName(rawOutputFileName);

            // 如果清理后的文件名有效，则构建输出图像的API URL
            if (cleanOutputFileName) {
                outputImageUrl.value = `/api/get_image?folder=${encodeURIComponent(pathForApiQuery)}&file=${encodeURIComponent(cleanOutputFileName)}`;
                // 注意：这里假设后端API端点为/api/get_image，并接受folder和file参数
                // encodeURIComponent确保路径和文件名中的特殊字符被正确编码
            }

            // 检查兴趣图像文件名数组是否存在且当前索引有效
            if (Array.isArray(filesInfo.interestImageNames) && currentIndex < filesInfo.interestImageNames.length) {
                // 获取当前索引对应的兴趣图像文件名
                const rawInterestFileName = filesInfo.interestImageNames[currentIndex];
                // 使用getBaseName清理文件名
                const cleanInterestFileName = getBaseName(rawInterestFileName);
                // 如果清理后的文件名有效，则构建兴趣图像的API URL
                if (cleanInterestFileName) {
                    interestImageUrl.value = `/api/get_image?folder=${encodeURIComponent(pathForApiQuery)}&file=${encodeURIComponent(cleanInterestFileName)}`;
                }
            }

        } else {
            // 如果条件不满足，输出相应的警告信息，帮助调试
            if (!basePathForApi) console.warn("[useMultiFrameResult] 警告: 从API获取的结果路径 (resultPathFromApi) 为空");
            if (!filesInfo) console.warn("[useMultiFrameResult] 警告: filesInfo (resultFiles) 为空");
            else if (!Array.isArray(filesInfo.outputImageNames)) console.warn("[useMultiFrameResult] 警告: filesInfo.outputImageNames 不是有效数组");
            if (filesInfo && Array.isArray(filesInfo.outputImageNames) && !(currentIndex >= 0 && currentIndex < filesInfo.outputImageNames.length)) {
                console.warn(`[useMultiFrameResult] 警告: 当前索引 ${currentIndex} 超出 outputImageNames 数组范围 (长度 ${filesInfo.outputImageNames.length})`);
            }
        }
    };

    // 使用watch监听三个依赖项的变化
    watch(
        [resultPathFromApiRef, resultFilesFromApiRef, currentFrameIndexRef], // 监听数组中的所有引用
        updateImageUrls, // 当依赖项变化时调用的回调函数
        { immediate: true, deep: true } // 立即执行一次（immediate），并深度监听对象内部变化（deep）
    );

    // 返回一个对象，包含只读的图像URL引用
    // 使用readonly确保外部无法直接修改返回的引用值
    return {
        interestImageUrl: readonly(interestImageUrl),
        outputImageUrl: readonly(outputImageUrl),
    };
}