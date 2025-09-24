import { ref, computed, onUnmounted } from 'vue';
import SparkMD5 from 'spark-md5';
import { parseDatFileWithWorker } from './useDatParser.js';

/**
 * 异步生成文件的MD5哈希值
 * @param {File} file - 要计算MD5的文件对象
 * @returns {Promise<string>} - 返回包含MD5哈希值的Promise
 */
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

/**
 * 多帧加载器功能模块
 * @param {Function} showNotificationCallback - 用于显示通知的回调函数
 * @returns {Object} - 返回包含多帧加载器相关状态和方法的响应式对象
 */
export function useMultiFrameLoader(showNotificationCallback) {
    // 响应式状态变量
    const fileList = ref([]); // 存储所有文件的列表
    const currentIndex = ref(-1); // 当前显示的帧索引
    const currentFrameImageUrl = ref(null); // 当前帧的图像URL
    const currentFrameFileInternal = ref(null); // 当前帧的文件对象
    const currentFrameMD5 = ref(''); // 当前帧的MD5哈希值
    const isLoadingFrame = ref(false); // 是否正在加载帧的标志

    // 图像参数
    const currentImageRows = ref(0); // 图像的行数
    const currentImageCols = ref(0); // 图像的列数
    const currentPrecision = ref('float64'); // 图像的精度（如float32, float64）

    // 计算属性
    const totalFrames = computed(() => fileList.value.length); // 总帧数
    const currentFrameFile = computed(() => currentFrameFileInternal.value); // 当前帧的文件对象（计算属性）

    /**
     * 清理之前帧的URL对象
     */
    function cleanupPreviousFrameUrl() {
        if (currentFrameImageUrl.value && currentFrameImageUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(currentFrameImageUrl.value); // 释放Blob URL以避免内存泄漏
        }
        currentFrameImageUrl.value = null;
    }

    /**
     * 加载指定索引的帧
     * @param {number} index - 要加载的帧的索引
     * @returns {Promise<File|null>} - 返回加载的文件对象或null
     */
    async function loadFrame(index) {
        if (index < 0 || index >= fileList.value.length) {
            cleanupPreviousFrameUrl();
            currentFrameFileInternal.value = null;
            currentFrameMD5.value = '';
            currentIndex.value = -1;
            return null;
        }

        if (isLoadingFrame.value) {
            return currentFrameFileInternal.value; // 如果正在加载，返回当前帧
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
                        newImageUrl = await parseDatFileWithWorker(arrayBuffer, currentImageRows.value, currentImageCols.value, currentPrecision.value);
                        if (!newImageUrl) {
                            showNotificationCallback(`❌ 无法解析 .dat 文件: ${fileToLoad.name}`);
                        }
                    } else {
                        showNotificationCallback(`❌ 读取 .dat 文件内容为空: ${fileToLoad.name}`);
                    }
                }
            } else if (fileToLoad.type.startsWith('image/')) {
                newImageUrl = URL.createObjectURL(fileToLoad); // 创建Blob URL用于显示图像
            } else {
                showNotificationCallback(`⚠️ 不支持的文件类型: ${fileToLoad.name}`);
            }

            if (newImageUrl) {
                newMD5 = await generateMD5ForFile(fileToLoad); // 计算文件的MD5哈希值
            }

            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = newImageUrl;
            currentFrameMD5.value = newMD5;

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

    /**
     * 处理选择的文件列表
     * @param {FileList} htmlFileList - HTML文件列表对象
     * @param {number} rows - 图像的行数
     * @param {number} cols - 图像的列数
     * @param {string} precision - 图像的精度（如float32, float64）
     */
    async function processSelectedFiles(htmlFileList, rows, cols, precision) {
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
        currentPrecision.value = precision;

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
            return;
        }

        acceptedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'})); // 按文件名排序
        fileList.value = acceptedFiles;
        try {
            await loadFrame(0); // 尝试加载第一帧
        } catch (e) {
            console.error("processSelectedFiles 中调用 loadFrame(0) 第一次尝试出错:", e);
            if (isLoadingFrame.value) {
                isLoadingFrame.value = false;
            }
        }
    }

    /**
     * 加载下一帧
     */
    function nextFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value < totalFrames.value - 1) {
            loadFrame(currentIndex.value + 1);
        }
    }

    /**
     * 加载上一帧
     */
    function prevFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value > 0) {
            loadFrame(currentIndex.value - 1);
        }
    }

    /**
     * 清除所有帧
     */
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

    // 组件卸载时清理资源
    onUnmounted(() => {
        cleanupPreviousFrameUrl();
    });

    return {
        fileList,
        fileListNames: computed(() => fileList.value.map(f => f.name)), // 计算属性：所有文件名列表
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