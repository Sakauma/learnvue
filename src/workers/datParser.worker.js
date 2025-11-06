/**
 * @description 解析单个子图像的像素数据并创建图像Blob。
 * @param {ArrayBuffer} frameBuffer - 包含单个子图像16位像素数据的ArrayBuffer。
 * @param {number} rows - 图像的行数。
 * @param {number} cols - 图像的列数。
 * @returns {Promise<Blob|null>} 成功时返回包含PNG图像的Blob对象。
 */
function processSingleFrame(frameBuffer, rows, cols) {
    // 使用16位有符号整型数组读取像素数据 (short in C++ is often 16-bit signed)
    const pixelData = new Int16Array(frameBuffer);
    const totalPixels = rows * cols;

    if (pixelData.length < totalPixels) {
        console.error("Worker: 子图像数据大小不足。");
        return null;
    }

    // 寻找最大值和最小值用于归一化
    let maxVal = -32768, minVal = 32767;
    for (let i = 0; i < totalPixels; i++) {
        if (pixelData[i] > maxVal) maxVal = pixelData[i];
        if (pixelData[i] < minVal) minVal = pixelData[i];
    }

    const range = maxVal - minVal;
    const allSameValue = range === 0;

    // 使用OffscreenCanvas绘制图像
    const canvas = new OffscreenCanvas(cols, rows);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Worker: 无法获取OffscreenCanvas的2D上下文。");
        return null;
    }

    const imageData = ctx.createImageData(cols, rows);
    for (let i = 0; i < totalPixels; i++) {
        // 归一化到 0-255
        let val = allSameValue ? 128 : ((pixelData[i] - minVal) / range) * 255;
        val = Math.round(Math.max(0, Math.min(255, val)));

        // 设置RGBA值，因为是灰度图，所以R, G, B的值都相同
        imageData.data[i * 4] = val;     // R
        imageData.data[i * 4 + 1] = val; // G
        imageData.data[i * 4 + 2] = val; // B
        imageData.data[i * 4 + 3] = 255; // Alpha
    }
    ctx.putImageData(imageData, 0, 0);

    // 将Canvas内容转换为PNG格式的Blob对象
    return canvas.convertToBlob({ type: 'image/png' });
}

/**
 * @description Web Worker 的消息事件监听器。
 * 这是 Worker 的入口点。它根据接收到的'mode'来决定执行何种操作。
 */
self.onmessage = async function(e) {
    console.log('Worker: 收到来自主线程的消息。');
    const { datBuffer, rows, cols, mode, frameIndex } = e.data;

    try {
        // 使用DataView来安全地读取文件头
        const view = new DataView(datBuffer);
        if (datBuffer.byteLength < 4) {
            throw new Error("文件大小不足4字节，无法读取帧数。");
        }
        const frameCount = view.getInt32(0, true); // true for little-endian

        // 检查文件头是否合理
        const expectedHeaderSize = 4 + frameCount * 8;
        if (datBuffer.byteLength < expectedHeaderSize) {
            throw new Error(`文件头大小不足。需要 ${expectedHeaderSize} 字节，实际只有 ${datBuffer.byteLength} 字节。`);
        }

        // 读取偏移量和长度表
        const offsets = [];
        const imgLengths = [];
        let currentPos = 4;
        for (let i = 0; i < frameCount; i++) {
            offsets.push(view.getInt32(currentPos, true));
            currentPos += 4;
            imgLengths.push(view.getInt32(currentPos, true));
            currentPos += 4;
        }
        const headerOffsets = expectedHeaderSize;

        // --- 根据模式执行不同操作 ---
        if (mode === 'getCount') {
            // 模式1: 只获取子图像数量
            self.postMessage({ success: true, mode: 'getCount', frameCount: frameCount });

        } else if (mode === 'getSpecificFrame') {
            // 模式2: 获取指定索引的子图像
            if (frameIndex >= 0 && frameIndex < frameCount) {
                const offset = offsets[frameIndex];
                const imgLength = imgLengths[frameIndex];
                const SUB_HEADER_SIZE = 422;

                // 提取单个子图像的像素数据（跳过文件头、子图像偏移、子图像头）
                const frameDataBuffer = datBuffer.slice(
                    headerOffsets + offset + SUB_HEADER_SIZE,
                    headerOffsets + offset + imgLength
                );

                const imageBlob = await processSingleFrame(frameDataBuffer, rows, cols);
                if (imageBlob) {
                    self.postMessage({ success: true, mode: 'getSpecificFrame', imageBlob: imageBlob, frameIndex: frameIndex });
                } else {
                    throw new Error(`处理第 ${frameIndex} 帧失败。`);
                }
            } else {
                throw new Error(`请求的帧索引 ${frameIndex} 超出范围 (总帧数: ${frameCount})。`);
            }
        }

    } catch (error) {
        // 统一错误处理
        self.postMessage({ success: false, error: error.message });
    }
};