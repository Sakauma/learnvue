/* WorldMapDialog.vue */
<template>
  <el-dialog
      :model-value="visible"
      title="全球分析结果"
      width="75%"
      @update:model-value="$emit('update:visible', $event)"
      :close-on-click-modal="false"
      @opened="initMap"
  >
    <div class="map-controls">

      <div class="control-group">
        <span class="control-label">模式:</span>
        <el-button-group>
          <el-button
              size="small"
              :type="displayMode === 'single' ? 'primary' : ''"
              @click="switchMode('single')"
          >
            单次结果
          </el-button>
          <el-button
              size="small"
              :type="displayMode === 'cumulative' ? 'primary' : ''"
              @click="switchMode('cumulative')"
          >
            累积结果
          </el-button>
        </el-button-group>
      </div>

      <div class="divider"></div>

      <div class="control-group">
        <span class="control-label">筛选:</span>

        <el-select
            v-model="filterType"
            placeholder="类型"
            size="small"
            style="width: 120px;"
            @change="handleFilterChange"
        >
          <el-option label="全部类型" value="all"></el-option>
          <el-option
              v-for="(name, key) in typeNameMap"
              :key="key"
              :label="name"
              :value="key"
          ></el-option>
        </el-select>
      </div>

      <div class="control-group" style="margin-top: 8px;">
        <el-date-picker
            v-model="filterDateRange"
            type="datetimerange"
            range-separator="-"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            size="small"
            style="width: 100%;"
            :shortcuts="dateShortcuts"
            @change="handleFilterChange"
            :default-time="defaultTime"
        />
      </div>

      <div class="divider"></div>

      <div class="control-group">
        <el-button-group>
          <el-button @click="toggleGrid" size="small" :type="showGrid ? 'primary' : ''">网格</el-button>
          <el-button @click="toggleLabels" size="small" :type="showLabels ? 'primary' : ''">标识</el-button>
          <el-button @click="toggleGeoJSON" size="small" :type="showGeoJSON ? 'primary' : ''">边界</el-button>
          <el-button @click="clearAllMarkers" size="small" type="danger">清除</el-button>
        </el-button-group>
      </div>

      <div class="control-group">
        <span class="control-label" style="font-size: 11px; margin-left: 5px;">精度:</span>
        <el-select v-model="gridOptions.step" size="small" style="width: 70px;" @change="handleGridSizeChange">
          <el-option label="1°" :value="1"></el-option>
          <el-option label="3°" :value="3"></el-option>
          <el-option label="5°" :value="5"></el-option>
        </el-select>
      </div>
    </div>

    <div ref="mapContainerRef" style="width: 100%; height: 65vh;"></div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="$emit('update:visible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, watch, onUnmounted, computed } from 'vue';
import { ElDialog, ElButton, ElButtonGroup, ElSelect, ElOption, ElDatePicker } from 'element-plus';
import { FEATURE_DEFINITIONS } from '../../config/featureConfig.js';

const props = defineProps({
  visible: Boolean,
  markerData: { type: Array, default: () => [] },
  latestTaskId: { type: [String, Number], default: null }
});

const emit = defineEmits(['update:visible']);

const mapContainerRef = ref(null);
let map = null;

// 图层引用
let analysisMarkersLayer = null;
let heatMapLayer = null;
let gridLayer = null;
let labelLayer = null;
let geoJsonLayer = null;
let testMarkersLayer = null; // 保留引用以兼容旧逻辑

// 状态
const displayMode = ref('single');
const showGrid = ref(true);
const showGeoJSON = ref(true);
const showLabels = ref(true);

// 筛选状态
const filterType = ref('all');
const filterDateRange = ref(null);

// 日期选择器配置
const dateShortcuts = [
  { text: '最近1小时', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 3600 * 1000); return [start, end]; } },
  { text: '最近24小时', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 3600 * 1000 * 24); return [start, end]; } },
  { text: '最近7天', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 3600 * 1000 * 24 * 7); return [start, end]; } },
  { text: '最近30天', value: () => { const end = new Date(); const start = new Date(); start.setTime(start.getTime() - 3600 * 1000 * 24 * 30); return [start, end]; } },
];
const defaultTime = [new Date(2000, 1, 1, 0, 0, 0), new Date(2000, 1, 1, 23, 59, 59)];

const gridOptions = reactive({
  step: 1,
  style: { color: 'rgba(100, 150, 255, 0.6)',
    weight: 1,
    opacity: 0.6,
    dashArray: '5,5' }
});

