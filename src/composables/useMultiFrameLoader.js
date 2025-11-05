import { ref, computed, onUnmounted } from 'vue';
import SparkMD5 from 'spark-md5';
import DatParserWorker from '../workers/datParser.worker.js?worker';

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

function getDatFrameCount(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const worker = new DatParserWorker();
            worker.onmessage = (event) => {
                if (event.data.success && event.data.mode === 'getCount') {
                    resolve(event.data.frameCount);
                } else {
                    reject(new Error(event.data.error || '无法从Worker获取帧数'));
                }
                worker.terminate();
            };
            worker.onerror = (err) => {
                reject(err);
                worker.terminate();
            };
            const buffer = e.target.result;
            worker.postMessage({ datBuffer: buffer, mode: 'getCount' }, [buffer]);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function parseDatSpecificFrame(file, frameIndex, rows, cols) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const worker = new DatParserWorker();
            worker.onmessage = (event) => {
                if (event.data.success && event.data.mode === 'getSpecificFrame') {
                    resolve(URL.createObjectURL(event.data.imageBlob));
                } else {
                    reject(new Error(event.data.error || 'Worker未能解析指定帧'));
                }
                worker.terminate();
            };
            worker.onerror = (err) => {
                reject(err);
                worker.terminate();
            };
            const buffer = e.target.result;
            worker.postMessage({
                datBuffer: buffer,
                rows,
                cols,
                mode: 'getSpecificFrame',
                frameIndex
            }, [buffer]);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

export function useMultiFrameLoader(showNotificationCallback) {
    const fileList = ref([]);
    const currentIndex = ref(-1);
    const currentFrameImageUrl = ref(null);
    const isLoadingFrame = ref(false);
    const currentImageRows = ref(0);
    const currentImageCols = ref(0);
    const isProcessingList = ref(false); // 处理文件列表的加载状态
    const totalFrames = computed(() => fileList.value.length);
    const fileListNames = computed(() => fileList.value.map(f => f.displayName));

    function cleanupPreviousFrameUrl() {
        if (currentFrameImageUrl.value && currentFrameImageUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(currentFrameImageUrl.value);
        }
        currentFrameImageUrl.value = null;
    }

    async function loadFrame(index) {
        if (index < 0 || index >= fileList.value.length) {
            cleanupPreviousFrameUrl();
            currentIndex.value = -1;
            return;
        }

        if (isLoadingFrame.value) return;
        isLoadingFrame.value = true;

        const frameInfo = fileList.value[index];
        currentIndex.value = index;

        let newImageUrl = null;

        try {
            console.log(`[loader] 开始加载帧: ${frameInfo.displayName}`);
            if (frameInfo.isSubFrame) {
                newImageUrl = await parseDatSpecificFrame(
                    frameInfo.originalFile,
                    frameInfo.subFrameIndex,
                    currentImageRows.value,
                    currentImageCols.value
                );
            } else if (frameInfo.originalFile.type.startsWith('image/')) {
                newImageUrl = URL.createObjectURL(frameInfo.originalFile);
            } else {
                showNotificationCallback(`⚠️ 不支持的文件类型: ${frameInfo.displayName}`);
            }

            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = newImageUrl;
            console.log(`[loader] 成功加载帧: ${frameInfo.displayName}`);

        } catch (error) {
            const errorMessage = `❌ 加载帧 ${frameInfo.displayName} 失败: ${error.message}`;
            console.error(errorMessage, error);
            showNotificationCallback(errorMessage);
            cleanupPreviousFrameUrl();
        } finally {
            isLoadingFrame.value = false;
        }
    }

    async function processSelectedFiles(htmlFileList, rows, cols) {
        if (isLoadingFrame.value) {
            showNotificationCallback("⚠️ 正在加载，请稍后再选择文件夹。");
            return;
        }

        if (isProcessingList.value) { // 检查是否正在处理
            showNotificationCallback("⚠️ 正在处理文件，请稍候...");
            return;
        }
        isProcessingList.value = true;
        console.log('[loader] 开始处理选择的文件...');

        if (!rows || rows <= 0 || !cols || cols <= 0) {
            showNotificationCallback(`❌ 请提供有效的图像行数(当前: ${rows})和列数(当前: ${cols})。`);
            isProcessingList.value = false; // <--- 修正：2. 确保在退出前重置状态
            return;
        }
        clearFrames();

        currentImageRows.value = rows;
        currentImageCols.value = cols;

        const sortedFiles = Array.from(htmlFileList).sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
        );
        console.log('[loader] 文件已按自然顺序排序:', sortedFiles.map(f => f.name));

        const supportedImageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tif', '.tiff'];

        const processingPromises = sortedFiles.map(file => {
            const fileNameLower = file.name.toLowerCase();
            if (supportedImageExtensions.some(ext => fileNameLower.endsWith(ext))) {
                console.log(`[loader] 发现标准图片: ${file.name}`);
                // 对于标准图片，直接返回一个解析过的Promise
                return Promise.resolve([{
                    displayName: file.name,
                    originalFile: file,
                    isSubFrame: false,
                }]);
            } else if (fileNameLower.endsWith('.dat')) {
                return processDatFile(file, rows, cols);
            }
            return Promise.resolve([]); // 不支持的文件类型
        });

        try {
            // 等待所有文件的处理Promise完成
            const nestedResults = await Promise.all(processingPromises);
            // 将嵌套的结果数组扁平化成一个列表
            const expandedList = nestedResults.flat();
            //console.log('[loader] 所有文件处理完成，生成扁平化预览列表:', expandedList);

            if (expandedList.length === 0) {
                showNotificationCallback('⚠️ 未找到支持的图像文件。');
                return;
            }

            fileList.value = expandedList;
            showNotificationCallback(`✅ 已加载 ${expandedList.length} 帧图像。`);

            if (fileList.value.length > 0) {
                await loadFrame(0);
            }
        } catch (error) {
            console.error('[loader] 处理文件列表时发生严重错误:', error);
            showNotificationCallback('❌ 处理文件时发生未知错误，请检查控制台。');
        }finally {
            isProcessingList.value = false; // 在 finally 块中确保重置状态
        }
    }

    /**
     * @description 异步处理单个 .dat 文件（无论来自手动上传还是自动模式）
     * @param {File} file - .dat 文件对象
     * @param {number} rows - 图像行数
     * @param {number} cols - 图像列数
     * @returns {Promise<Array>} - 返回一个包含子帧信息对象的数组
     */
    async function processDatFile(file, rows, cols) {
        try {
            console.log(`[loader] 发现.dat文件，开始解析帧数: ${file.name}`);
            // 1. 获取帧数
            const frameCount = await getDatFrameCount(file);
            console.log(`[loader] 解析成功: ${file.name} 包含 ${frameCount} 帧。`);

            // 2. 为每一帧创建信息对象
            const subFrames = [];
            for (let i = 0; i < frameCount; i++) {
                subFrames.push({
                    displayName: `${file.name}_${String(i).padStart(3, '0')}.png`,
                    originalFile: file, // 引用原始的 .dat 文件
                    isSubFrame: true,
                    subFrameIndex: i,
                });
            }
            return subFrames;
        } catch (error) {
            const errorMessage = `❌ 解析 ${file.name} 文件头失败: ${error.message}`;
            console.error(errorMessage);
            showNotificationCallback(errorMessage);
            return []; // 出错时返回空数组
        }
    }

    // (--- 新增：处理自动模式 .dat 文件 URL 列表的函数 ---)
    /**
     * @description (自动模式) 异步获取并处理 .dat 文件 URL 列表
     * @param {string[]} urls - 后端推送的 .dat 文件 URL (e.g., /api/get_auto_dat_file?taskId=1)
     * @param {number} rows - 图像行数
     * @param {number} cols - 图像列数
     */
    async function processAutoModeDatUrls(urls, rows, cols) {
        if (isLoadingFrame.value || isProcessingList.value) {
            showNotificationCallback("⚠️ 正在处理，请稍候...");
            return;
        }
        isProcessingList.value = true;
        console.log('[loader] 开始处理自动模式 .dat URL 列表...');

        if (!rows || rows <= 0 || !cols || cols <= 0) {
            showNotificationCallback(`❌ 自动模式错误：请提供有效的图像行数(当前: ${rows})和列数(当前: ${cols})。`);
            isProcessingList.value = false;
            return;
        }
        clearFrames();
        currentImageRows.value = rows;
        currentImageCols.value = cols;

        // 为每个 URL 创建一个 fetch 和 processDatFile 的 Promise
        const processingPromises = urls.map(async (url) => {
            try {
                showNotificationCallback(`🚧 正在下载自动模式文件: ${url}`);
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`下载失败: ${response.status} ${response.statusText}`);
                }
                const arrayBuffer = await response.arrayBuffer();

                // 从 URL 中提取 taskId 作为文件名
                const urlParams = new URLSearchParams(url.split('?')[1]);
                const taskId = urlParams.get('taskId') || 'unknown';
                const fileName = `auto_task_${taskId}.dat`;

                // 将 ArrayBuffer 转换为 File 对象，以便复用 processDatFile
                const datFile = new File([arrayBuffer], fileName, { type: "application/octet-stream" });

                // 调用与手动模式相同的 .dat 处理函数
                return await processDatFile(datFile, rows, cols);

            } catch (error) {
                const errorMessage = `❌ 处理自动模式文件 ${url} 失败: ${error.message}`;
                console.error(errorMessage);
                showNotificationCallback(errorMessage);
                return []; // 出错时返回空数组
            }
        });

        try {
            // 等待所有 .dat 文件被下载和解析
            const nestedResults = await Promise.all(processingPromises);
            // 扁平化所有子帧
            const expandedList = nestedResults.flat();
            console.log('[loader] 自动模式所有 .dat 文件处理完成，生成扁平化预览列表:', expandedList);

            if (expandedList.length === 0) {
                showNotificationCallback('⚠️ 自动模式：未找到支持的图像文件。');
                return;
            }

            fileList.value = expandedList;
            showNotificationCallback(`✅ 自动模式：已加载 ${expandedList.length} 帧图像。`);

            // 加载第一帧
            if (fileList.value.length > 0) {
                await loadFrame(0);
            }
        } catch (error) {
            console.error('[loader] 处理自动模式文件列表时发生严重错误:', error);
            showNotificationCallback('❌ 处理自动模式文件时发生未知错误，请检查控制台。');
        } finally {
            isProcessingList.value = false;
        }
    }

    function nextFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value < totalFrames.value - 1) {
            loadFrame(currentIndex.value + 1);
        }
    }

    function prevFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value > 0) {
            loadFrame(currentIndex.value - 1);
        }
    }

    function clearFrames() {
        cleanupPreviousFrameUrl();
        fileList.value = [];
        currentIndex.value = -1;
        isLoadingFrame.value = false;
        currentImageRows.value = 0;
        currentImageCols.value = 0;
    }

    onUnmounted(cleanupPreviousFrameUrl);

    return {
        fileList,
        fileListNames,
        currentIndex,
        currentFrameImageUrl,
        totalFrames,
        isLoadingFrame,
        isProcessingList,
        processSelectedFiles,
        processAutoModeDatUrls,
        loadFrame,
        nextFrame,
        prevFrame,
        clearFrames,
    };
}