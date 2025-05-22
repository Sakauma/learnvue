import { ref } from 'vue';
import SparkMD5 from 'spark-md5';

const IMAGE_ROWS = 213;
const IMAGE_COLS = 252;

function parseDatGrayscaleImage(datBuffer, rows, cols) {
    // 确保这里的实现和原始代码一致
    if (!datBuffer) {
        console.error("Error: datBuffer is null or undefined.");
        return null;
    }
    const pixelDataFloat64 = new Float64Array(datBuffer);
    const totalPixels = rows * cols;

    if (pixelDataFloat64.length < totalPixels) {
        console.error("Error: .dat 文件对于指定的尺寸来说太短了。");
        return null;
    }
    if (pixelDataFloat64.length > totalPixels) {
        console.warn("Warning: .dat 文件对于指定的尺寸来说太长了。额外的会被忽略。");
    }

    let maxVal = -Infinity;
    let minVal = Infinity;
    for (let i = 0; i < totalPixels; i++) {
        const val = pixelDataFloat64[i];
        if (val > maxVal) maxVal = val;
        if (val < minVal) minVal = val;
    }

    const imageData = new ImageData(cols, rows);
    const imageDataData = imageData.data;

    for (let i = 0; i < totalPixels; i++) {
        let grayscaleValueFloat = (pixelDataFloat64[i] - minVal) / (maxVal - minVal) * 255;
        let grayscaleValueUint8 = Math.min(255, Math.max(0, Math.round(grayscaleValueFloat)));

        const index = i * 4;
        imageDataData[index] = grayscaleValueUint8;
        imageDataData[index + 1] = grayscaleValueUint8;
        imageDataData[index + 2] = grayscaleValueUint8;
        imageDataData[index + 3] = 255;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}


// export function useImageHandler(showNotificationCallback) {
//     const imageUrl = ref(null);
//     const originalFile = ref(null);
//     const fileMD5 = ref('');
//     const imageName = ref('');
//
//     function generateMD5(file) {
//         return new Promise((resolve, reject) => {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//                 try {
//                     const buffer = e.target.result;
//                     const md5 = SparkMD5.ArrayBuffer.hash(buffer);
//                     resolve(md5);
//                 } catch (error) {
//                     reject(error);
//                 }
//             };
//             reader.onerror = reject;
//             reader.readAsArrayBuffer(file);
//         });
//     }
//
//     async function handleFileSelected(file) {
//         if (!file) return;
//
//         // Reset state
//         imageUrl.value = null;
//         originalFile.value = null;
//         fileMD5.value = '';
//         imageName.value = '';
//
//         try {
//             if (file.type.startsWith('image/')) {
//                 imageUrl.value = URL.createObjectURL(file);
//                 originalFile.value = file;
//                 imageName.value = file.name;
//                 fileMD5.value = await generateMD5(file);
//             } else if (file.name.toLowerCase().endsWith('.dat')) {
//                 const arrayBuffer = await file.arrayBuffer();
//                 const dataURL = parseDatGrayscaleImage(arrayBuffer, IMAGE_ROWS, IMAGE_COLS);
//                 if (dataURL) {
//                     imageUrl.value = dataURL;
//                     originalFile.value = file; // Keep original .dat file for sending to backend
//                     imageName.value = file.name;
//                     fileMD5.value = await generateMD5(file); // MD5 of the .dat file
//                 } else {
//                     showNotificationCallback('❌ 无法解析 .dat 文件中的图像数据，或文件格式不正确。');
//                 }
//             } else {
//                 showNotificationCallback('❌ 不支持的文件类型。请选择图像文件 (image/*) 或 .dat 文件。');
//             }
//         } catch (error) {
//             console.error("File handling error:", error);
//             showNotificationCallback('❌ 处理文件时发生错误。');
//         }
//     }
export function useImageHandler(showNotificationCallback) {
    const imageUrl = ref(null);
    const originalFile = ref(null);
    const fileMD5 = ref('');
    const imageName = ref('');

    async function handleFileSelected(file) {
        console.log('[useImageHandler (singleFrame)] handleFileSelected CALLED with file:', file ? { name: file.name, type: file.type, size: file.size } : file); // <-- 日志4
        if (!file) {
            console.warn('[useImageHandler (singleFrame)] handleFileSelected called with no file.');
            return;
        }

        // Reset state
        if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl.value);
        }
        imageUrl.value = null;
        originalFile.value = null;
        fileMD5.value = '';
        imageName.value = '';
        console.log('[useImageHandler (singleFrame)] State reset before processing new file.');

        try {
            if (file.type.startsWith('image/')) {
                console.log('[useImageHandler (singleFrame)] Processing as standard image type.');
                const blobUrl = URL.createObjectURL(file); // 在赋值前先存到变量
                console.log('[useImageHandler (singleFrame)] createObjectURL result:', blobUrl); // <-- 日志5
                imageUrl.value = blobUrl;
            } else if (file.name.toLowerCase().endsWith('.dat')) {
                console.log('[useImageHandler (singleFrame)] Processing as .dat file.');
                console.time('[Perf useImageHandler (singleFrame)] file.arrayBuffer() for .dat');
                const arrayBuffer = await file.arrayBuffer();
                console.timeEnd('[Perf useImageHandler (singleFrame)] file.arrayBuffer() for .dat');
                console.log(`[useImageHandler (singleFrame)] .dat ArrayBuffer read (length: ${arrayBuffer?.byteLength}). Parsing...`);

                console.time('[Perf useImageHandler (singleFrame)] parseDatGrayscaleImage()');
                const dataURL = parseDatGrayscaleImage(arrayBuffer, IMAGE_ROWS, IMAGE_COLS);
                console.timeEnd('[Perf useImageHandler (singleFrame)] parseDatGrayscaleImage()');

                if (dataURL) {
                    console.log('[useImageHandler (singleFrame)] parseDatGrayscaleImage result (first 50 chars):', dataURL.substring(0, 50)); // <-- 日志6
                    imageUrl.value = dataURL;
                } else {
                    showNotificationCallback('❌ 无法解析 .dat 文件中的图像数据，或文件格式不正确。');
                    console.error('[useImageHandler (singleFrame)] parseDatGrayscaleImage returned null or empty.');
                }
            } else {
                showNotificationCallback('❌ 不支持的文件类型。请选择图像文件 (image/*) 或 .dat 文件。');
                console.warn('[useImageHandler (singleFrame)] Unsupported file type:', file.type, file.name);
                return;
            }

            if (imageUrl.value) {
                originalFile.value = file;
                imageName.value = file.name;
                console.log(`[useImageHandler (singleFrame)] originalFile and imageName set. imageUrl.value (first 50 chars): ${imageUrl.value.substring(0,50)}. Generating MD5 for ${file.name}...`); // <-- 日志7
                generateMD5(file).then(md5 => {
                    fileMD5.value = md5;
                    console.log(`[useImageHandler (singleFrame)] MD5 for ${file.name} generated: ${md5}`);
                }).catch(err => {
                    console.error(`[useImageHandler (singleFrame)] Error generating MD5 for ${file.name}:`, err);
                });
            } else {
                console.warn('[useImageHandler (singleFrame)] imageUrl.value is still null/empty after processing. MD5 and other states not set.'); // <-- 日志8
            }

        } catch (error) {
            console.error("[useImageHandler (singleFrame)] Error in handleFileSelected:", error); // <-- 日志9
            showNotificationCallback('❌ 处理文件时发生错误。');
            if (imageUrl.value && imageUrl.value.startsWith('blob:')) { URL.revokeObjectURL(imageUrl.value); }
            imageUrl.value = null; originalFile.value = null; fileMD5.value = ''; imageName.value = '';
        }
    }

    function deleteImage() {
        if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
            URL.revokeObjectURL(imageUrl.value);
        }
        imageUrl.value = null;
        originalFile.value = null;
        fileMD5.value = '';
        imageName.value = '';
    }

    return {
        imageUrl,
        originalFile,
        fileMD5,
        imageName,
        handleFileSelected,
        deleteImage,
    };
}