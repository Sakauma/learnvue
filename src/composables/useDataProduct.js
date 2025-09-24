import { computed } from 'vue';
import axios from 'axios';
import { useNotifications } from './useNotifications.js';

/**
 * @description 数据产品处理器 Composable
 * 负责根据后端返回的原始特征数据，生成、下载和传输结构化的数据产品。
 * @param {import('vue').Ref<object>} allFeaturesDataRef - 包含所有帧特征数据的响应式引用。
 * @returns {object} 包含数据产品生成和操作方法的对象。
 */
export function useDataProduct(allFeaturesDataRef) {

    const { showNotification } = useNotifications();

    const KEY_MAP = {
        'peak_cell_intensity': 'XJY 峰值辐射强度',
        'xjy_background_intensity': 'XJY 的背景亮度',
        'SCR': '信杂比',
        'mean_region': 'XJY 像素平均灰度',
        'contrast': '对比度',
        'entropy': '信息熵',
        'homogeneity': '同质性'
        // ... 其他键名映射
    };

    /**
     * @description 计算属性：检查是否可以生成完整的数据产品。
     * @returns {boolean} 如果有有效的多帧数据则返回 true。
     */
    const canGenerateFullProduct = computed(() => {
        const allData = allFeaturesDataRef.value;
        // 检查是否有数据，并且至少有一个特征是包含多个元素的数组
        return allData && Object.keys(allData).length > 0 &&
            Object.values(allData).some(val => Array.isArray(val) && val.length > 0);
    });

    /**
     * @description 生成包含所有帧的完整数据产品。
     * @returns {object | null} 包含所有帧数据的产品对象，或在没有数据时返回 null。
     */
    function generateFullProduct() {
        if (!canGenerateFullProduct.value) {
            return null;
        }

        const allData = allFeaturesDataRef.value;
        const fullProduct = {};

        // 从第一个数组类型的特征中获取总帧数
        const firstArrayFeature = Object.values(allData).find(val => Array.isArray(val));
        const totalFrames = firstArrayFeature.length;

        // 遍历每一帧
        for (let i = 0; i < totalFrames; i++) {
            const frameData = {};

            // 遍历映射表，为当前帧提取数据
            for (const backendKey in KEY_MAP) {
                if (allData[backendKey] !== undefined) {
                    const productKey = KEY_MAP[backendKey];
                    const value = Array.isArray(allData[backendKey])
                        ? allData[backendKey][i]
                        : allData[backendKey]; // 处理非数组类型（对所有帧都相同）的数据

                    if (value !== undefined && value !== null) {
                        frameData[productKey] = value;
                    }
                }
            }

            // 添加其他固定或模拟字段
            frameData['数据1帧计数'] = i + 1;
            frameData['数据1时间'] = { "时标结构体": "16+6+32 (占位)" };
            frameData['XJY 像面平均速度'] = { "vx": 0.0, "vy": 0.0 };

            // 将当前帧的数据以 "XJY数据X" 的格式添加到最终产品中
            fullProduct[`XJY数据${i + 1}`] = frameData;
        }

        return fullProduct;
    }

    /**
     * @description 下载包含所有帧的完整数据产品。
     */
    function downloadFullProduct() {
        const fullProduct = generateFullProduct();
        if (!fullProduct) {
            showNotification('❌ 没有可供下载的数据产品。');
            return;
        }

        try {
            const dataStr = JSON.stringify(fullProduct, null, 4);
            const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `XJY_Data_Product_All_Frames.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showNotification(`✅ 已开始下载完整的数据产品。`);
        } catch (error) {
            console.error("下载数据产品失败:", error);
            showNotification('❌ 生成下载文件时出错。');
        }
    }

    /**
     * @description 传输包含所有帧的完整数据产品。
     * @param {string} targetUrl - 接收数据产品的目标URL。
     */
    async function transmitFullProduct(targetUrl = 'http://localhost:8082/api/data_product') {
        const fullProduct = generateFullProduct();
        if (!fullProduct) {
            showNotification('❌ 没有可供传输的数据产品。');
            return;
        }

        try {
            showNotification(`🚧 正在传输完整数据产品到 ${targetUrl}...`);
            const response = await axios.post(targetUrl, fullProduct, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.status >= 200 && response.status < 300) {
                showNotification('✅ 完整数据产品传输成功！');
            } else {
                showNotification(`⚠️ 传输完成，但服务器响应状态异常: ${response.status}`);
            }
        } catch (error) {
            console.error("数据产品传输失败:", error);
            let errorMessage = '❌ 数据产品传输失败';
            if (error.response) { errorMessage += `: 服务器响应 ${error.response.status}`; }
            else if (error.request) { errorMessage += ': 未能连接到服务器，请检查目标地址和网络。'; }
            else { errorMessage += `: ${error.message}`; }
            showNotification(errorMessage, 3000);
        }
    }

    return {
        canGenerateFullProduct,
        downloadFullProduct,
        transmitFullProduct,
    };
}