const typeNameMap = {
  0: '低可信事件', 1: '火山爆发', 2: '火灾', 3: '恒星', 4: '卷云',
  5: '冰雪盖',
};

/**
 * 过滤数据：根据 模式 + 类型 + 时间 筛选
 */
const filteredData = computed(() => {
  if (!props.markerData || props.markerData.length === 0) return [];

  let data = props.markerData;

  // 1. 模式筛选
  if (displayMode.value === 'single') {
    if (props.latestTaskId) {
      data = data.filter(m => m.taskId === props.latestTaskId);
    }
  }

  // 2. 类型筛选
  if (filterType.value !== 'all') {
    data = data.filter(m => String(m.resultType) === String(filterType.value));
  }

  // 3. 时间筛选
  if (filterDateRange.value && filterDateRange.value.length === 2) {
    const startTime = filterDateRange.value[0].getTime();
    const endTime = filterDateRange.value[1].getTime();
    data = data.filter(m => m.timestamp && m.timestamp >= startTime && m.timestamp <= endTime);
  }

  return data;
});

function switchMode(mode) {
  displayMode.value = mode;
  refreshMapDisplay();
}

function handleFilterChange() {
  refreshMapDisplay();
}

function handleGridSizeChange() {
  if (window.L) {
    updateGrid();
    if (displayMode.value === 'cumulative') {
      drawHeatMap(window.L, filteredData.value);
    }
  }
}

/**
 * 刷新地图显示
 */
function refreshMapDisplay() {
  if (!map || !window.L) return;
  const L = window.L;

  // 1. 清理业务图层
  if (analysisMarkersLayer) analysisMarkersLayer.clearLayers();
  if (heatMapLayer) heatMapLayer.clearLayers();

  const currentData = filteredData.value;

  // 2. 渲染
  if (displayMode.value === 'single') {
    addAnalysisData(L, currentData);
    if (!map.hasLayer(analysisMarkersLayer)) map.addLayer(analysisMarkersLayer);
    if (map.hasLayer(heatMapLayer)) map.removeLayer(heatMapLayer);

  } else if (displayMode.value === 'cumulative') {
    drawHeatMap(L, currentData);
    if (!map.hasLayer(heatMapLayer)) map.addLayer(heatMapLayer);
    if (map.hasLayer(analysisMarkersLayer)) map.removeLayer(analysisMarkersLayer);
  }

  fitBoundsToContent(L);
}

/**
 * 自动缩放逻辑
 */
function fitBoundsToContent(L) {
  try {
    const layersToCheck = [];
    if (displayMode.value === 'single' && analysisMarkersLayer.getLayers().length > 0) {
      layersToCheck.push(analysisMarkersLayer);
    }
    // 累积模式如果有数据，可以根据过滤后的数据点计算边界，避免缩放到全球
    if (displayMode.value === 'cumulative' && filteredData.value.length > 0) {
      // 这里不直接 push heatMapLayer 因为它包含全球背景
      // 我们可以临时创建一个 FeatureGroup 来计算边界
      const tempGroup = L.featureGroup();
      filteredData.value.forEach(p => L.marker([p.lat, p.lng]).addTo(tempGroup));
      layersToCheck.push(tempGroup);
    }

    if (layersToCheck.length > 0) {
      const featureGroup = L.featureGroup(layersToCheck);
      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
    }
  } catch (e) { console.warn(e) }
}

/**
 * 绘制热力图 (蓝->红 渐变 + 蓝色底色 + 时间范围)
 */
