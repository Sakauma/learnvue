import { ref } from 'vue';

/**
 * 创建一个可缩放的状态管理组合式函数
 * @param {number} initialValue - 初始缩放值，默认为100
 * @param {number} step - 每次缩放的步长，默认为10
 * @param {number} min - 最小缩放值，默认为20
 * @param {number} max - 最大缩放值，默认为300
 * @returns {Object} 包含缩放状态和操作方法的对象
 */
export function useZoom(initialValue = 100, step = 10, min = 20, max = 300) {
    // 创建响应式缩放级别状态
    const zoomLevel = ref(initialValue);

    const zoomIn = () => {
        zoomLevel.value = Math.min(max, zoomLevel.value + step);
    };

    const zoomOut = () => {
        zoomLevel.value = Math.max(min, zoomLevel.value - step);
    };

    // 返回包含状态和操作方法的对象
    return {
        zoomLevel,  // 当前缩放级别
        zoomIn,     // 放大方法
        zoomOut,    // 缩小方法
    };
}