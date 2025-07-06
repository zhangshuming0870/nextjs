/**
 * Cesium工具类
 * 用于快速创建和初始化Cesium应用
 */

export interface CesiumViewerOptions {
  container: HTMLElement;
  homeButton?: boolean;
  sceneModePicker?: boolean;
  baseLayerPicker?: boolean;
  navigationHelpButton?: boolean;
  animation?: boolean;
  timeline?: boolean;
  fullscreenButton?: boolean;
  geocoder?: boolean;
  infoBox?: boolean;
  selectionIndicator?: boolean;
  terrainProvider?: any;
  imageryProvider?: any;
}

export interface CameraViewOptions {
  longitude: number;
  latitude: number;
  height: number;
  heading?: number;
  pitch?: number;
  roll?: number;
}

export class CesiumManager {
  private viewer: any = null;
  private isInitialized: boolean = false;
  private cesiumVersion: string = '1.131';

  /**
   * 初始化Cesium
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 加载Cesium CSS
      await this.loadCSS(`https://cesium.com/downloads/cesiumjs/releases/${this.cesiumVersion}/Build/Cesium/Widgets/widgets.css`);
      
      // 加载Cesium JS
      await this.loadScript(`https://cesium.com/downloads/cesiumjs/releases/${this.cesiumVersion}/Build/Cesium/Cesium.js`);

      // 等待Cesium加载完成
      await this.waitForCesium();

      // 设置Cesium的静态资源路径
      (window as any).CESIUM_BASE_URL = `https://cesium.com/downloads/cesiumjs/releases/${this.cesiumVersion}/Build/Cesium/`;

      this.isInitialized = true;
    } catch (error) {
      console.error('Cesium初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建Cesium查看器
   */
  createViewer(options: CesiumViewerOptions): any {
    if (!this.isInitialized) {
      throw new Error('Cesium未初始化，请先调用initialize()方法');
    }

    const Cesium = (window as any).Cesium;

    const viewerOptions = {
      homeButton: true,
      sceneModePicker: true,
      baseLayerPicker: true,
      navigationHelpButton: true,
      animation: false,
      timeline: false,
      fullscreenButton: true,
      geocoder: true,
      infoBox: true,
      selectionIndicator: true,
      ...options
    };

    this.viewer = new Cesium.Viewer(options.container, viewerOptions);

    // 启用光照
    this.viewer.scene.globe.enableLighting = true;

    return this.viewer;
  }

  /**
   * 设置相机视角
   */
  setCameraView(options: CameraViewOptions): void {
    if (!this.viewer) {
      throw new Error('Cesium查看器未创建');
    }

    const Cesium = (window as any).Cesium;

    this.viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        options.longitude,
        options.latitude,
        options.height
      ),
      orientation: {
        heading: options.heading || 0.0,
        pitch: options.pitch || -Cesium.Math.PI_OVER_TWO,
        roll: options.roll || 0.0
      }
    });
  }

  /**
   * 添加3D模型
   */
  add3DModel(url: string, position: { longitude: number; latitude: number; height: number }): any {
    if (!this.viewer) {
      throw new Error('Cesium查看器未创建');
    }

    const Cesium = (window as any).Cesium;

    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height),
      model: {
        uri: url,
        minimumPixelSize: 128,
        maximumScale: 20000
      }
    });

    return entity;
  }

  /**
   * 添加点标记
   */
  addPointMarker(position: { longitude: number; latitude: number; height: number }, options?: {
    color?: any;
    pixelSize?: number;
    outlineColor?: any;
    outlineWidth?: number;
  }): any {
    if (!this.viewer) {
      throw new Error('Cesium查看器未创建');
    }

    const Cesium = (window as any).Cesium;

    const entity = this.viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(position.longitude, position.latitude, position.height),
      point: {
        pixelSize: options?.pixelSize || 10,
        color: options?.color || Cesium.Color.YELLOW,
        outlineColor: options?.outlineColor || Cesium.Color.BLACK,
        outlineWidth: options?.outlineWidth || 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
      }
    });

    return entity;
  }

  /**
   * 添加线条
   */
  addPolyline(positions: Array<{ longitude: number; latitude: number; height: number }>, options?: {
    color?: any;
    width?: number;
  }): any {
    if (!this.viewer) {
      throw new Error('Cesium查看器未创建');
    }

    const Cesium = (window as any).Cesium;

    const cartesianPositions = positions.map(pos => 
      Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height)
    );

    const entity = this.viewer.entities.add({
      polyline: {
        positions: cartesianPositions,
        width: options?.width || 2,
        material: options?.color || Cesium.Color.YELLOW
      }
    });

    return entity;
  }

  /**
   * 添加多边形
   */
  addPolygon(positions: Array<{ longitude: number; latitude: number; height: number }>, options?: {
    color?: any;
    outlineColor?: any;
    outlineWidth?: number;
  }): any {
    if (!this.viewer) {
      throw new Error('Cesium查看器未创建');
    }

    const Cesium = (window as any).Cesium;

    const cartesianPositions = positions.map(pos => 
      Cesium.Cartesian3.fromDegrees(pos.longitude, pos.latitude, pos.height)
    );

    const entity = this.viewer.entities.add({
      polygon: {
        hierarchy: cartesianPositions,
        material: options?.color || Cesium.Color.YELLOW.withAlpha(0.5),
        outline: true,
        outlineColor: options?.outlineColor || Cesium.Color.BLACK,
        outlineWidth: options?.outlineWidth || 2
      }
    });

    return entity;
  }

  /**
   * 获取查看器实例
   */
  getViewer(): any {
    return this.viewer;
  }

  /**
   * 销毁查看器
   */
  destroy(): void {
    if (this.viewer) {
      this.viewer.destroy();
      this.viewer = null;
    }
    this.isInitialized = false;
  }

  /**
   * 加载CSS文件
   */
  private loadCSS(href: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      const existingLink = document.querySelector(`link[href="${href}"]`);
      if (existingLink) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = () => resolve();
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }

  /**
   * 加载JavaScript文件
   */
  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 检查是否已经加载
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * 等待Cesium加载完成
   */
  private waitForCesium(): Promise<void> {
    return new Promise(resolve => {
      const checkCesium = () => {
        if ((window as any).Cesium) {
          resolve();
        } else {
          setTimeout(checkCesium, 100);
        }
      };
      checkCesium();
    });
  }
}

// 创建全局实例
export const cesiumManager = new CesiumManager(); 