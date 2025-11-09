/* WorldMapDialog.vue */
<template>
  <el-dialog
      :model-value="visible"
      title="全球分析结果"
      width="65%"
      @update:model-value="$emit('update:visible', $event)"
      :close-on-click-modal="false"
      @opened="initMap"
  >
    <!-- 地图控制工具栏 -->
    <div class="map-controls">
      <el-button-group>
        <el-button @click="toggleGrid" :type="showGrid ? 'primary' : ''">
          {{ showGrid ? '隐藏网格' : '显示网格' }}
        </el-button>
<!--        <el-button @click="toggleGeoJSON" :type="showGeoJSON ? 'primary' : ''">-->
<!--          {{ showGeoJSON ? '隐藏边界' : '显示边界' }}-->
<!--        </el-button>-->
        <el-button @click="toggleLabels" :type="showLabels ? 'primary' : ''">
          {{ showLabels ? '隐藏标识' : '显示标识' }}
        </el-button>
        <el-button @click="clearAllMarkers">清除轨迹</el-button>
      </el-button-group>
      <!-- 网格间隔调整 -->
      <div class="grid-controls">
        <span>经度间隔:</span>
        <el-select v-model="gridOptions.lngStep" size="small" style="width: 80px; margin: 0 8px;">
          <el-option label="15°" :value="15"></el-option>
          <el-option label="30°" :value="30"></el-option>
          <el-option label="45°" :value="45"></el-option>
        </el-select>
        <span>纬度间隔:</span>
        <el-select v-model="gridOptions.latStep" size="small" style="width: 80px; margin: 0 8px;">
          <el-option label="15°" :value="15"></el-option>
          <el-option label="30°" :value="30"></el-option>
          <el-option label="45°" :value="45"></el-option>
        </el-select>
        <el-button @click="updateGrid" size="small">更新网格</el-button>
      </div>
    </div>
    <div ref="mapContainerRef" style="width: 100%; height: 60vh;"></div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onUnmounted, reactive, watch } from 'vue';
import { ElDialog, ElButton, ElButtonGroup, ElSelect, ElOption } from 'element-plus';