function drawHeatMap(L, allData) {
  if (!heatMapLayer) return;
  heatMapLayer.clearLayers();

  // 全球透明蓝色背景层
  const globalBounds = [[-90, -180], [90, 180]];
  L.rectangle(globalBounds, {
    color: 'transparent',
    fillColor: '#0000FF',
    fillOpacity: 0.05,
    weight: 0,
    interactive: false
  }).addTo(heatMapLayer);

  if (!allData || allData.length === 0) return;

  const step = gridOptions.step;
  const gridStats = {};
  let maxCount = 0;

  // 统计
  allData.forEach(point => {
    const latIdx = Math.floor(point.lat / step);
    const lngIdx = Math.floor(point.lng / step);
    const key = `${latIdx}_${lngIdx}`;

    if (!gridStats[key]) {
      gridStats[key] = {
        total: 0,
        types: {},
        features: {},
        // [新增] 时间范围统计
        timeRange: { min: null, max: null }
      };
    }

    const cell = gridStats[key];
    cell.total++;
    if (cell.total > maxCount) maxCount = cell.total;

    // 类型统计
    const type = point.resultType;
    if (type !== undefined) {
      if (!cell.types[type]) cell.types[type] = 0;
      cell.types[type]++;
    }

    // 特征统计
    if (point.features) {
      for (const [fKey, fVal] of Object.entries(point.features)) {
        if (typeof fVal === 'number') {
          if (!cell.features[fKey]) cell.features[fKey] = { sum: 0, count: 0 };
          cell.features[fKey].sum += fVal;
          cell.features[fKey].count++;
        }
      }
    }

    // [新增] 时间范围统计
    if (point.timestamp) {
      if (cell.timeRange.min === null || point.timestamp < cell.timeRange.min) {
        cell.timeRange.min = point.timestamp;
      }
      if (cell.timeRange.max === null || point.timestamp > cell.timeRange.max) {
        cell.timeRange.max = point.timestamp;
      }
    }
  });

  // 绘制
  for (const key in gridStats) {
    const stats = gridStats[key];
    const [latIdx, lngIdx] = key.split('_').map(Number);
    const latStart = latIdx * step;
    const lngStart = lngIdx * step;
    const bounds = [[latStart, lngStart], [(latIdx + 1) * step, (lngIdx + 1) * step]];

    // 蓝 -> 红 插值
    const ratio = maxCount > 1 ? (stats.total / maxCount) : 1.0;
    const r = Math.floor(255 * ratio);
    const b = Math.floor(255 * (1 - ratio));
    const color = `rgb(${r}, 0, ${b})`;
    const opacity = 0.3 + (ratio * 0.4);

    // 构建 Popup HTML
    let typeHtml = '<ul style="padding-left:15px; margin:2px 0; font-size:11px;">';
    for (const [type, count] of Object.entries(stats.types)) {
      typeHtml += `<li>${typeNameMap[type] || type}: ${count}</li>`;
    }
    typeHtml += '</ul>';

    let featuresHtml = '<ul style="padding-left:15px; margin:2px 0; font-size:11px;">';
    let hasFeatures = false;
    FEATURE_DEFINITIONS.forEach(def => {
      const fStats = stats.features[def.key];
      if (fStats && fStats.count > 0) {
        hasFeatures = true;
        const avg = (fStats.sum / fStats.count).toFixed(3);
        featuresHtml += `<li>${def.label}: ${avg}</li>`;
      }
    });
    featuresHtml += '</ul>';
    if (!hasFeatures) featuresHtml = '<span style="font-size:11px; color:#999;">暂无特征数据</span>';

    // 时间范围 HTML
    let timeHtml = '';
    if (stats.timeRange.min !== null && stats.timeRange.max !== null) {
      const format = (ts) => {
        const d = new Date(ts);
        return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
      };
      timeHtml = `
        <div style="margin-top:6px; border-top:1px solid #eee; padding-top:4px;">
            <strong>时间范围:</strong>
            <div style="font-size:11px; color:#555; margin-top:2px;">
                ${format(stats.timeRange.min)} <br/>至<br/> ${format(stats.timeRange.max)}
            </div>
        </div>`;
    }

    const rect = L.rectangle(bounds, {
      color: 'transparent',
      fillColor: color,
      fillOpacity: opacity,
      weight: 0
    }).bindPopup(`
      <div class="heat-popup" style="font-size:12px; line-height:1.4;">
        <div style="border-bottom:1px solid #eee; margin-bottom:5px; padding-bottom:2px;">
            <strong>统计区域:</strong> [${latStart}°, ${lngStart}°]
        </div>
        <div style="display:flex; justify-content:space-between;">
            <span><strong>轨迹点数:</strong> ${stats.total}</span>
            <span><strong>热度:</strong> ${(ratio * 100).toFixed(0)}%</span>
        </div>
        <div style="margin-top:6px;"><strong>类型分布:</strong>${typeHtml}</div>
        <div style="margin-top:6px; border-top:1px solid #eee; padding-top:4px;">
            <strong>特征统计 (均值):</strong>${featuresHtml}
        </div>
        ${timeHtml}
      </div>
    `, { maxWidth: 260 });

    rect.on('mouseover', function() { this.setStyle({ weight: 1, color: '#fff', fillOpacity: 0.9 }); });
    rect.on('mouseout', function() { this.setStyle({ weight: 0, color: 'transparent', fillOpacity: opacity }); });

    rect.addTo(heatMapLayer);
  }
}

