function parseDatGrayscaleImage(datBuffer, rows, cols, precision = 'float64') {
    if (!datBuffer || !(datBuffer instanceof ArrayBuffer)) {
        console.error("Worker: 无效的 datBuffer。");
        return null;
    }
    if (rows <= 0 || cols <= 0) {
        console.error("Worker: 无效的图像尺寸。");
        return null;
    }

    let TypedArray;
    switch (precision) {
        case 'float32': TypedArray = Float32Array; break;
        case 'uint16': TypedArray = Uint16Array; break;
        case 'uint8': TypedArray = Uint8Array; break;
        case 'float64': default: TypedArray = Float64Array; break;
    }

    if (datBuffer.byteLength < rows * cols * TypedArray.BYTES_PER_ELEMENT) {
        console.error(`Worker: 数据缓冲区大小不足，无法按 ${precision} 类型进行解析。`);
        return null;
    }

    const pixelData = new TypedArray(datBuffer);
    const totalPixels = rows * cols;

    let maxVal = -Infinity, minVal = Infinity;
    for (let i = 0; i < totalPixels; i++) {
        if (pixelData[i] > maxVal) maxVal = pixelData[i];
        if (pixelData[i] < minVal) minVal = pixelData[i];
    }

    const range = maxVal - minVal;
    const allSameValue = range === 0;
    const canvas = new OffscreenCanvas(cols, rows);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error("Worker: 无法从 OffscreenCanvas 获取2D上下文。");
        return null;
    }

    const imageData = ctx.createImageData(cols, rows);
    for (let i = 0; i < totalPixels; i++) {
        let val = allSameValue ? 128 : ((pixelData[i] - minVal) / range) * 255;
        val = Math.round(Math.max(0, Math.min(255, val)));
        imageData.data[i * 4] = val;
        imageData.data[i * 4 + 1] = val;
        imageData.data[i * 4 + 2] = val;
        imageData.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas.convertToBlob({ type: 'image/png' });
}


self.onmessage = async function(e) {
    console.log('Worker: 收到来自主线程的消息。');
    const { datBuffer, rows, cols, precision } = e.data;

    try {
        const imageBlob = await parseDatGrayscaleImage(datBuffer, rows, cols, precision);

        if (imageBlob) {
            self.postMessage({ success: true, imageBlob: imageBlob });
        } else {
            self.postMessage({ success: false, error: '解析函数未能返回Blob对象' });
        }
    } catch (error) {
        self.postMessage({ success: false, error: error.message });
    }
};