const props = defineProps({
  visible: Boolean,
  markerData: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['update:visible']);

const mapContainerRef = ref(null);
let map = null;
let analysisMarkersLayer = null; // 用于分析数据
let testMarkersLayer = null;     // 用于测试数据
let gridLayer = null;
let labelLayer = null;
let geoJsonLayer = null;

const showGrid = ref(true);
const showGeoJSON = ref(true);
const showLabels = ref(true);

// 网格配置 - 在这里调整经纬度间隔
const gridOptions = reactive({
  latStep: 5,  // 纬度间隔 - 修改这个值调整纬度线密度
  lngStep: 5,  // 经度间隔 - 修改这个值调整经度线密度
  style: {
    color: 'rgba(100, 150, 255, 0.6)',
    weight: 1,
    opacity: 0.6,
    dashArray: '5,5'
  }
});

/**
 * 初始化Leaflet地图
 */
async function initMap() {
  if (!mapContainerRef.value) {
    console.warn('Map container ref is not available.');
    return;
  }

  // 动态导入Leaflet，避免SSR问题
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');

  // 清除之前的地图实例
  if (map) {
    map.remove();
  }

  // 初始化地图
  map = L.map(mapContainerRef.value);
  setTimeout(() => {
    map.setView([30, 0], 2);
    //map.setView([35, 105], 3); // 中心点设置为中国，缩放级别3
    map.invalidateSize(); // 重要：重新计算地图尺寸
  }, 100);

  // 添加本地瓦片图层
  L.tileLayer('/tiles/{z}/{x}/{y}.webp', {
    minZoom: 0,
    maxZoom: 5,
    tileSize: 256,
    noWrap: true,
    attribution: '',
  }).addTo(map);

  // 移除默认的缩放控件
  map.removeControl(map.zoomControl);

  // 初始化标记图层
  analysisMarkersLayer = L.layerGroup().addTo(map);
  testMarkersLayer = L.layerGroup();// 测试数据现在默认不显示
  // 初始化网格图层
  gridLayer = L.layerGroup();
  // 初始化经纬标识图层
  labelLayer = L.layerGroup();
  // 初始化GeoJSON图层
  geoJsonLayer = L.layerGroup();

  // 添加分析数据
  if (props.markerData && props.markerData.length > 0) {
    console.log("WorldMap: 正在渲染分析数据...", props.markerData);
    addAnalysisData(L, props.markerData);
  } else {
    console.log("WorldMap: 没有可渲染的分析数据。");
  }

  // 添加示例数据点、网格和GeoJSON边界
  if (showGrid.value) {
    drawGrid(L);
    map.addLayer(gridLayer);
  }
  if (showLabels.value) {
    drawLabels(L);
    map.addLayer(labelLayer);
  }
  if (showGeoJSON.value) {
    await loadGeoJSON(L);
  }

  // 添加图层控制
  setTimeout(() => {
    // 添加图层控制
    L.control.layers(
        {},
        {
          '分析数据': analysisMarkersLayer,
          '经纬网格': gridLayer,
          '经纬标识': labelLayer,
          '国家边界': geoJsonLayer
        },
        {
          position: 'topright',
          collapsed: true
        }
    ).addTo(map);
  }, 100);
  console.log('地图初始化完成，图层控制已添加');
}

// 添加一个 Watcher 侦听 prop 变化
watch(() => props.markerData, (newData) => {
  // 检查地图是否已初始化
  if (map && analysisMarkersLayer && window.L) {
    console.log("WorldMap Watcher: 检测到分析数据更新，正在重绘...");
    addAnalysisData(window.L, newData);
  }
}, { deep: true }); // 深度侦听

// 添加一个 Watcher 侦听 prop 变化
watch(() => props.markerData, (newData) => {
  // 检查地图是否已初始化
  if (map && analysisMarkersLayer && window.L) {
    console.log("WorldMap Watcher: 检测到分析数据更新，正在重绘...");
    // 确保 Leaflet 已加载
    if (typeof window.L === 'undefined') {
      console.warn('Leaflet 未加载，等待初始化...');
      return;
    }
    addAnalysisData(window.L, newData);
    // 确保图层控制仍然存在
    if (!document.querySelector('.leaflet-control-layers')) {
      console.log('重新添加图层控制...');
      // 可以在这里重新添加图层控制，或者重新初始化地图
    }
  }
}, { deep: true });

/**
 * 绘制经纬度网格
 */
function drawGrid(L) {
  if (!map || !gridLayer) return;
  // 清除现有网格
  gridLayer.clearLayers();
  const { latStep, lngStep, style } = gridOptions;
  // 绘制经线（垂直线）
  for (let lng = -180; lng <= 180; lng += lngStep) {
    const points = [];
    for (let lat = -85; lat <= 85; lat += 5) { // 避免极地变形
      points.push([lat, lng]);
    }
    const polyline = L.polyline(points, {
      ...style,
      className: 'grid-line meridian'
    }).addTo(gridLayer);
  }
  // 绘制纬线（水平线）
  for (let lat = -60; lat <= 80; lat += latStep) {
    const points = [];
    for (let lng = -180; lng <= 180; lng += 5) {
      points.push([lat, lng]);
    }
    const polyline = L.polyline(points, {
      ...style,
      className: 'grid-line parallel'
    }).addTo(gridLayer);
  }
}

// 绘制经纬度标识
function drawLabels(L) {
  if (!map || !labelLayer) return;
  // 清除现有标识
  labelLayer.clearLayers();
  const { latStep, lngStep } = gridOptions;
  // 绘制经度标识
  for (let lng = -180; lng <= 180; lng += lngStep) {
    if (lng !== 0) {
      const label = L.marker([0, lng], {
        icon: L.divIcon({
          className: 'grid-label',
          html: `<div class="simple-label">${Math.abs(lng)}°${lng > 0 ? 'E' : 'W'}</div>`,
          iconSize: [25, 12],
          iconAnchor: [12, 6]
        })
      }).addTo(labelLayer);
    }
  }
  // 绘制纬度标识
  for (let lat = -60; lat <= 80; lat += latStep) {
    const label = L.marker([lat, 0], {
      icon: L.divIcon({
        className: 'grid-label',
        html: `<div class="simple-label">${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}</div>`,
        iconSize: [25, 12],
        iconAnchor: [12, 6]
      })
    }).addTo(labelLayer);
  }
  // 根据显示状态添加到地图
  if (showLabels.value) {
    map.addLayer(labelLayer);
  }
  // 添加网格到地图
  if (showGrid.value) {
    map.addLayer(gridLayer);
  }
}

/**
 * 更新网格
 */
function updateGrid() {
  const L = window.L;
  if (L && gridLayer && labelLayer) {
    drawGrid(L);
    drawLabels(L); // 同时更新标识
  }
}

/**
 * 恢复地图状态和图层控制
 */
function restoreMapState() {
  if (!map || !window.L) return;
  const L = window.L;
  // 重新添加图层控制（如果丢失）
  if (!document.querySelector('.leaflet-control-layers')) {
    L.control.layers(
        {},
        {
          '分析数据': analysisMarkersLayer,
          '经纬网格': gridLayer,
          '经纬标识': labelLayer,
          '国家边界': geoJsonLayer
        },
        {
          position: 'topright',
          collapsed: true
        }
    ).addTo(map);
    console.log('图层控制已恢复');
  }
  // 恢复图层显示状态
  if (showGrid.value && gridLayer && !map.hasLayer(gridLayer)) {
    map.addLayer(gridLayer);
  }
  if (showLabels.value && labelLayer && !map.hasLayer(labelLayer)) {
    map.addLayer(labelLayer);
  }
  if (showGeoJSON.value && geoJsonLayer && !map.hasLayer(geoJsonLayer)) {
    map.addLayer(geoJsonLayer);
  }
}

/**
 * 加载和显示GeoJSON边界数据
 */
async function loadGeoJSON(L) {
  if (!map || !geoJsonLayer) return;

  try {
    // 清除现有GeoJSON数据
    geoJsonLayer.clearLayers();

    // 加载GeoJSON文件 - 请确保这个文件存在且路径正确
    const response = await fetch('/world_land.json');
    if (!response.ok) {
      throw new Error(`加载GeoJSON失败: ${response.statusText}`);
    }

    const geoJsonData = await response.json();

    // 添加GeoJSON到地图
    const geoJsonLayerInstance = L.geoJSON(geoJsonData, {
      style: {
        color: '#4a90e2',        // 边界线颜色
        weight: 1.5,             // 边界线粗细
        opacity: 0.8,            // 边界线透明度
        fillColor: 'transparent', // 填充颜色（透明）
        fillOpacity: 0.1         // 填充透明度
      },
      onEachFeature: function (feature, layer) {
        // 为每个要素添加鼠标事件
        if (feature.properties && feature.properties.name) {
          layer.bindPopup(`
            <div class="geo-popup">
              <h4>${feature.properties.name}</h4>
              ${feature.properties.region ? `<p><strong>地区:</strong> ${feature.properties.region}</p>` : ''}
              ${feature.properties.iso_a3 ? `<p><strong>代码:</strong> ${feature.properties.iso_a3}</p>` : ''}
            </div>
          `);
        }

        // 鼠标悬停效果
        layer.on('mouseover', function () {
          layer.setStyle({
            weight: 3,
            color: '#ff6b6b',
            opacity: 1
          });
        });

        layer.on('mouseout', function () {
          layer.setStyle({
            weight: 1.5,
            color: '#4a90e2',
            opacity: 0.8
          });
        });
      }
    }).addTo(geoJsonLayer);

    // 添加到地图
    if (showGeoJSON.value) {
      map.addLayer(geoJsonLayer);
    }

    console.log('GeoJSON边界数据加载成功');

  } catch (error) {
    console.error('加载GeoJSON边界数据失败:', error);
  }
}

/**
 * 切换网格显示/隐藏
 */
function toggleGrid() {
  if (!map || !gridLayer) return;

  showGrid.value = !showGrid.value;

  if (showGrid.value) {
    map.addLayer(gridLayer);
  } else {
    map.removeLayer(gridLayer);
  }
}

/**
 * 切换GeoJSON边界显示/隐藏
 */
function toggleGeoJSON() {
  if (!map || !geoJsonLayer) return;

  showGeoJSON.value = !showGeoJSON.value;

  if (showGeoJSON.value) {
    map.addLayer(geoJsonLayer);
  } else {
    map.removeLayer(geoJsonLayer);
  }
}

/**
 * 切换经纬标识显示/隐藏
 */
function toggleLabels() {
  if (!map || !labelLayer) return;
  showLabels.value = !showLabels.value;
  if (showLabels.value) {
    // 如果图层为空，先绘制标识
    if (labelLayer.getLayers().length === 0) {
      const L = window.L;
      if (L) drawLabels(L);
    }
    map.addLayer(labelLayer);
  } else {
    map.removeLayer(labelLayer);
  }
}

/**
 * 添加示例数据点
 */
async function addSampleData(L) {
  if (!testMarkersLayer) return;

  // 清除现有标记
  testMarkersLayer.clearLayers();

  const sampleData = [
    { name: '北京', lat: 39.92, lng: 116.46, resultType: 'TypeA', value: 95 },
    { name: '纽约', lat: 40.71, lng: -74.00, resultType: 'TypeB', value: 87 },
    { name: '伦敦', lat: 51.51, lng: -0.13, resultType: 'TypeC', value: 92 },
    { name: '东京', lat: 35.68, lng: 139.69, resultType: 'TypeA', value: 88 },
    { name: '悉尼', lat: -33.86, lng: 151.20, resultType: 'TypeB', value: 78 },
    { name: '里约', lat: -22.90, lng: -43.17, resultType: 'TypeC', value: 82 }
  ];

  sampleData.forEach(point => {
    addDataPoint(L, point, testMarkersLayer);
  });

  // 自动调整视图以显示所有标记
  try {
    const allMarkers = L.featureGroup([
      ...analysisMarkersLayer.getLayers(),
      ...testMarkersLayer.getLayers()
    ].filter(layer => layer.getLatLng)); // 过滤有效标记

    if (allMarkers.getLayers().length > 0) {
      const bounds = allMarkers.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
    }
  } catch (error) {
    console.warn('调整地图视图时出错:', error);
  }
}

/**
 * 添加从分析结果传入的数据点
 */
function addAnalysisData(L, data) {
  if (!map || !analysisMarkersLayer) return;
  // 重绘分析图层
  analysisMarkersLayer.clearLayers();
  data.forEach(point => {
    // 传入 analysisMarkersLayer
    addDataPoint(L, point, analysisMarkersLayer);
  });

  // 确保网格和标识图层保持显示状态
  if (showGrid.value && gridLayer && !map.hasLayer(gridLayer)) {
    map.addLayer(gridLayer);
  }
  if (showLabels.value && labelLayer && !map.hasLayer(labelLayer)) {
    map.addLayer(labelLayer);
  }
  if (showGeoJSON.value && geoJsonLayer && !map.hasLayer(geoJsonLayer)) {
    map.addLayer(geoJsonLayer);
  }

  // 安全地调整视图边界
  try {
    const allLayers = [];
    // 只收集有效的标记图层
    if (analysisMarkersLayer.getLayers().length > 0) {
      allLayers.push(analysisMarkersLayer);
    }
    if (testMarkersLayer.getLayers().length > 0) {
      allLayers.push(testMarkersLayer);
    }
    if (allLayers.length > 0) {
      const featureGroup = L.featureGroup(allLayers);
      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1));
      }
    } else {
      // 如果没有标记，设置默认视图
      map.setView([30, 0], 2);
    }
  } catch (error) {
    console.warn('调整地图视图时出错:', error);
    map.setView([30, 0], 2);
  }
  //restoreMapState();
}

