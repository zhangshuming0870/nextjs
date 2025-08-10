# Bedroom页面打包优化方案

## 问题分析

在生产环境中，bedroom页面访问特别慢并加载大量资源的主要原因：

### 1. **Three.js资源重复创建**
- 每次组件重新渲染都重新创建几何体、材质和光源
- 没有资源缓存和复用机制
- 阴影渲染配置过高（2048x2048分辨率）

### 2. **打包配置不够优化**
- 缺乏代码分割策略
- Three.js库没有单独打包
- 静态资源处理不够精细
- 缺乏Tree Shaking支持

### 3. **性能监控不足**
- 没有页面可见性检测
- 动画循环持续运行
- 缺乏自适应性能调整

## 优化方案

### 1. **Next.js打包配置优化**

#### 代码分割策略
```typescript
config.optimization.splitChunks = {
  chunks: 'all',
  cacheGroups: {
    // Three.js单独打包
    three: {
      test: /[\\/]node_modules[\\/]three[\\/]/,
      name: 'three',
      chunks: 'all',
      priority: 20,
      enforce: true,
    },
    // 3D组件单独打包
    '3d-components': {
      test: /[\\/]app[\\/]components[\\/]3D[\\/]/,
      name: '3d-components',
      chunks: 'all',
      priority: 25,
      enforce: true,
    }
  }
};
```

#### 静态资源优化
```typescript
config.module.rules.push({
  test: /\.(png|gif|jpg|jpeg|svg|xml|json|gltf|bin|hdr|mp4|wav|flac|mp3)$/,
  type: 'asset/resource',
  generator: {
    filename: 'static/media/[name].[hash][ext]'
  }
});
```

#### Tree Shaking支持
```typescript
config.optimization.usedExports = true;
config.optimization.sideEffects = false;
```

### 2. **Three.js性能优化**

#### 动态阴影质量调整
```typescript
export const getDevicePerformanceLevel = (): 'low' | 'medium' | 'high' => {
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  const memory = (performance as any).memory?.usedJSHeapSize || 0;
  
  if (hardwareConcurrency <= 2 || memory > 100 * 1024 * 1024) {
    return 'low';
  } else if (hardwareConcurrency <= 4) {
    return 'medium';
  } else {
    return 'high';
  }
};
```

#### 资源缓存系统
```typescript
export const createGeometry = (type: string, params: any): THREE.BufferGeometry => {
  const cacheKey = `${type}_${JSON.stringify(params)}`;
  
  if (THREE_OPTIMIZATION_CONFIG.geometryCache.has(cacheKey)) {
    return THREE_OPTIMIZATION_CONFIG.geometryCache.get(cacheKey)!.clone();
  }
  
  // 创建新几何体并缓存
  // ...
};
```

### 3. **资源管理优化**

#### 优先级加载系统
```typescript
export const LOAD_PRIORITY = {
  CRITICAL: 1,    // 关键资源（必须立即加载）
  HIGH: 2,        // 高优先级资源
  MEDIUM: 3,      // 中等优先级资源
  LOW: 4,         // 低优先级资源
  BACKGROUND: 5   // 后台加载资源
};
```

#### 并发加载控制
```typescript
private maxConcurrentLoads = 3;
private currentLoads = 0;

// 控制同时加载的资源数量，避免阻塞
```

### 4. **页面性能优化**

#### 页面可见性检测
```typescript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // 页面不可见时暂停渲染
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    } else {
      // 页面可见时恢复渲染
      animate();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

#### 自适应渲染质量
```typescript
export class PerformanceOptimizer {
  private adjustRenderQuality() {
    if (this.fps < 30) {
      this.renderQuality = Math.max(0.5, this.renderQuality - 0.1);
    } else if (this.fps > 55) {
      this.renderQuality = Math.min(1.0, this.renderQuality + 0.05);
    }
  }
}
```

## 使用方法

### 1. **运行优化后的构建**
```bash
# 普通构建
npm run build

# 带分析的构建
npm run build:analyze

# 分析打包结果
npm run analyze
```

### 2. **使用优化后的组件**
```typescript
// 替换原来的bedroom.tsx
import BedroomOptimized from './bedroomOptimized';

// 或者直接使用优化配置
import { useResourceManager } from '../../components/3D/ResourceManager';
import { createOptimizedRenderer } from '../../components/3D/ThreeOptimization';
```

### 3. **监控性能指标**
- 查看控制台输出的FPS和内存使用情况
- 使用浏览器开发者工具的Performance面板
- 检查Network面板的资源加载情况

## 预期效果

### 1. **包大小优化**
- Three.js库单独打包，减少主包大小
- 3D组件按需加载，减少初始加载时间
- 静态资源压缩和缓存优化

### 2. **运行时性能提升**
- 资源缓存减少重复创建
- 动态阴影质量根据设备性能调整
- 页面不可见时暂停渲染

### 3. **用户体验改善**
- 更快的页面加载速度
- 更流畅的3D交互
- 更好的移动设备兼容性

## 注意事项

### 1. **兼容性考虑**
- 确保目标浏览器支持ES6+特性
- 检查WebGL支持情况
- 考虑降级方案

### 2. **调试和监控**
- 使用bundle分析报告识别问题
- 监控生产环境的性能指标
- 建立性能基准和告警机制

### 3. **持续优化**
- 定期分析打包结果
- 根据用户反馈调整优化策略
- 关注Three.js和Next.js的更新

## 文件结构

```
app/
├── 3D/
│   └── bedroom/
│       ├── bedroom.tsx          # 原始实现
│       ├── bedroomOptimized.tsx # 优化版本
│       └── bedroomConfig.ts     # 配置文件
├── components/
│   └── 3D/
│       ├── ThreeOptimization.ts # Three.js优化
│       └── ResourceManager.ts   # 资源管理
scripts/
└── analyze-bundle.js            # 打包分析脚本
```

通过这套优化方案，bedroom页面的生产环境性能应该会有显著提升，资源加载更加高效，用户体验更加流畅。
