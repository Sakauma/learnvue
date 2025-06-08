import DatParserWorker from '../workers/datParser.worker.js?worker';

export function parseDatFileWithWorker(datBuffer, rows, cols, precision) {
    return new Promise((resolve, reject) => {
        const worker = new DatParserWorker();

        // 处理从Worker返回的消息
        worker.onmessage = (e) => {
            const { success, imageBlob, error } = e.data;
            if (success && imageBlob) {
                const url = URL.createObjectURL(imageBlob);
                resolve(url);
            } else {
                console.error("Worker解析失败:", error);
                resolve(null);
            }
            worker.terminate();
        };

        worker.onerror = (e) => {
            console.error("Worker发生错误:", e.message);
            reject(e);
            worker.terminate();
        };

        worker.postMessage({ datBuffer, rows, cols, precision }, [datBuffer]);
    });
}