/**
 * 添加单个数据点
 * @param {L} L - Leaflet 实例
 * @param {object} pointData - 数据点 (现在包含 taskId)
 * @param {L.LayerGroup} layer - 要添加到的图层
 */
// TODO: 在这里修改不同XJY类型的颜色
function addDataPoint(L, pointData, layer) {
  if (!map || !layer) return;

  // 根据类型设置颜色
  const colorMap = {
    'TypeA': '#ff5722',
    'TypeB': '#2196f3',
    'TypeC': '#4caf50'
  };

  const typeColorMap = {
    0: '#ff5722', // Type 0 颜色
    1: '#2196f3', // Type 1 颜色
    2: '#4caf50', // Type 2 颜色
    3: '#fbc02d', // Type 3 颜色
    4: '#9c27b0', // Type 4 颜色
  };

  let color;
  let typeLabel;

  if (typeof pointData.resultType === 'number') {
    color = typeColorMap[pointData.resultType] || '#E91E63'; // 使用数字类型映射，提供一个默认粉色
    typeLabel = `类型 ${pointData.resultType}`;
  } else {
    color = colorMap[pointData.resultType] || '#ff5722'; //  fallback 到旧的字符串映射
    typeLabel = pointData.resultType;
  }

  // 创建自定义图标
  const customIcon = L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  // 创建标记
  const marker = L.marker([pointData.lat, pointData.lng], {
    icon: customIcon,
    title: pointData.name
  });

  // 添加弹出窗口
  marker.bindPopup(`
    <div class="marker-popup">
      <h4>${pointData.name}</h4>
      <p><strong>任务ID:</strong> ${pointData.taskId}</p> <p><strong>类型:</strong> ${typeLabel}</p>
      <p><strong>数值:</strong> ${pointData.value || 'N/A'}</p>
      <p><strong>坐标:</strong> ${pointData.lat.toFixed(4)}°, ${pointData.lng.toFixed(4)}°</p>
      <small>点击外部关闭</small>
    </div>
  `);

  // 添加鼠标悬停效果
  marker.on('mouseover', function() {
    this.openPopup();
  });

  marker.on('mouseout', function() {
    this.closePopup();
  });

  layer.addLayer(marker);
  return marker;
}

