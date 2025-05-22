import {ref} from 'vue';
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

async function generateMD5ForFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
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

export function useImageHandler(showNotificationCallback) {
    const imageUrl = ref(null);
    const originalFile = ref(null);
    const fileMD5 = ref('');
    const imageName = ref('');

    async function handleFileSelected(file) {
        if (!file) {
            console.warn('handleFileSelected called with no file.');
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

        try {
            if (file.type.startsWith('image/')) {
                imageUrl.value = URL.createObjectURL(file);
            } else if (file.name.toLowerCase().endsWith('.dat')) {
                const arrayBuffer = await file.arrayBuffer();
                const dataURL = parseDatGrayscaleImage(arrayBuffer, IMAGE_ROWS, IMAGE_COLS);

                if (dataURL) {
                    imageUrl.value = dataURL;
                } else {
                    showNotificationCallback('❌ 无法解析 .dat 文件中的图像数据，或文件格式不正确。');
                }
            } else {
                showNotificationCallback('❌ 不支持的文件类型。请选择图像文件 (image/*) 或 .dat 文件。');
                return;
            }

            if (imageUrl.value) {
                originalFile.value = file;
                imageName.value = file.name;
                fileMD5.value = await generateMD5ForFile(file);
            } else {
            }

        } catch (error) {
            console.error("Error in handleFileSelected:", error); // <-- 日志9
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