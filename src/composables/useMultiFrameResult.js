import { ref, watch, readonly } from 'vue';

function getBaseName(filePath) {
    if (!filePath) return '';
    const lastSlash = filePath.lastIndexOf('/');
    const lastBackslash = filePath.lastIndexOf('\\');
    const lastSeparator = Math.max(lastSlash, lastBackslash);
    return filePath.substring(lastSeparator + 1);
}

export function useMultiFrameResult(
    resultPathFromApiRef,
    resultFilesFromApiRef,
    currentFrameIndexRef
) {
    const interestImageUrl = ref('');
    const outputImageUrl = ref('');

    const updateImageUrls = () => {
        const basePathForApi = resultPathFromApiRef.value;
        const filesInfo = resultFilesFromApiRef.value;
        const currentIndex = currentFrameIndexRef.value;

        interestImageUrl.value = '';
        outputImageUrl.value = '';

        if (basePathForApi && filesInfo &&
            Array.isArray(filesInfo.outputImageNames) &&
            currentIndex >= 0 && currentIndex < filesInfo.outputImageNames.length) {

            let pathForApiQuery = basePathForApi;
            if (!pathForApiQuery.endsWith('/') && !pathForApiQuery.endsWith('\\')) {
                const likelySeparator = pathForApiQuery.includes('/') ? '/' : '\\';
                if (pathForApiQuery.length > 0 && !pathForApiQuery.endsWith('/') && !pathForApiQuery.endsWith('\\')) {
                    pathForApiQuery += likelySeparator;
                }
            }

            const rawOutputFileName = filesInfo.outputImageNames[currentIndex];
            const cleanOutputFileName = getBaseName(rawOutputFileName); // 清理以防万一

            if (cleanOutputFileName) {
                outputImageUrl.value = `/api/get_image?folder=${encodeURIComponent(pathForApiQuery)}&file=${encodeURIComponent(cleanOutputFileName)}`;
            }

            if (Array.isArray(filesInfo.interestImageNames) && currentIndex < filesInfo.interestImageNames.length) {
                const rawInterestFileName = filesInfo.interestImageNames[currentIndex];
                const cleanInterestFileName = getBaseName(rawInterestFileName); // 清理以防万一
                if (cleanInterestFileName) {
                    interestImageUrl.value = `/api/get_image?folder=${encodeURIComponent(pathForApiQuery)}&file=${encodeURIComponent(cleanInterestFileName)}`;
                }
            }

        } else {
            if (!basePathForApi) console.warn("[useMultiFrameResult] 警告: 从API获取的结果路径 (resultPathFromApi) 为空");
            if (!filesInfo) console.warn("[useMultiFrameResult] 警告: filesInfo (resultFiles) 为空");
            else if (!Array.isArray(filesInfo.outputImageNames)) console.warn("[useMultiFrameResult FINAL] 警告: filesInfo.outputImageNames 不是有效数组");
            if (filesInfo && Array.isArray(filesInfo.outputImageNames) && !(currentIndex >= 0 && currentIndex < filesInfo.outputImageNames.length)) {
                console.warn(`[useMultiFrameResult] 警告: 当前索引 ${currentIndex} 超出 outputImageNames 数组范围 (长度 ${filesInfo.outputImageNames.length})`);
            }
        }
    };

    watch(
        [resultPathFromApiRef, resultFilesFromApiRef, currentFrameIndexRef],
        updateImageUrls,
        { immediate: true, deep: true }
    );

    return {
        interestImageUrl: readonly(interestImageUrl),
        outputImageUrl: readonly(outputImageUrl),
    };
}