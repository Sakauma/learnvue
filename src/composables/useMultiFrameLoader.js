import { ref, computed, onUnmounted } from 'vue';
import SparkMD5 from 'spark-md5';

// ... (parseDatGrayscaleImage 和 generateMD5ForFile 函数保持不变)
function parseDatGrayscaleImage(datBuffer, rows = 213, cols = 252) {
    if (!datBuffer || !(datBuffer instanceof ArrayBuffer)) {
        console.error("[parseDatGrayscaleImage] Invalid datBuffer provided.");
        return null;
    }
    if (datBuffer.byteLength < rows * cols * Float64Array.BYTES_PER_ELEMENT) {
        console.error(`[parseDatGrayscaleImage] datBuffer is too short (length: ${datBuffer.byteLength}) for specified dimensions (${rows}x${cols}) and Float64Array type.`);
        return null;
    }
    const pixelData = new Float64Array(datBuffer);
    const totalPixels = rows * cols;
    if (pixelData.length < totalPixels) {
        console.error(`[parseDatGrayscaleImage] .dat 文件像素数据不足. Expected: ${totalPixels}, Got: ${pixelData.length}`);
        return null;
    }
    let maxVal = -Infinity, minVal = Infinity;
    for (let i = 0; i < totalPixels; i++) {
        if (pixelData[i] > maxVal) maxVal = pixelData[i];
        if (pixelData[i] < minVal) minVal = pixelData[i];
    }
    const range = maxVal - minVal;
    const allSameValue = range === 0;
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("[parseDatGrayscaleImage] Failed to get 2D context from canvas.");
        return null;
    }
    const imageData = ctx.createImageData(cols, rows);
    for (let i = 0; i < totalPixels; i++) {
        let val = allSameValue ? 128 : (pixelData[i] - minVal) / range * 255;
        val = Math.round(Math.max(0, Math.min(255, val)));
        imageData.data[i * 4] = val;
        imageData.data[i * 4 + 1] = val;
        imageData.data[i * 4 + 2] = val;
        imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}

async function generateMD5ForFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            console.warn("[generateMD5ForFile] No file provided for MD5 generation.");
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const buffer = e.target.result;
                const md5 = SparkMD5.ArrayBuffer.hash(buffer);
                resolve(md5);
            } catch (error) {
                console.error("[generateMD5ForFile] MD5哈希计算出错:", error);
                reject(error);
            }
        };
        reader.onerror = (err) => {
            console.error("[generateMD5ForFile] FileReader读取出错:", err);
            reject(err);
        };
        reader.readAsArrayBuffer(file);
    });
}


