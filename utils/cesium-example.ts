/**
 * Cesium工具类使用示例
 * 展示如何快速创建各种Cesium应用
 */

import { cesiumManager } from './cesium';

/**
 * 基础地球查看器示例
 */
export async function createBasicEarthViewer(container: HTMLElement) {
  try {
    // 初始化Cesium
    await cesiumManager.initialize();

    // 创建查看器
    cesiumManager.createViewer({
      container,
      homeButton: true,
      sceneModePicker: true,
      baseLayerPicker: true,
      navigationHelpButton: true,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      geocoder: true,
      infoBox: true,
      selectionIndicator: true
    });

    // 设置默认视角
    cesiumManager.setCameraView({
      longitude: 116.4074, // 北京经度
      latitude: 39.9042,   // 北京纬度
      height: 1000000      // 高度
    });

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('创建基础地球查看器失败:', error);
    throw error;
  }
}

/**
 * 带标记的地图示例
 */
export async function createMapWithMarkers(container: HTMLElement) {
  try {
    await cesiumManager.initialize();
    cesiumManager.createViewer({ container });
    
    // 设置视角
    cesiumManager.setCameraView({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 500000
    });

    // 添加多个标记点
    const markers = [
      { name: '天安门', longitude: 116.3974, latitude: 39.9093 },
      { name: '故宫', longitude: 116.3972, latitude: 39.9163 },
      { name: '颐和园', longitude: 116.2755, latitude: 39.9999 },
      { name: '长城', longitude: 116.5704, latitude: 40.4319 }
    ];

    markers.forEach(marker => {
      cesiumManager.addPointMarker({
        longitude: marker.longitude,
        latitude: marker.latitude,
        height: 0
      }, {
        pixelSize: 12,
        color: (window as any).Cesium.Color.YELLOW
      });
    });

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('创建带标记的地图失败:', error);
    throw error;
  }
}

/**
 * 3D建筑模型示例
 */
export async function create3DBuildingViewer(container: HTMLElement) {
  try {
    await cesiumManager.initialize();
    cesiumManager.createViewer({ container });
    
    // 设置视角到城市
    cesiumManager.setCameraView({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 200000
    });

    // 添加3D建筑模型（示例URL）
    cesiumManager.add3DModel(
      'https://example.com/building.glb',
      {
        longitude: 116.4074,
        latitude: 39.9042,
        height: 0
      }
    );

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('创建3D建筑查看器失败:', error);
    throw error;
  }
}

/**
 * 路径规划示例
 */
export async function createRouteViewer(container: HTMLElement) {
  try {
    await cesiumManager.initialize();
    cesiumManager.createViewer({ container });
    
    // 设置视角
    cesiumManager.setCameraView({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 300000
    });

    // 定义路径点
    const routePoints = [
      { longitude: 116.3974, latitude: 39.9093, height: 0 }, // 起点
      { longitude: 116.3972, latitude: 39.9163, height: 0 }, // 中间点
      { longitude: 116.2755, latitude: 39.9999, height: 0 }  // 终点
    ];

    // 添加路径线
    cesiumManager.addPolyline(routePoints, {
      color: (window as any).Cesium.Color.BLUE,
      width: 5
    });

    // 添加起点和终点标记
    cesiumManager.addPointMarker(routePoints[0], {
      pixelSize: 15,
      color: (window as any).Cesium.Color.GREEN
    });

    cesiumManager.addPointMarker(routePoints[routePoints.length - 1], {
      pixelSize: 15,
      color: (window as any).Cesium.Color.RED
    });

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('创建路径规划查看器失败:', error);
    throw error;
  }
}

/**
 * 区域选择示例
 */
export async function createAreaSelectionViewer(container: HTMLElement) {
  try {
    await cesiumManager.initialize();
    cesiumManager.createViewer({ container });
    
    // 设置视角
    cesiumManager.setCameraView({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 200000
    });

    // 定义区域边界
    const areaBoundary = [
      { longitude: 116.3974, latitude: 39.9093, height: 0 },
      { longitude: 116.4174, latitude: 39.9093, height: 0 },
      { longitude: 116.4174, latitude: 39.9293, height: 0 },
      { longitude: 116.3974, latitude: 39.9293, height: 0 }
    ];

    // 添加区域多边形
    cesiumManager.addPolygon(areaBoundary, {
      color: (window as any).Cesium.Color.YELLOW.withAlpha(0.3),
      outlineColor: (window as any).Cesium.Color.YELLOW,
      outlineWidth: 3
    });

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('创建区域选择查看器失败:', error);
    throw error;
  }
}

/**
 * 清理Cesium资源
 */
export function cleanupCesium() {
  cesiumManager.destroy();
} 