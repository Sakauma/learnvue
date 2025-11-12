import DatParserWorker from '../workers/datParser.worker.js?worker';

/**
 * 使用Web Worker解析.dat文件并返回图像URL
 * @param {ArrayBuffer} datBuffer - 要解析的.dat文件二进制数据
 * @param {number} rows - 图像的行数
 * @param {number} cols - 图像的列数
 * @param {number} precision - 数据精度（如8位、16位等）
 * @returns {Promise<string|null>} - 返回Promise，解析成功时返回图像URL，失败时返回null
 */
export function parseDatFileWithWorker(datBuffer, rows, cols, precision) {
    return new Promise((resolve, reject) => {
        // 创建一个新的DatParserWorker实例
        const worker = new DatParserWorker();
        // 处理从Worker返回的消息
        worker.onmessage = (e) => {
            const { success, imageBlob, error } = e.data;
            if (success && imageBlob) {
                // 如果解析成功且返回了图像Blob，创建对象URL并解析Promise
                const url = URL.createObjectURL(imageBlob);
                resolve(url);
            } else {
                // 如果解析失败，打印错误日志并解析Promise为null
                console.error("Worker解析失败:", error);
                resolve(null);
            }
            // 无论成功或失败，都终止Worker以释放资源
            worker.terminate();
        };
        // 处理Worker内部发生的错误
        worker.onerror = (e) => {
            console.error("Worker发生错误:", e.message);
            reject(e);
            worker.terminate();
        };
        // 向Worker发送消息，包含.dat文件数据和参数
        worker.postMessage({ datBuffer, rows, cols, precision }, [datBuffer]);
    });
}