export function useMultiFrameLoader(showNotificationCallback) {
    const fileList = ref([]);
    const currentIndex = ref(-1);
    const currentFrameImageUrl = ref(null);
    const currentFrameFileInternal = ref(null);
    const currentFrameMD5 = ref('');
    const isLoadingFrame = ref(false); // 这个状态由 loadFrame 独占管理

    const totalFrames = computed(() => fileList.value.length);
    const currentFrameFile = computed(() => currentFrameFileInternal.value);

    function cleanupPreviousFrameUrl() {
        if (currentFrameImageUrl.value && currentFrameImageUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(currentFrameImageUrl.value);
        }
        currentFrameImageUrl.value = null;
    }

    async function loadFrame(index) {
        if (index < 0 || index >= fileList.value.length) {
            console.warn(`[MultiFrameLoader] loadFrame: 无效的帧索引: ${index}. 总帧数: ${fileList.value.length}`);
            cleanupPreviousFrameUrl();
            currentFrameFileInternal.value = null;
            currentFrameMD5.value = '';
            currentIndex.value = -1;
            // isLoadingFrame 不应在此处重置，因为它可能由其他操作（如 processSelectedFiles）设置
            // 除非我们确定 loadFrame 是唯一控制 isLoadingFrame 的地方
            return null;
        }

        // 检查是否正在加载，如果当前加载的不是目标index，则可以考虑取消之前的加载（复杂，暂不实现）
        // 或者简单地等待之前的加载完成。
        if (isLoadingFrame.value) { //
            console.log(`[MultiFrameLoader] loadFrame: 另一帧 (可能是 ${currentIndex.value}) 仍在加载中。对索引 ${index} 的请求暂时忽略或排队。`);
            return currentFrameFileInternal.value;
        }

        isLoadingFrame.value = true;
        console.log(`[MultiFrameLoader] loadFrame: isLoadingFrame 设置为 true (开始加载索引 ${index})`);

        const fileToLoad = fileList.value[index];
        // 更新当前文件和索引的引用
        currentIndex.value = index;
        currentFrameFileInternal.value = fileToLoad;
        currentFrameMD5.value = ''; // 先重置

        if (!fileToLoad) {
            showNotificationCallback(`⚠️ 无法加载索引为 ${index} 的帧，文件对象在列表中不存在。`);
            cleanupPreviousFrameUrl();
            currentFrameFileInternal.value = null;
            // currentIndex 保持，因为这是尝试加载的索引
            isLoadingFrame.value = false;
            return null;
        }
        let newImageUrl = null;
        let newMD5 = '';

        try {
            if (fileToLoad.name.toLowerCase().endsWith('.dat')) {
                const arrayBuffer = await fileToLoad.arrayBuffer();
                if (arrayBuffer && arrayBuffer.byteLength > 0) {
                    newImageUrl = parseDatGrayscaleImage(arrayBuffer);
                    if (!newImageUrl) {
                        showNotificationCallback(`❌ 无法解析 .dat 文件: ${fileToLoad.name}`);
                        console.warn(`解析 .dat 文件 ${fileToLoad.name} 失败。`);}
                } else {
                    showNotificationCallback(`❌ 读取 .dat 文件内容为空: ${fileToLoad.name}`);
                    console.warn(`读取 .dat 文件 ${fileToLoad.name} 内容为空。`);
                }
            } else if (fileToLoad.type.startsWith('image/')) {
                newImageUrl = URL.createObjectURL(fileToLoad);
            } else {
                showNotificationCallback(`⚠️ 不支持的文件类型: ${fileToLoad.name}`);
                console.warn(`不支持的文件类型: ${fileToLoad.name}`);
            }

            if (newImageUrl) {
                newMD5 = await generateMD5ForFile(fileToLoad);
            }

            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = newImageUrl;
            currentFrameMD5.value = newMD5;

            if (newImageUrl) {
                console.log(`帧 ${fileToLoad.name} (索引 ${index}) 加载并处理成功。`);
            } else {
                console.warn(`帧 ${fileToLoad.name} (索引 ${index}) 未能加载为可显示的图像格式。currentFrameImageUrl 已设为 null。`);
            }

        } catch (error) {
            console.error(`加载或处理帧 ${fileToLoad.name} (索引 ${index}) 时出错:`, error);
            showNotificationCallback(`❌ 加载帧 ${fileToLoad.name} 失败: ${error.message || String(error)}`);
            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = null;
            currentFrameMD5.value = '';
        } finally {
            isLoadingFrame.value = false;
        }
        return currentFrameFileInternal.value;
    }

    async function processSelectedFiles(htmlFileList) {
        if (isLoadingFrame.value) {
            showNotificationCallback("⚠️ 正在加载其他帧，请稍后再选择文件夹。");
            return;
        }
        clearFrames(); // 清理旧状态, clearFrames 会将 isLoadingFrame 设为 false

        // **移除这里的 isLoadingFrame.value = true;**
        // console.log('[MultiFrameLoader] processSelectedFiles: 开始处理新文件夹');

        const acceptedFiles = [];
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.dat', '.tif', '.tiff'];
        for (let i = 0; i < htmlFileList.length; i++) {
            const file = htmlFileList[i];
            const fileNameLower = file.name.toLowerCase();
            if (imageExtensions.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('image/')) {
                acceptedFiles.push(file);
            }
        }

        if (acceptedFiles.length === 0) {
            showNotificationCallback('⚠️ 选择的文件夹中没有找到支持的图像文件。');
            return; // 直接返回，因为没有文件可加载，isLoadingFrame 应该保持 false
        }

        acceptedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
        fileList.value = acceptedFiles;
        try {
            await loadFrame(0);
        } catch (e) {
            console.error("[MultiFrameLoader] processSelectedFiles 中调用 loadFrame(0) 第一次尝试出错:", e);
            // 如果 loadFrame 内部的 finally 没能正确重置 isLoadingFrame（理论上不应该），这里可以作为保险
            if (isLoadingFrame.value) {
                isLoadingFrame.value = false;
                console.warn("[MultiFrameLoader] processSelectedFiles: 在 loadFrame(0) 错误后，强制重置 isLoadingFrame 为 false");
            }
        }
    }

    function nextFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value < totalFrames.value - 1) {
            loadFrame(currentIndex.value + 1);
        } else if (isLoadingFrame.value) {
        }
    }

    function prevFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value > 0) {
            loadFrame(currentIndex.value - 1);
        } else if (isLoadingFrame.value) {
        }
    }

    function clearFrames() {
        cleanupPreviousFrameUrl();
        fileList.value = [];
        currentIndex.value = -1;
        currentFrameFileInternal.value = null;
        currentFrameMD5.value = '';
        isLoadingFrame.value = false;
    }

    onUnmounted(() => {
        cleanupPreviousFrameUrl();
    });

    return {
        fileListNames: computed(() => fileList.value.map(f => f.name)),
        currentIndex,
        currentFrameImageUrl,
        currentFrameFile,
        currentFrameMD5,
        totalFrames,
        isLoadingFrame,
        processSelectedFiles,
        loadFrame,
        nextFrame,
        prevFrame,
        clearFrames,
    };
}