import { ref, computed, onUnmounted } from 'vue';
import SparkMD5 from 'spark-md5';

function parseDatGrayscaleImage(datBuffer, rows, cols) {
    if (!datBuffer || !(datBuffer instanceof ArrayBuffer)) {
        console.error("Invalid datBuffer provided.");
        return null;
    }
    if (rows <= 0 || cols <= 0) {
        console.error("Invalid dimensions provided (rows/cols must be > 0).");
        return null;
    }
    if (datBuffer.byteLength < rows * cols * Float64Array.BYTES_PER_ELEMENT) {
        console.error(`datBuffer is too short (length: ${datBuffer.byteLength}) for specified dimensions (${rows}x${cols}) and Float64Array type.`);
        return null;
    }
    const pixelData = new Float64Array(datBuffer);
    const totalPixels = rows * cols;

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
        console.error("Failed to get 2D context from canvas.");
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
            console.warn("No file provided for MD5 generation.");
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
                console.error("MD5哈希计算出错:", error);
                reject(error);
            }
        };
        reader.onerror = (err) => {
            console.error("FileReader读取出错:", err);
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
    const isLoadingFrame = ref(false);

    const currentImageRows = ref(0);
    const currentImageCols = ref(0)

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
            cleanupPreviousFrameUrl();
            currentFrameFileInternal.value = null;
            currentFrameMD5.value = '';
            currentIndex.value = -1;
            return null;
        }

        if (isLoadingFrame.value) {
            return currentFrameFileInternal.value;
        }

        isLoadingFrame.value = true;
        const fileToLoad = fileList.value[index];
        currentIndex.value = index;
        currentFrameFileInternal.value = fileToLoad;
        currentFrameMD5.value = '';

        if (!fileToLoad) {
            showNotificationCallback(`⚠️ 无法加载索引为 ${index} 的帧，文件对象在列表中不存在。`);
            cleanupPreviousFrameUrl();
            currentFrameFileInternal.value = null;
            isLoadingFrame.value = false;
            return null;
        }
        let newImageUrl = null;
        let newMD5 = '';

        try {
            if (fileToLoad.name.toLowerCase().endsWith('.dat')) {
                if (currentImageRows.value <= 0 || currentImageCols.value <= 0) {
                    showNotificationCallback(`❌ 解析.dat (${fileToLoad.name}) 失败: 请提供有效的图像行数和列数。`);
                    newImageUrl = null;
                } else {
                    const arrayBuffer = await fileToLoad.arrayBuffer();
                    if (arrayBuffer && arrayBuffer.byteLength > 0) {
                        newImageUrl = parseDatGrayscaleImage(arrayBuffer, currentImageRows.value, currentImageCols.value);
                        if (!newImageUrl) {
                            showNotificationCallback(`❌ 无法解析 .dat 文件: ${fileToLoad.name}`);
                        }
                    } else {
                        showNotificationCallback(`❌ 读取 .dat 文件内容为空: ${fileToLoad.name}`);
                    }
                }
            } else if (fileToLoad.type.startsWith('image/')) {
                newImageUrl = URL.createObjectURL(fileToLoad);
            } else {
                showNotificationCallback(`⚠️ 不支持的文件类型: ${fileToLoad.name}`);
            }

            if (newImageUrl) {
                newMD5 = await generateMD5ForFile(fileToLoad);
            }

            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = newImageUrl;
            currentFrameMD5.value = newMD5;

            // if (newImageUrl) {
            //     console.log(`帧 ${fileToLoad.name} (索引 ${index}) 加载并处理成功。`);
            // } else {
            //     console.warn(`帧 ${fileToLoad.name} (索引 ${index}) 未能加载为可显示的图像格式。currentFrameImageUrl 已设为 null。`);
            // }

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

    async function processSelectedFiles(htmlFileList, rows, cols) {
        if (isLoadingFrame.value) {
            showNotificationCallback("⚠️ 正在加载其他帧，请稍后再选择文件夹。");
            return;
        }
        clearFrames();

        if (typeof rows !== 'number' || typeof cols !== 'number' || rows <= 0 || cols <= 0) {
            showNotificationCallback(`❌ 处理文件列表失败: 请提供有效的图像行数(rows)和列数(cols)。`);
            return;
        }
        currentImageRows.value = rows;
        currentImageCols.value = cols;

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
            console.error("processSelectedFiles 中调用 loadFrame(0) 第一次尝试出错:", e);
            if (isLoadingFrame.value) {
                isLoadingFrame.value = false;
            }
        }
    }

    function nextFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value < totalFrames.value - 1) { //
            loadFrame(currentIndex.value + 1); //
        }
    }

    function prevFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value > 0) { //
            loadFrame(currentIndex.value - 1); //
        }
    }

    function clearFrames() {
        cleanupPreviousFrameUrl();
        fileList.value = [];
        currentIndex.value = -1;
        currentFrameFileInternal.value = null;
        currentFrameMD5.value = '';
        isLoadingFrame.value = false;
        currentImageRows.value = 0;
        currentImageCols.value = 0;
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