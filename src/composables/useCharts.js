import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

/**
 * 计算正态分布概率密度函数值
 * @param {number} x - 输入值
 * @param {number} mean - 均值
 * @param {number} std - 标准差
 * @returns {number} 正态分布概率密度
 */
const normalDistribution = (x, mean, std) => {
    return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * std ** 2));
};

/**
 * 生成初始正态分布数据
 * @param {number} chartIndex - 图表索引（影响均值）
 * @returns {Object} 包含两条曲线数据的对象
 */
const generateInitialLocalData = (chartIndex) => {
    const mean1Base = chartIndex * 0.5 + 1;
    const std1 = 0.5;
    const mean2Base = chartIndex * 0.5 + 1.5;
    const std2 = 0.5;
    const data1 = [], data2 = [];
    for (let x = -5; x <= 5; x += 0.1) { // 101 points
        data1.push([x, normalDistribution(x, mean1Base, std1)]);
        data2.push([x, normalDistribution(x, mean2Base, std2)]);
    }
    return { data1, data2 };
};

/**
 * ECharts图表组合式函数
 * @param {Ref} chartRef - 图表容器的模板引用
 * @param {number} chartIndex - 图表索引（用于区分不同图表）
 * @returns {Object} 包含更新图表方法和初始化状态的对象
 */
export function useChart(chartRef, chartIndex) {
    let chartInstance = null;
    const isInitialized = ref(false);
    const initChart = () => {
        if (!chartRef.value) {
            return;
        }

        try {
            chartInstance = echarts.init(chartRef.value);
            isInitialized.value = true;
        } catch (e) {
            console.error(`initChart: Failed to initialize ECharts for index ${chartIndex}:`, e);
            return;
        }

        // 初始化空的坐标系，设定默认的X轴和Y轴范围
        const initialOption = {
            xAxis: {
                type: 'value',
                name: 'X轴',
                min: 0,  // 初始X轴默认范围
                max: 10, // 初始X轴默认范围
                nameLocation: 'middle', nameGap: 25,
                nameTextStyle: { // X轴名称样式
                    color: 'white'
                },
                axisLine: { // X轴轴线样式
                    show: true,
                    lineStyle: {
                        color: 'white',
                        width: 2 // X轴轴线加粗
                    }
                },
                axisLabel: { // X轴刻度标签文字样式
                    color: 'white'
                },
                axisTick: { // X轴刻度线样式
                    show: true,
                    lineStyle: {
                        color: 'white'
                    }
                },
                splitLine: { // X轴对应的网格线
                    show: true,
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        width: 1 // 网格线宽度
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: 'Y轴',
                min: 0,  // 初始Y轴默认范围
                max: 1,  // 初始Y轴默认范围
                nameLocation: 'middle', nameGap: 30, // 根据轴线宽度和标签调整
                nameTextStyle: { // Y轴名称样式
                    color: 'white'
                },
                axisLine: { // Y轴轴线样式
                    show: true,
                    lineStyle: {
                        color: 'white',
                        width: 2 // Y轴轴线加粗
                    }
                },
                axisLabel: { // Y轴刻度标签文字样式
                    color: 'white'
                },
                axisTick: { // Y轴刻度线样式
                    show: true,
                    lineStyle: {
                        color: 'white'
                    }
                },
                splitLine: { // Y轴对应的网格线
                    show: true,
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        width: 1
                    }
                }
            },
            series: [], // 初始化时不绘制任何系列数据
            grid: {left: '10%', right: '10%', top: '15%', bottom: '15%', containLabel: true},
            legend: {
                data: ['后端数据曲线'], // 预定义图例项
                textStyle: { // 图例文字颜色
                    color: 'white'
                }
            },
            dataZoom: [
                {
                    type: 'inside', // 内置型，支持鼠标滚轮缩放
                    xAxisIndex: [0],  // 控制X轴
                    filterMode: 'filter' // 'filter' 模式：数据过滤。'empty' 模式：数据窗口平移。
                },
                {
                    type: 'inside', // 内置型，支持鼠标滚轮缩放
                    yAxisIndex: [0],  // 控制Y轴
                    filterMode: 'empty'
                },
                // 要显示底部的滑动条
                // {
                //     type: 'slider', // 滑动条型
                //     xAxisIndex: [0],
                //     filterMode: 'filter'
                // }
            ]
        };
        chartInstance.setOption(initialOption);
    };

    /**
     * 更新图表数据
     * @param {Array} newChartData - 新数据集（格式：[[x,y], ...]）
     * @param {string} [seriesName='数据曲线'] - 系列名称
     */
    const updateChart = (newChartData, seriesName = '数据曲线') => {
        if (chartInstance && isInitialized.value && !chartInstance.isDisposed()) {
            const newOption = {
                xAxis: { // 允许X轴根据新数据自动调整范围
                    type: 'value', // 确保类型不变或按需设置
                    min: null,     // 设置为null或不设置，ECharts会根据数据自动计算 'dataMin'
                    max: null,     // 设置为null或不设置，ECharts会根据数据自动计算 'dataMax'
                    name: 'X轴', nameLocation: 'middle', nameGap: 25, axisLabel: {formatter: '{value}'}
                },
                yAxis: { // 允许Y轴根据新数据自动调整范围
                    type: 'value',
                    min: null,
                    max: null,
                    name: 'Y轴', nameLocation: 'middle', nameGap: 30, axisLabel: {formatter: '{value}'}
                },
                legend: {
                    data: [seriesName],
                    textStyle: {
                        color: 'white'
                    }
                },
                series: [
                    {
                        name: seriesName,
                        type: 'line',
                        data: newChartData || [],
                        smooth: true,
                        lineStyle: { color: 'red', width: 3 }, // 设定曲线风格
                        showSymbol: false
                    }
                ],
                dataZoom: [
                    {
                        type: 'inside',
                        xAxisIndex: [0],
                        filterMode: 'filter'
                    },
                    {
                        type: 'inside',
                        yAxisIndex: [0],
                        filterMode: 'empty'
                    }
                ]
            };

            // ECharts会重新计算范围。
            chartInstance.setOption(newOption);
        }
    };

    setTimeout(() => {
        initChart(); // 初始化坐标系
    }, 0);

    const resizeChart = () => { if (chartInstance && !chartInstance.isDisposed()) chartInstance.resize(); };

    onMounted(() => {
        window.addEventListener('resize', resizeChart);
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeChart);
        if (chartInstance && !chartInstance.isDisposed()) {
            chartInstance.dispose();
            chartInstance = null;
            isInitialized.value = false;
        }
    });

    return { updateChartData: updateChart, isInitialized };
}