async function initMap() {
  if (!mapContainerRef.value) return;
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');
  if (map) map.remove();

  map = L.map(mapContainerRef.value);
  setTimeout(() => { map.setView([30, 0], 2); map.invalidateSize(); }, 100);

  L.tileLayer('/tiles/{z}/{x}/{y}.webp', {
    minZoom: 0, maxZoom: 5, tileSize: 256, noWrap: true, attribution: '',
  }).addTo(map);
  map.removeControl(map.zoomControl);

  analysisMarkersLayer = L.layerGroup();
  heatMapLayer = L.layerGroup();
  gridLayer = L.layerGroup();
  labelLayer = L.layerGroup();
  geoJsonLayer = L.layerGroup();
  testMarkersLayer = L.layerGroup();

  refreshMapDisplay();

  if (showGrid.value) { drawGrid(L); map.addLayer(gridLayer); }
  if (showLabels.value) { drawLabels(L); map.addLayer(labelLayer); }
  if (showGeoJSON.value) { await loadGeoJSON(L); }

  setTimeout(() => {
    L.control.layers({}, {
          '单次轨迹点': analysisMarkersLayer,
          '累积热力图': heatMapLayer,
          '经纬网格': gridLayer,
          '经纬标识': labelLayer,
          '国家边界': geoJsonLayer
        }, { position: 'topright', collapsed: true }
    ).addTo(map);
  }, 100);
}

// 监听
watch(() => props.markerData, () => refreshMapDisplay(), { deep: true });
watch(() => props.latestTaskId, () => {
  if (displayMode.value === 'single') refreshMapDisplay();
});

// --- 辅助函数 ---
function drawGrid(L) {
  if (!map || !gridLayer) return;
  gridLayer.clearLayers();
  const { step } = gridOptions; const style = gridOptions.style;
  for (let lng = -180; lng <= 180; lng += step) {
    const points = []; for (let lat = -85; lat <= 85; lat += 5) points.push([lat, lng]);
    L.polyline(points, { ...style, className: 'grid-line meridian' }).addTo(gridLayer);
  }
  for (let lat = -80; lat <= 80; lat += step) {
    const points = []; for (let lng = -180; lng <= 180; lng += 5) points.push([lat, lng]);
    L.polyline(points, { ...style, className: 'grid-line parallel' }).addTo(gridLayer);
  }
}
function drawLabels(L) {
  if (!map || !labelLayer) return;
  labelLayer.clearLayers();
  const labelStep = Math.max(15, gridOptions.step);
  for (let lng = -180; lng <= 180; lng += labelStep) {
    if (lng !== 0) L.marker([0, lng], { icon: L.divIcon({ className: 'grid-label', html: `<div class="simple-label">${Math.abs(lng)}°${lng > 0 ? 'E' : 'W'}</div>`, iconSize: [25, 12], iconAnchor: [12, 6] }) }).addTo(labelLayer);
  }
  for (let lat = -60; lat <= 80; lat += labelStep) {
    L.marker([lat, 0], { icon: L.divIcon({ className: 'grid-label', html: `<div class="simple-label">${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}</div>`, iconSize: [25, 12], iconAnchor: [12, 6] }) }).addTo(labelLayer);
  }
}
function updateGrid() { if (window.L && gridLayer) drawGrid(window.L); }
function toggleGrid() { showGrid.value = !showGrid.value; if(map && gridLayer) showGrid.value ? map.addLayer(gridLayer) : map.removeLayer(gridLayer); }
function toggleLabels() { showLabels.value = !showLabels.value; if(map && labelLayer) showLabels.value ? map.addLayer(labelLayer) : map.removeLayer(labelLayer); }
function toggleGeoJSON() { if (!map || !geoJsonLayer) return; showGeoJSON.value = !showGeoJSON.value; if (showGeoJSON.value) map.addLayer(geoJsonLayer); else map.removeLayer(geoJsonLayer); }
function clearAllMarkers() { if (analysisMarkersLayer) analysisMarkersLayer.clearLayers(); if (heatMapLayer) heatMapLayer.clearLayers(); }

