import { ref } from 'vue';
import SparkMD5 from 'spark-md5';
import { parseDatFileWithWorker } from './useDatParser.js';

/**
 * 计算文件的MD5哈希值
 * @param {File} file - 要计算MD5的文件对象
 * @returns {Promise<string>} - 返回包含MD5哈希值的Promise
 */
async function generateMD5ForFile(file) {
    return new Promise((resolve, reject) => {
        // 如果没有文件，直接返回空字符串
        if (!file) {
            resolve('');
            return;
        }
        // 创建FileReader实例用于读取文件
        const reader = new FileReader();
        // 文件读取成功时的处理
        reader.onload = (e) => {
            try {
                // 获取文件的ArrayBuffer
                const buffer = e.target.result;
                // 使用SparkMD5计算MD5哈希值
                const md5 = SparkMD5.ArrayBuffer.hash(buffer);
                resolve(md5);
            } catch (error) {
                console.error("MD5哈希计算出错:", error);
                reject(error);
            }
        };
        // 文件读取失败时的处理
        reader.onerror = (err) => {
            console.error("FileReader读取出错:", err);
            reject(err);
        };
        // 开始读取文件为ArrayBuffer
        reader.readAsArrayBuffer(file);
    });
}
/**
 * 文件处理钩子函数，提供文件选择和删除功能
 * @param {Function} showNotificationCallback - 显示通知的回调函数
 * @returns {Object} - 包含所有状态和方法的响应式对象
 */
export function useImageHandler(showNotificationCallback) {
    // 创建响应式变量
    const imageUrl = ref(null);       // 存储图像URL
    const originalFile = ref(null);   // 存储原始文件对象
    const fileMD5 = ref('');          // 存储文件的MD5哈希值
    const imageName = ref('');        // 存储文件名
    /**
     * 处理文件选择
     * @param {File} file - 用户选择的文件
     * @param {number} rows - 图像的行数（用于.dat文件解析）
     * @param {number} cols - 图像的列数（用于.dat文件解析）
     * @param {number} precision - 数据精度（用于.dat文件解析）
     */
    async function handleFileSelected(file, rows, cols, precision) {
        // 如果没有文件，直接返回
        if (!file) {
            console.warn('handleFileSelected called with no file.');
            return;
        }
        // 重置状态
        if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
            // 如果存在Blob URL，释放它
            URL.revokeObjectURL(imageUrl.value);
        }
        // 重置所有状态变量
        imageUrl.value = null;
        originalFile.value = null;
        fileMD5.value = '';
        imageName.value = '';
        try {
            // 根据文件类型处理
            if (file.type.startsWith('image/')) {
                // 如果是图像文件，直接创建URL
                imageUrl.value = URL.createObjectURL(file);
            } else if (file.name.toLowerCase().endsWith('.dat')) {
                // 如果是.dat文件，解析为图像
                const arrayBuffer = await file.arrayBuffer();
                const dataURL = await parseDatFileWithWorker(arrayBuffer, rows, cols, precision);
                if (dataURL) {
                    imageUrl.value = dataURL;
                } else {
                    // 解析失败时显示通知
                    showNotificationCallback('❌ 无法解析 .dat 文件中的图像数据，或文件格式不正确。');
                }
            } else {
                // 不支持的文件类型
                showNotificationCallback('❌ 不支持的文件类型。请选择图像文件 (image/*) 或 .dat 文件。');
                return;
            }
            // 如果成功设置图像URL，更新其他状态
            if (imageUrl.value) {
                originalFile.value = file;
                imageName.value = file.name;
                fileMD5.value = await generateMD5ForFile(file);
            }
        } catch (error) {
            // 处理过程中的错误
            showNotificationCallback('❌ 处理文件时发生错误。');
            if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
                URL.revokeObjectURL(imageUrl.value);
            }
            // 重置所有状态变量
            imageUrl.value = null;
            originalFile.value = null;
            fileMD5.value = '';
            imageName.value = '';
        }
    }
    /**
     * 删除当前图像
     */
    function deleteImage() {
        if (imageUrl.value && imageUrl.value.startsWith('blob:')) {
            // 释放Blob URL
            URL.revokeObjectURL(imageUrl.value);
        }
        // 重置所有状态变量
        imageUrl.value = null;
        originalFile.value = null;
        fileMD5.value = '';
        imageName.value = '';
    }
    // 返回所有状态和方法
    return {
        imageUrl,
        originalFile,
        fileMD5,
        imageName,
        handleFileSelected,
        deleteImage,
    };
}