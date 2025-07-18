/**
 * @description 解析二进制 .dat 文件数据并将其转换为灰度PNG图像。
 * 此函数在 Web Worker 环境中运行，以避免阻塞主线程。
 * 它会根据指定的精度（如 float64, float32 等）读取数据，
 * 对像素值进行归一化处理，然后使用 OffscreenCanvas 将其绘制成图像。
 *
 * @param {ArrayBuffer} datBuffer - 包含原始像素数据的 ArrayBuffer 对象。
 * @param {number} rows - 图像的行数（高度）。
 * @param {number} cols - 图像的列数（宽度）。
 * @param {'float64' | 'float32' | 'uint16' | 'uint8'} [precision='float64'] - 缓冲区中每个像素的数据类型。
 * @returns {Promise<Blob | null>} 一个 Promise，成功时解析为包含 PNG 图像的 Blob 对象，失败时解析为 null。
 */
function parseDatGrayscaleImage(datBuffer, rows, cols, precision = 'float64') {
    // --- 1. 输入验证 ---
    if (!datBuffer || !(datBuffer instanceof ArrayBuffer)) {
        console.error("Worker: 无效的 datBuffer。它必须是一个 ArrayBuffer。");
        return null;
    }
    if (rows <= 0 || cols <= 0) {
        console.error("Worker: 无效的图像尺寸。行和列必须大于0。");
        return null;
    }

    // --- 2. 根据精度选择正确的数据类型数组 ---
    let TypedArray;
    switch (precision) {
        case 'float32': TypedArray = Float32Array; break;
        case 'uint16': TypedArray = Uint16Array; break;
        case 'uint8': TypedArray = Uint8Array; break;
        case 'float64':
        default:
            TypedArray = Float64Array;
            break;
    }

    // 验证缓冲区大小是否足够
    if (datBuffer.byteLength < rows * cols * TypedArray.BYTES_PER_ELEMENT) {
        console.error(`Worker: 数据缓冲区大小不足 (仅 ${datBuffer.byteLength} 字节)，无法按 ${precision} 类型 (需要 ${rows * cols * TypedArray.BYTES_PER_ELEMENT} 字节) 进行解析。`);
        return null;
    }

    // --- 3. 数据归一化处理 ---
    const pixelData = new TypedArray(datBuffer);
    const totalPixels = rows * cols;

    // 寻找像素数据的最大值和最小值，用于后续的归一化
    let maxVal = -Infinity, minVal = Infinity;
    for (let i = 0; i < totalPixels; i++) {
        if (pixelData[i] > maxVal) maxVal = pixelData[i];
        if (pixelData[i] < minVal) minVal = pixelData[i];
    }

    const range = maxVal - minVal;
    // 处理所有像素值都相同的情况，避免除以零
    const allSameValue = range === 0;

    // --- 4. 使用 OffscreenCanvas 绘制图像 ---
    // OffscreenCanvas 是在 Worker 中进行 canvas 操作的理想选择，因为它不依赖于 DOM
    const canvas = new OffscreenCanvas(cols, rows);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error("Worker: 无法从 OffscreenCanvas 获取2D上下文。");
        return null;
    }

    const imageData = ctx.createImageData(cols, rows);
    // 遍历所有像素
    for (let i = 0; i < totalPixels; i++) {
        // 将像素值归一化到 0-255 的范围
        let val = allSameValue ? 128 : ((pixelData[i] - minVal) / range) * 255;
        // 取整并确保值在 [0, 255] 区间内
        val = Math.round(Math.max(0, Math.min(255, val)));

        // 设置 RGBA 值。因为是灰度图，所以 R, G, B 的值都相同
        imageData.data[i * 4] = val;     // R
        imageData.data[i * 4 + 1] = val; // G
        imageData.data[i * 4 + 2] = val; // B
        imageData.data[i * 4 + 3] = 255; // Alpha (不透明)
    }

    // 将处理好的像素数据放回 canvas
    ctx.putImageData(imageData, 0, 0);

    // --- 5. 返回结果 ---
    // 将 canvas 内容转换为 PNG 格式的 Blob 对象并返回
    return canvas.convertToBlob({ type: 'image/png' });
}


/**
 * @description Web Worker 的消息事件监听器。
 * 这是 Worker 的入口点。它接收来自主线程的消息，
 * 调用图像解析函数，然后将结果（成功时的 Blob 或失败时的错误信息）
 * 通过 postMessage 发送回主线程。
 *
 * @param {MessageEvent} e - 消息事件对象。
 * @param {object} e.data - 从主线程传递过来的数据。
 * @param {ArrayBuffer} e.data.datBuffer - 原始.dat文件数据。
 * @param {number} e.data.rows - 图像行数。
 * @param {number} e.data.cols - 图像列数。
 * @param {string} e.data.precision - 数据精度。
 */
self.onmessage = async function(e) {
    console.log('Worker: 收到来自主线程的消息。');
    const { datBuffer, rows, cols, precision } = e.data;

    try {
        const imageBlob = await parseDatGrayscaleImage(datBuffer, rows, cols, precision);

        if (imageBlob) {
            // 如果成功生成 Blob，将其发送回主线程
            self.postMessage({ success: true, imageBlob: imageBlob });
        } else {
            // 如果函数返回 null，则发送一个失败消息
            self.postMessage({ success: false, error: '解析函数未能返回Blob对象' });
        }
    } catch (error) {
        // 如果在解析过程中抛出任何异常，捕获并发送错误信息
        self.postMessage({ success: false, error: error.message });
    }
};