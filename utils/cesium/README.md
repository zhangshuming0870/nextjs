# Cesium工具类使用指南

这个工具类提供了快速创建和初始化Cesium应用的功能，支持各种3D地图可视化需求。

## 目录结构

```
utils/cesium/
├── index.ts          # 统一导出文件
├── manager.ts        # 核心管理器
├── examples.ts       # 使用示例
├── quick-start.ts    # 快速开始
└── README.md         # 使用文档
```

## 快速开始

### 1. 基础使用

```typescript
import { cesiumManager } from './utils/cesium';

// 在React组件中使用
const MyCesiumComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const initCesium = async () => {
      try {
        // 初始化Cesium
        await cesiumManager.initialize();

        // 创建查看器
        cesiumManager.createViewer({
          container: containerRef.current
        });

        // 设置视角
        cesiumManager.setCameraView({
          longitude: 116.4074, // 经度
          latitude: 39.9042,   // 纬度
          height: 1000000      // 高度
        });
      } catch (error) {
        console.error('Cesium初始化失败:', error);
      }
    };

    initCesium();

    // 清理
    return () => {
      cesiumManager.destroy();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />
  );
};
```

### 2. 使用快速开始函数

```typescript
import { quickStart } from './utils/cesium';

// 最简单的使用方式
const viewer = await quickStart(containerElement);
```

### 3. 使用React Hook

```typescript
import { useCesium } from './utils/cesium';

const MyComponent = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { initCesium, cleanup } = useCesium(containerRef);

  useEffect(() => {
    initCesium();
    return cleanup;
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
};
```

### 4. 使用预设示例

```typescript
import { createBasicEarthViewer, createMapWithMarkers } from './utils/cesium';

// 创建基础地球查看器
const viewer = await createBasicEarthViewer(containerElement);

// 创建带标记的地图
const viewerWithMarkers = await createMapWithMarkers(containerElement);
```

## API参考

### CesiumManager类

#### 初始化方法

- `initialize()`: 初始化Cesium库
- `createViewer(options)`: 创建Cesium查看器
- `destroy()`: 销毁查看器并清理资源

#### 视角控制

- `setCameraView(options)`: 设置相机视角
  ```typescript
  cesiumManager.setCameraView({
    longitude: 116.4074, // 经度
    latitude: 39.9042,   // 纬度
    height: 1000000,     // 高度
    heading: 0.0,        // 方向角（可选）
    pitch: -1.57,        // 俯仰角（可选）
    roll: 0.0            // 翻滚角（可选）
  });
  ```

#### 添加实体

- `addPointMarker(position, options)`: 添加点标记
- `addPolyline(positions, options)`: 添加线条
- `addPolygon(positions, options)`: 添加多边形
- `add3DModel(url, position)`: 添加3D模型

### 配置选项

#### CesiumViewerOptions

```typescript
interface CesiumViewerOptions {
  container: HTMLElement;           // 容器元素
  homeButton?: boolean;             // 主页按钮
  sceneModePicker?: boolean;        // 场景模式选择器
  baseLayerPicker?: boolean;        // 底图选择器
  navigationHelpButton?: boolean;   // 导航帮助按钮
  animation?: boolean;              // 动画控件
  timeline?: boolean;               // 时间轴
  fullscreenButton?: boolean;       // 全屏按钮
  geocoder?: boolean;               // 地理编码器
  infoBox?: boolean;                // 信息框
  selectionIndicator?: boolean;     // 选择指示器
}
```

## 使用示例

### 1. 基础地球查看器

```typescript
await cesiumManager.initialize();
cesiumManager.createViewer({ container });
cesiumManager.setCameraView({
  longitude: 116.4074,
  latitude: 39.9042,
  height: 1000000
});
```

### 2. 添加标记点

```typescript
cesiumManager.addPointMarker({
  longitude: 116.4074,
  latitude: 39.9042,
  height: 0
}, {
  pixelSize: 15,
  color: Cesium.Color.RED
});
```

### 3. 添加路径线

```typescript
const routePoints = [
  { longitude: 116.3974, latitude: 39.9093, height: 0 },
  { longitude: 116.3972, latitude: 39.9163, height: 0 },
  { longitude: 116.2755, latitude: 39.9999, height: 0 }
];

cesiumManager.addPolyline(routePoints, {
  color: Cesium.Color.BLUE,
  width: 5
});
```

### 4. 添加区域多边形

```typescript
const areaBoundary = [
  { longitude: 116.3974, latitude: 39.9093, height: 0 },
  { longitude: 116.4174, latitude: 39.9093, height: 0 },
  { longitude: 116.4174, latitude: 39.9293, height: 0 },
  { longitude: 116.3974, latitude: 39.9293, height: 0 }
];

cesiumManager.addPolygon(areaBoundary, {
  color: Cesium.Color.YELLOW.withAlpha(0.3),
  outlineColor: Cesium.Color.YELLOW,
  outlineWidth: 3
});
```

## 导入方式

### 统一导入（推荐）
```typescript
import { cesiumManager, quickStart, createMapWithMarkers } from './utils/cesium';
```

### 按需导入
```typescript
import { cesiumManager } from './utils/cesium/manager';
import { quickStart } from './utils/cesium/quick-start';
import { createMapWithMarkers } from './utils/cesium/examples';
```

## 注意事项

1. **初始化顺序**: 必须先调用`initialize()`再创建查看器
2. **资源清理**: 组件卸载时记得调用`destroy()`清理资源
3. **错误处理**: 所有异步操作都应该包含错误处理
4. **性能优化**: 大量实体时考虑分批添加或使用聚合

## 常见问题

### Q: 如何更改Cesium版本？
A: 修改`manager.ts`中的`cesiumVersion`属性

### Q: 如何自定义样式？
A: 可以通过CSS覆盖Cesium的默认样式

### Q: 如何添加自定义控件？
A: 获取viewer实例后直接操作Cesium API

```typescript
const viewer = cesiumManager.getViewer();
// 使用viewer进行自定义操作
``` 