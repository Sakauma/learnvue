// // src/composables/useMultiFrameLoader.js
// import { ref, computed, onUnmounted } from 'vue';
// import SparkMD5 from 'spark-md5'; // 用于按需计算MD5
//
// // .dat 文件解析函数 (应从共享工具或 useImageHandler 中提取, 或在此定义)
// // 为确保完整性，这里包含一个基础实现
// function parseDatGrayscaleImage(datBuffer, rows = 213, cols = 252) {
//     if (!datBuffer || !(datBuffer instanceof ArrayBuffer)) {
//         console.error("[parseDatGrayscaleImage] Invalid datBuffer provided.");
//         return null;
//     }
//     // 确保 datBuffer 长度足够表示 Float64Array
//     if (datBuffer.byteLength < rows * cols * Float64Array.BYTES_PER_ELEMENT) {
//         console.error("[parseDatGrayscaleImage] datBuffer is too short for specified dimensions and Float64Array type.");
//         return null;
//     }
//
//     const pixelData = new Float64Array(datBuffer);
//     const totalPixels = rows * cols;
//
//     if (pixelData.length < totalPixels) {
//         console.error("[parseDatGrayscaleImage] .dat 文件像素数据不足。");
//         return null;
//     }
//
//     let maxVal = -Infinity, minVal = Infinity;
//     for (let i = 0; i < totalPixels; i++) {
//         if (pixelData[i] > maxVal) maxVal = pixelData[i];
//         if (pixelData[i] < minVal) minVal = pixelData[i];
//     }
//
//     // 如果所有像素值都相同 (maxVal === minVal)，则除数会是0，导致NaN。
//     // 此时可以将所有像素设为一个中间灰色值，或全白/全黑。
//     const range = maxVal - minVal;
//     const allSameValue = range === 0;
//
//     const canvas = document.createElement('canvas');
//     canvas.width = cols;
//     canvas.height = rows;
//     const ctx = canvas.getContext('2d');
//     if (!ctx) {
//         console.error("[parseDatGrayscaleImage] Failed to get 2D context from canvas.");
//         return null;
//     }
//     const imageData = ctx.createImageData(cols, rows);
//     for (let i = 0; i < totalPixels; i++) {
//         let val = allSameValue ? 128 : (pixelData[i] - minVal) / range * 255;
//         val = Math.round(Math.max(0, Math.min(255, val)));
//         imageData.data[i * 4] = val;     // R
//         imageData.data[i * 4 + 1] = val; // G
//         imageData.data[i * 4 + 2] = val; // B
//         imageData.data[i * 4 + 3] = 255; // Alpha
//     }
//     ctx.putImageData(imageData, 0, 0);
//     return canvas.toDataURL('image/png');
// }
//
// // 生成 MD5 的函数
// async function generateMD5ForFile(file) {
//     return new Promise((resolve, reject) => {
//         if (!file) {
//             resolve(''); // 没有文件，就没有MD5
//             return;
//         }
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             try {
//                 const buffer = e.target.result;
//                 const md5 = SparkMD5.ArrayBuffer.hash(buffer);
//                 resolve(md5);
//             } catch (error) {
//                 console.error("[generateMD5ForFile] Error generating MD5:", error);
//                 reject(error);
//             }
//         };
//         reader.onerror = (err) => {
//             console.error("[generateMD5ForFile] FileReader error:", err);
//             reject(err);
//         };
//         reader.readAsArrayBuffer(file);
//     });
// }
//
//
// export function useMultiFrameLoader(showNotificationCallback) {
//     const fileList = ref([]); // 存储 File 对象
//     const currentIndex = ref(-1);
//     const currentFrameImageUrl = ref(null);
//     const currentFrameFileInternal = ref(null); // 内部存储当前 File 对象
//     const currentFrameMD5 = ref('');
//     const isLoadingFrame = ref(false);
//
//     const totalFrames = computed(() => fileList.value.length);
//     const currentFrameFile = computed(() => currentFrameFileInternal.value); // 只读暴露
//
//     function cleanupPreviousFrameUrl() {
//         if (currentFrameImageUrl.value && currentFrameImageUrl.value.startsWith('blob:')) {
//             URL.revokeObjectURL(currentFrameImageUrl.value);
//             console.log('[MultiFrameLoader] Revoked previous blob URL:', currentFrameImageUrl.value);
//         }
//         currentFrameImageUrl.value = null;
//     }
//
//     async function loadFrame(index) {
//         if (index < 0 || index >= fileList.value.length) {
//             console.warn(`[MultiFrameLoader] 无效的帧索引: ${index}`);
//             cleanupPreviousFrameUrl();
//             currentFrameFileInternal.value = null;
//             currentFrameMD5.value = '';
//             currentIndex.value = -1;
//             return null;
//         }
//
//         if (isLoadingFrame.value) {
//             console.log("[MultiFrameLoader] 仍在加载上一帧，请稍候。");
//             return currentFrameFileInternal.value; // 返回当前（可能还在加载中的）文件
//         }
//
//         isLoadingFrame.value = true;
//         cleanupPreviousFrameUrl();
//         currentIndex.value = index;
//
//         const file = fileList.value[index];
//         currentFrameFileInternal.value = file; // 更新当前文件对象
//         currentFrameMD5.value = ''; // 重置MD5，等待重新计算
//
//         if (!file) {
//             showNotificationCallback(`⚠️ 无法加载索引为 ${index} 的帧，文件对象不存在。`);
//             isLoadingFrame.value = false;
//             return null;
//         }
//
//         console.log(`[MultiFrameLoader] 开始加载帧 ${index}: ${file.name}`);
//
//         try {
//             if (file.name.toLowerCase().endsWith('.dat')) {
//                 const arrayBuffer = await file.arrayBuffer();
//                 currentFrameImageUrl.value = parseDatGrayscaleImage(arrayBuffer);
//                 if (!currentFrameImageUrl.value) {
//                     showNotificationCallback(`❌ 无法解析 .dat 文件: ${file.name}`);
//                 }
//             } else if (file.type.startsWith('image/')) {
//                 currentFrameImageUrl.value = URL.createObjectURL(file);
//             } else {
//                 showNotificationCallback(`⚠️ 不支持的文件类型: ${file.name}`);
//                 currentFrameImageUrl.value = null;
//             }
//
//             if (currentFrameImageUrl.value) {
//                 currentFrameMD5.value = await generateMD5ForFile(file);
//                 console.log(`[MultiFrameLoader] 帧 ${file.name} 加载成功, MD5: ${currentFrameMD5.value}`);
//             }
//         } catch (error) {
//             console.error(`[MultiFrameLoader] 加载帧 ${file.name} 出错:`, error);
//             showNotificationCallback(`❌ 加载帧 ${file.name} 失败`);
//             currentFrameImageUrl.value = null;
//             currentFrameFileInternal.value = null; // 加载失败也清空当前文件
//             currentIndex.value = -1; // 重置索引
//         } finally {
//             isLoadingFrame.value = false;
//         }
//         return currentFrameFileInternal.value;
//     }
//
//     async function processSelectedFiles(htmlFileList) {
//         isLoadingFrame.value = true; // 开始处理文件列表，也标记为加载状态
//         const acceptedFiles = [];
//         const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.dat', '.tif', '.tiff'];
//
//         for (let i = 0; i < htmlFileList.length; i++) {
//             const file = htmlFileList[i];
//             const fileNameLower = file.name.toLowerCase();
//             if (imageExtensions.some(ext => fileNameLower.endsWith(ext)) || file.type.startsWith('image/')) {
//                 acceptedFiles.push(file);
//             }
//         }
//
//         if (acceptedFiles.length === 0) {
//             showNotificationCallback('⚠️ 选择的文件夹中没有找到支持的图像文件。');
//             fileList.value = [];
//             cleanupPreviousFrameUrl();
//             currentFrameFileInternal.value = null;
//             currentFrameMD5.value = '';
//             currentIndex.value = -1;
//             isLoadingFrame.value = false;
//             return;
//         }
//
//         acceptedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
//
//         fileList.value = acceptedFiles;
//         console.log('[MultiFrameLoader] 处理后的文件列表:', fileList.value.map(f => f.name));
//         await loadFrame(0); // 自动加载第一帧
//         // isLoadingFrame 会在 loadFrame 内部的 finally 中设置为 false
//     }
//
//     function nextFrame() {
//         if (currentIndex.value < totalFrames.value - 1) {
//             loadFrame(currentIndex.value + 1);
//         }
//     }
//
//     function prevFrame() {
//         if (currentIndex.value > 0) {
//             loadFrame(currentIndex.value - 1);
//         }
//     }
//
//     function clearFrames() {
//         cleanupPreviousFrameUrl();
//         fileList.value = [];
//         currentIndex.value = -1;
//         currentFrameFileInternal.value = null;
//         currentFrameMD5.value = '';
//         isLoadingFrame.value = false;
//         console.log('[MultiFrameLoader] 所有帧已清除。');
//     }
//
//     onUnmounted(() => {
//         cleanupPreviousFrameUrl();
//     });
//
//     return {
//         fileListNames: computed(() => fileList.value.map(f => f.name)), // 仅暴露文件名列表给UI slider tooltip
//         currentIndex,
//         currentFrameImageUrl,
//         currentFrameFile,     // 当前选中的File对象 (computed)
//         currentFrameMD5,      // 当前帧的MD5 (ref)
//         totalFrames,
//         isLoadingFrame,
//         processSelectedFiles, // 由 ImgProcess 调用
//         loadFrame,            // 由 MultiFrameSystem 的 slider/buttons 调用
//         nextFrame,
//         prevFrame,
//         clearFrames,          // 由 ImgProcess 的 handleModeChange 调用
//     };
// }

// src/composables/useMultiFrameLoader.js
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
            console.log(`[MultiFrameLoader] loadFrame: isLoadingFrame 设置为 false (因文件对象在列表中不存在 for index ${index})`);
            return null;
        }

        console.log(`[MultiFrameLoader] 开始加载帧 ${index}: ${fileToLoad.name} (Size: ${fileToLoad.size} bytes)`);
        let newImageUrl = null;
        let newMD5 = '';

        try {
            console.log(`[MultiFrameLoader] 帧 ${index} (${fileToLoad.name}): 准备读取文件内容...`);
            if (fileToLoad.name.toLowerCase().endsWith('.dat')) {
                console.time(`[Perf] Frame ${index} (${fileToLoad.name}) - file.arrayBuffer()`);
                const arrayBuffer = await fileToLoad.arrayBuffer();
                console.timeEnd(`[Perf] Frame ${index} (${fileToLoad.name}) - file.arrayBuffer()`);
                console.log(`[MultiFrameLoader] 帧 ${index}: .dat ArrayBuffer 已读取 (长度: ${arrayBuffer?.byteLength})。正在解析...`);
                if (arrayBuffer && arrayBuffer.byteLength > 0) {
                    console.time(`[Perf] Frame ${index} (${fileToLoad.name}) - parseDatGrayscaleImage()`);
                    newImageUrl = parseDatGrayscaleImage(arrayBuffer);
                    console.timeEnd(`[Perf] Frame ${index} (${fileToLoad.name}) - parseDatGrayscaleImage()`);
                    if (!newImageUrl) {
                        showNotificationCallback(`❌ 无法解析 .dat 文件: ${fileToLoad.name}`);
                        console.warn(`[MultiFrameLoader] 解析 .dat 文件 ${fileToLoad.name} 失败。`);
                    } else {
                        console.log(`[MultiFrameLoader] 帧 ${index}: .dat 文件解析成功。`);
                    }
                } else {
                    showNotificationCallback(`❌ 读取 .dat 文件内容为空: ${fileToLoad.name}`);
                    console.warn(`[MultiFrameLoader] 读取 .dat 文件 ${fileToLoad.name} 内容为空。`);
                }
            } else if (fileToLoad.type.startsWith('image/')) {
                newImageUrl = URL.createObjectURL(fileToLoad);
                console.log(`[MultiFrameLoader] 帧 ${index}: Object URL 已创建: ${newImageUrl}`);
            } else {
                showNotificationCallback(`⚠️ 不支持的文件类型: ${fileToLoad.name}`);
                console.warn(`[MultiFrameLoader] 不支持的文件类型: ${fileToLoad.name}`);
            }

            if (newImageUrl) {
                console.log(`[MultiFrameLoader] 帧 ${index}: 图像已处理/URL已创建。正在计算 MD5...`);
                console.time(`[Perf] Frame ${index} (${fileToLoad.name}) - generateMD5ForFile()`);
                newMD5 = await generateMD5ForFile(fileToLoad);
                console.timeEnd(`[Perf] Frame ${index} (${fileToLoad.name}) - generateMD5ForFile()`);
                console.log(`[MultiFrameLoader] 帧 ${index}: MD5 计算完成: ${newMD5}`);
            }

            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = newImageUrl;
            currentFrameMD5.value = newMD5;

            if (newImageUrl) {
                console.log(`[MultiFrameLoader] 帧 ${fileToLoad.name} (索引 ${index}) 加载并处理成功。`);
            } else {
                console.warn(`[MultiFrameLoader] 帧 ${fileToLoad.name} (索引 ${index}) 未能加载为可显示的图像格式。currentFrameImageUrl 已设为 null。`);
            }

        } catch (error) {
            console.error(`[MultiFrameLoader] 加载或处理帧 ${fileToLoad.name} (索引 ${index}) 时出错:`, error);
            showNotificationCallback(`❌ 加载帧 ${fileToLoad.name} 失败: ${error.message || String(error)}`);
            cleanupPreviousFrameUrl();
            currentFrameImageUrl.value = null;
            currentFrameMD5.value = '';
        } finally {
            isLoadingFrame.value = false;
            console.log(`[MultiFrameLoader] loadFrame: isLoadingFrame 设置为 false (索引 ${index} 的 finally 块)`);
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
            // fileList.value 已经是空 (因为 clearFrames)
            // currentIndex.value 已经是 -1 (因为 clearFrames)
            console.log('[MultiFrameLoader] processSelectedFiles: 文件夹中无有效文件。');
            return; // 直接返回，因为没有文件可加载，isLoadingFrame 应该保持 false
        }

        acceptedFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
        fileList.value = acceptedFiles;
        console.log('[MultiFrameLoader] 处理后的文件列表:', fileList.value.map(f => f.name));

        // 现在调用 loadFrame(0)。loadFrame 内部会设置 isLoadingFrame = true，并在其 finally 中设为 false。
        console.log('[MultiFrameLoader] processSelectedFiles: 准备调用 loadFrame(0)');
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
        console.log('[MultiFrameLoader] processSelectedFiles: 结束，当前 isLoadingFrame (应为false如果loadFrame完成):', isLoadingFrame.value);
    }

    function nextFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value < totalFrames.value - 1) {
            loadFrame(currentIndex.value + 1);
        } else if (isLoadingFrame.value) {
            console.log("[MultiFrameLoader] nextFrame: 当前帧仍在加载，忽略下一帧请求。");
        }
    }

    function prevFrame() {
        if (!isLoadingFrame.value && totalFrames.value > 0 && currentIndex.value > 0) {
            loadFrame(currentIndex.value - 1);
        } else if (isLoadingFrame.value) {
            console.log("[MultiFrameLoader] prevFrame: 当前帧仍在加载，忽略上一帧请求。");
        }
    }

    function clearFrames() {
        console.log('[MultiFrameLoader] clearFrames: 开始清除所有帧...');
        cleanupPreviousFrameUrl();
        fileList.value = [];
        currentIndex.value = -1;
        currentFrameFileInternal.value = null;
        currentFrameMD5.value = '';
        isLoadingFrame.value = false;
        console.log('[MultiFrameLoader] clearFrames: 所有帧已清除。isLoadingFrame:', isLoadingFrame.value);
    }

    onUnmounted(() => {
        console.log('[MultiFrameLoader] onUnmounted: 开始清理...');
        cleanupPreviousFrameUrl();
        console.log('[MultiFrameLoader] onUnmounted: 清理完成。');
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