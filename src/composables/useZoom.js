import { ref } from 'vue';

export function useZoom(initialValue = 100, step = 10, min = 20, max = 300) {
    const zoomLevel = ref(initialValue);

    const zoomIn = () => {
        zoomLevel.value = Math.min(max, zoomLevel.value + step);
    };

    const zoomOut = () => {
        zoomLevel.value = Math.max(min, zoomLevel.value - step);
    };

    return {
        zoomLevel,
        zoomIn,
        zoomOut,
    };
}