// TODO: 后续算法名称在这里修改
/**
 * @description 统一管理所有算法的定义
 * value: 传递到后端的值
 * label: 前端显示名称
 */
export const TRADITIONAL_ALGORITHMS = [
    { label: '光流法', value: 'opticalFlow' },
    { label: '多帧累积', value: 'multiFrameDifference' },
    { label: '低秩稀疏', value: '低秩稀疏' }
];

export const DEEP_LEARNING_ALGORITHMS = [
    { label: 'VGG', value: 'VGG' },
    { label: 'DNANet', value: 'DNANet' },
    { label: 'UNet', value: 'UNet' },
    { label: 'ALCNet', value: 'ALCNet' }
];