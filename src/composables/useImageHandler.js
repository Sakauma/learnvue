import {ref} from 'vue';
import SparkMD5 from 'spark-md5';
import { parseDatFileWithWorker } from './useDatParser.js';

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

    async function handleFileSelected(file, rows, cols, precision) {
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
                const dataURL = await parseDatFileWithWorker(arrayBuffer, rows, cols, precision);
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
            }

        } catch (error) {
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