function addDataPoint(L, pointData, layer) {
  if (!map || !layer) return;
  const colorMap = { 'TypeA': '#ff5722', 'TypeB': '#2196f3', 'TypeC': '#4caf50' };
  const typeColorMap = { 0: '#ff5722', 1: '#2196f3', 2: '#4caf50', 3: '#fbc02d', 4: '#9c27b0' };
  let color = (typeof pointData.resultType === 'number') ? (typeColorMap[pointData.resultType] || '#E91E63') : (colorMap[pointData.resultType] || '#ff5722');
  const customIcon = L.divIcon({ className: 'custom-marker', html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`, iconSize: [16, 16], iconAnchor: [8, 8] });
  const marker = L.marker([pointData.lat, pointData.lng], { icon: customIcon, title: pointData.name });

  let featuresHtml = '';
  if (pointData.features) {
    featuresHtml = '<div style="margin-top:5px; border-top:1px solid #eee; font-size:10px;">';
    FEATURE_DEFINITIONS.forEach(def => { if(pointData.features[def.key] !== undefined) featuresHtml += `<div>${def.label}: ${Number(pointData.features[def.key]).toFixed(3)}</div>`; });
    featuresHtml += '</div>';
  }

  let timeHtml = '';
  if (pointData.timestamp) {
    const d = new Date(pointData.timestamp);
    const tStr = `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
    timeHtml = `<p style="margin:2px 0; color:#666;">Time: ${tStr}</p>`;
  }

  marker.bindPopup(`<div class="marker-popup"><h4 style="margin:0 0 5px 0;">${pointData.name}</h4><p style="margin:2px 0;">TaskId: ${pointData.taskId}</p><p style="margin:2px 0;">Type: ${typeNameMap[pointData.resultType] || pointData.resultType}</p>${timeHtml}${featuresHtml}</div>`);
  marker.on('mouseover', function() { this.openPopup(); });
  marker.on('mouseout', function() { this.closePopup(); });
  layer.addLayer(marker);
}
function addAnalysisData(L, data) { if (!map || !analysisMarkersLayer) return; data.forEach(point => { addDataPoint(L, point, analysisMarkersLayer); }); }
async function loadGeoJSON(L) {
  if (!map || !geoJsonLayer) return;
  try {
    geoJsonLayer.clearLayers();
    const response = await fetch('/world_land.json');
    if (!response.ok) throw new Error(`加载GeoJSON失败`);
    const geoJsonData = await response.json();
    L.geoJSON(geoJsonData, {
      style: { color: '#4a90e2', weight: 1.5, opacity: 0.8, fillColor: 'transparent', fillOpacity: 0.1 },
      onEachFeature: function (feature, layer) {
        if (feature.properties && feature.properties.name) { layer.bindPopup(`<div class="geo-popup"><h4>${feature.properties.name}</h4></div>`); }
        layer.on('mouseover', function () { layer.setStyle({ weight: 3, color: '#ff6b6b', opacity: 1 }); });
        layer.on('mouseout', function () { layer.setStyle({ weight: 1.5, color: '#4a90e2', opacity: 0.8 }); });
      }
    }).addTo(geoJsonLayer);
    if (showGeoJSON.value) map.addLayer(geoJsonLayer);
  } catch (error) { console.error(error); }
}
onUnmounted(() => { if (map) { map.remove(); map = null; } });
</script>

<style scoped>
.map-controls {
  position: absolute; top: 10px; left: 10px; z-index: 1000;
  background: rgba(255, 255, 255, 0.95); padding: 12px;
  border-radius: 6px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex; flex-direction: column; gap: 8px; max-width: 500px; /* 稍微加宽 */
}
.control-group {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.control-label {
  font-size: 12px; font-weight: bold; color: #333; white-space: nowrap;
}
.divider {
  height: 1px; background-color: #eee; margin: 4px 0; width: 100%;
}

/* 隐藏Leaflet版权信息 */
:deep(.leaflet-control-attribution) {
  display: none !important;
}

:deep(.leaflet-popup-content) { margin: 10px 12px; }
:deep(.simple-label) { background: transparent; border: none; font-size: 10px; font-weight: bold; color: #666; text-shadow: 1px 1px 1px rgba(255,255,255,0.8); }
:deep(.grid-line), :deep(.grid-label) { pointer-events: none; }
.marker-popup h4, .geo-popup h4 { margin: 0 0 8px 0; color: #333; font-size: 14px; border-bottom: 1px solid #eee; }
.marker-popup p, .geo-popup p { margin: 4px 0; color: #666; font-size: 12px; }
</style>
