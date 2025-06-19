/**
 * @description 统一管理所有图像特征的定义
 * key: 后端返回数据中的键名
 * label: 前端显示名称
 */
export const FEATURE_DEFINITIONS = [
    { key: "variance",    label: "方差" },
    { key: "mean_region", label: "均值" },
    { key: "SCR",         label: "信杂比" },
    { key: "contrast",    label: "对比度" },
    { key: "entropy",     label: "信息熵" },
    { key: "homogeneity", label: "同质性" },
    { key: "smoothness",  label: "平滑性" },
    { key: "skewness",    label: "偏度" },
    { key: "kurtosis",    label: "峰度" },
    { key: "xjy_area",    label: "目标XJY所占像素数" },
    { key: "peak_cell_intensity", label: "峰单元强度" },
    { key: "xjy_background_intensity", label: "XJY背景强度" },
];