/**
 * 清除所有标记
 */
function clearAllMarkers() {
  if (testMarkersLayer) {
    testMarkersLayer.clearLayers();
  }
  if(analysisMarkersLayer) {
    analysisMarkersLayer.clearLayers();
  }
}

/**
 * 添加测试数据按钮处理
 */
async function addTestData() {
  const L = await import('leaflet');
  if (testMarkersLayer.getLayers().length > 0) {
    testMarkersLayer.clearLayers();
    // 从地图移除图层
    if (map.hasLayer(testMarkersLayer)) {
      map.removeLayer(testMarkersLayer);
    }
  } else {
    await addSampleData(L);
    // 确保测试数据图层添加到地图
    if (!map.hasLayer(testMarkersLayer)) {
      map.addLayer(testMarkersLayer);
    }
  }
}

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});
</script>

<style scoped>
.map-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  padding: 12px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 400px;
}

.grid-controls {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #606266;
}

.grid-controls span {
  white-space: nowrap;
}

:deep(.el-dialog) {
  max-width: 95vw;
}

:deep(.el-dialog__body) {
  padding: 0 !important;
  position: relative;
  height: 75vh;
  min-height: 500px;
}

/* 网格标签样式 */
:deep(.simple-label) {
  background: transparent !important;
  padding: 0 !important;
  border: none !important;
  font-size: 10px !important;
  font-weight: 500 !important;
  color: #666 !important;
  text-shadow: 1px 1px 1px rgba(255,255,255,0.8);
}

/* 网格线样式 */
:deep(.grid-line) {
  pointer-events: none;
}

:deep(.grid-label) {
  pointer-events: none;
}

/* 标记弹出窗口样式 */
:deep(.leaflet-popup-content-wrapper) {
  border-radius: 6px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.15);
}

:deep(.leaflet-popup-content) {
  margin: 12px 16px;
  line-height: 1.5;
  font-family: 'Helvetica Neue', Arial, sans-serif;
  min-width: 180px;
}

.marker-popup h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.marker-popup p {
  margin: 4px 0;
  color: #606266;
  font-size: 12px;
}

.marker-popup small {
  color: #909399;
  font-size: 10px;
}

/* GeoJSON弹出窗口样式 */
.geo-popup h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 14px;
}

.geo-popup p {
  margin: 2px 0;
  color: #606266;
  font-size: 12px;
}

/* 隐藏Leaflet版权信息 */
:deep(.leaflet-control-attribution) {
  display: none !important;
}

/* 图层控制样式 */
:deep(.leaflet-control-layers) {
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1) !important;
  font-size: 12px !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-controls {
    left: 5px;
    right: 5px;
    max-width: none;
  }

  .grid-controls {
    flex-wrap: wrap;
    gap: 4px;
  }
}
</style>