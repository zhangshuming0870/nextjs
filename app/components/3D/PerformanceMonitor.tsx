import React, { useEffect, useState } from 'react';
import * as THREE from 'three';

interface PerformanceMonitorProps {
  renderer?: THREE.WebGLRenderer | null;
  style?: React.CSSProperties;
}

/**
 * 性能监控组件
 * 显示FPS、内存使用情况等性能信息
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  renderer, 
  style = {} 
}) => {
  const [performanceInfo, setPerformanceInfo] = useState<string>('');

  useEffect(() => {
    if (!renderer) return;

    // 性能监控变量
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    // 性能监控函数
    const updatePerformanceInfo = () => {
      frameCount++;
      const currentTime = performance.now();
      if (currentTime - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;
        
        // 更新性能信息
        setPerformanceInfo(`FPS: ${fps} | 内存: ${Math.round(renderer.info.memory.geometries)} 几何体 | ${Math.round(renderer.info.memory.textures)} 纹理`);
      }
    };

    // 开始监控
    const intervalId = setInterval(updatePerformanceInfo, 16); // 约60FPS的更新频率

    return () => {
      clearInterval(intervalId);
    };
  }, [renderer]);

  if (!performanceInfo) return null;

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 1000,
      ...style
    }}>
      {performanceInfo}
    </div>
  );
};

export default PerformanceMonitor; 