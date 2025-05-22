import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as echarts from 'echarts';

// 正态分布函数
const normalDistribution = (x, mean, std) => {
    return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-((x - mean) ** 2) / (2 * std ** 2));
};

// 生成本地初始数据的函数
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
            console.error(`initChart - Failed to initialize ECharts for index ${chartIndex}:`, e);
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
        };
        chartInstance.setOption(initialOption);
    };

    // newData: 期望格式为 [[x,y], [x,y], ...]
    const updateChart = (newChartData) => {
        if (chartInstance && isInitialized.value && !chartInstance.isDisposed()) {
            const newOption = {
                xAxis: { // 允许X轴根据新数据自动调整范围
                    type: 'value', // 确保类型不变或按需设置
                    min: null,     // 设置为null或不设置，ECharts会根据数据自动计算 'dataMin'
                    max: null,     // 设置为null或不设置，ECharts会根据数据自动计算 'dataMax'
                    // 保留其他X轴样式配置
                    name: 'X轴', nameLocation: 'middle', nameGap: 25, axisLabel: {formatter: '{value}'}
                },
                yAxis: { // 允许Y轴根据新数据自动调整范围
                    type: 'value',
                    min: null,
                    max: null,
                    // 保留其他Y轴样式配置
                    name: 'Y轴', nameLocation: 'middle', nameGap: 30, axisLabel: {formatter: '{value}'}
                },
                legend: {
                    data: ['后端数据曲线'] // 可以更换名称
                },
                series: [
                    {
                        name: '后端数据曲线',
                        type: 'line',
                        data: newChartData || [],
                        smooth: true,
                        lineStyle: { color: 'red', width: 3 }, // 设定曲线风格
                        showSymbol: false
                    }
                ]
            };

            // ECharts会重新计算范围。
            chartInstance.setOption(newOption);
        } else {
            console.warn(`updateChartWithSingleBackendSeries: Chart ${chartIndex} not ready or disposed. Data not updated.`);
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

