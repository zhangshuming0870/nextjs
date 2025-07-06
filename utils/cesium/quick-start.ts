/**
 * Cesium快速开始示例
 * 最简单的使用方式
 */

import { cesiumManager } from './manager';

/**
 * 最简单的Cesium初始化
 */
export async function quickStart(container: HTMLElement) {
  try {
    // 1. 初始化Cesium
    await cesiumManager.initialize();

    // 2. 创建查看器
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

    // 3. 设置默认视角（中国）
    cesiumManager.setCameraView({
      longitude: 116.4074,
      latitude: 39.9042,
      height: 1000000
    });

    return cesiumManager.getViewer();
  } catch (error) {
    console.error('Cesium快速启动失败:', error);
    throw error;
  }
}

/**
 * 在React组件中使用的Hook
 */
export function useCesium(containerRef: React.RefObject<HTMLDivElement>) {
  const initCesium = async () => {
    if (!containerRef.current) return;

    try {
      await cesiumManager.initialize();
      
      cesiumManager.createViewer({
        container: containerRef.current
      });

      cesiumManager.setCameraView({
        longitude: 116.4074,
        latitude: 39.9042,
        height: 1000000
      });
    } catch (error) {
      console.error('Cesium初始化失败:', error);
    }
  };

  const cleanup = () => {
    cesiumManager.destroy();
  };

  return { initCesium, cleanup };
} 