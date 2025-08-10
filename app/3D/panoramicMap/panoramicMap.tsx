import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import Navigation from '../../components/3D/Navigation';
import { TextureLoaderUtil } from '../../components/3D/TextureLoaderUtil';
import { useSearchParams, useRouter } from 'next/navigation';

// ==================== 类型定义 ====================
interface MouseState {
  x: number;
  y: number;
}

interface RotationState {
  x: number;
  y: number;
}

interface PanoramicMapRefs {
  scene: THREE.Scene | null;
  renderer: THREE.WebGLRenderer | null;
  camera: THREE.PerspectiveCamera | null;
  sphere: THREE.Mesh | null;
  textureLoader: TextureLoaderUtil | null;
}

interface AutoRotationState {
  isEnabled: boolean;
  speed: number;
}

// ==================== 全景地图组件 ====================
const PanoramicMap: React.FC = () => {
  // ==================== 基础引用 ====================
  const mountRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 场景相关引用
  const refs = useRef<PanoramicMapRefs>({
    scene: null,
    renderer: null,
    camera: null,
    sphere: null,
    textureLoader: null
  });

  // ==================== 状态管理 ====================
  const [autoRotation, setAutoRotation] = useState<AutoRotationState>({
    isEnabled: false,
    speed: 0.001
  });

  const autoRotationRef = useRef(autoRotation);
  autoRotationRef.current = autoRotation;

  // 鼠标控制相关状态
  const mouseRef = useRef<MouseState>({ x: 0, y: 0 });
  const isMouseDownRef = useRef(false);
  const rotationRef = useRef<RotationState>({ x: 0, y: 0 });

  // ==================== 场景初始化函数 ====================
  const initializeScene = useCallback(() => {
    if (!mountRef.current) return null;

    // 创建场景
    const scene = new THREE.Scene();
    refs.current.scene = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 0);
    refs.current.camera = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1.0;
    
    // 确保只有一个canvas
    if (mountRef.current.children.length > 0) {
      mountRef.current.innerHTML = '';
    }
    
    mountRef.current.appendChild(renderer.domElement);
    refs.current.renderer = renderer;

    return { scene, camera, renderer };
  }, []);

  // ==================== 球体创建函数 ====================
  const createSphere = useCallback((scene: THREE.Scene) => {
    const geometry = new THREE.SphereGeometry(50, 64, 64);
    const material = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    refs.current.sphere = sphere;

    return sphere;
  }, []);

  // ==================== 纹理加载函数 ====================
  const loadTexture = useCallback((sphere: THREE.Mesh) => {
    // 从 URL 参数获取 HDR 图片路径
    const hdrPath = searchParams?.get('hdr');
    const texturePath = hdrPath || '/PanoramicMap/winter_evening_8k.jpeg';
    
    // 加载 PNG 纹理的函数
    const loadPNGTexture = (pngPath: string) => {
      refs.current.textureLoader = new TextureLoaderUtil();
      
      refs.current.textureLoader.loadTexture(pngPath, {
        maxRetries: 3,
        retryDelay: 1000,
        timeout: 30000,
        fallbackUrls: ['/PanoramicMap/winter_evening_8k.jpeg'],
        onSuccess: (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          
          if (refs.current.sphere) {
            const mesh = refs.current.sphere as THREE.Mesh;
            const material = mesh.material as THREE.MeshBasicMaterial;
            material.map = texture;
            material.needsUpdate = true;
          }
        },
        onError: () => {
          loadDefaultTexture();
        }
      }).catch(() => {
        loadDefaultTexture();
      });
    };
    
    // 加载默认纹理的函数
    const loadDefaultTexture = () => {
      if (refs.current.sphere) {
        const mesh = refs.current.sphere as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.color.setHex(0x808080);
        material.needsUpdate = true;
      }
    };
    
    // 检查是否是 HDR 文件
    const isHDR = texturePath.toLowerCase().endsWith('.hdr');
    
    if (isHDR) {
      const rgbeLoader = new RGBELoader();
      const hdrUrl = texturePath.startsWith('/') ? texturePath : `/${texturePath}`;
      
      rgbeLoader.load(
        hdrUrl,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.generateMipmaps = false;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          
          if (refs.current.sphere) {
            const mesh = refs.current.sphere as THREE.Mesh;
            const material = mesh.material as THREE.MeshBasicMaterial;
            material.map = texture;
            material.needsUpdate = true;
          }
        },
        undefined,
        () => {
          // 尝试加载对应的 PNG 文件
          const pngPath = texturePath.replace('.hdr', '.png');
          loadPNGTexture(pngPath);
        }
      );
    } else {
      loadPNGTexture(texturePath);
    }
  }, [searchParams]);

  // ==================== 辅助器添加函数 ====================
  const addHelpers = useCallback((scene: THREE.Scene) => {
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);
  }, []);

  // ==================== 鼠标控制函数 ====================
  const setupMouseControls = useCallback((renderer: THREE.WebGLRenderer) => {
    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDownRef.current) return;

      const deltaX = event.clientX - mouseRef.current.x;
      const deltaY = event.clientY - mouseRef.current.y;

      rotationRef.current.y += deltaX * 0.01;
      rotationRef.current.x += deltaY * 0.01;

      // 限制垂直旋转角度
      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));

      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const canvas = renderer.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, []);

  // ==================== 动画循环函数 ====================
  const startAnimation = useCallback((scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    const animate = () => {
      if (!isInitializedRef.current) return;
      
      requestAnimationFrame(animate);
      
      // 自动旋转逻辑
      if (autoRotationRef.current.isEnabled && !isMouseDownRef.current && refs.current.sphere) {
        rotationRef.current.y += autoRotationRef.current.speed;
      }
      
      if (refs.current.sphere) {
        refs.current.sphere.rotation.x = rotationRef.current.x;
        refs.current.sphere.rotation.y = rotationRef.current.y;
      }
      
      renderer.render(scene, camera);
    };

    animate();
  }, []);

  // ==================== 窗口大小变化处理 ====================
  const setupResizeHandler = useCallback(() => {
    const handleResize = () => {
      if (refs.current.camera && refs.current.renderer) {
        refs.current.camera.aspect = window.innerWidth / window.innerHeight;
        refs.current.camera.updateProjectionMatrix();
        refs.current.renderer.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ==================== 键盘事件处理 ====================
  const setupKeyboardHandler = useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        router.push('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  // ==================== 资源清理函数 ====================
  const cleanup = useCallback(() => {
    isInitializedRef.current = false;
    
    if (mountRef.current && refs.current.renderer) {
      mountRef.current.removeChild(refs.current.renderer.domElement);
    }
    
    if (refs.current.renderer) {
      refs.current.renderer.dispose();
    }
    
    refs.current.textureLoader?.clearCache();
  }, []);

  // ==================== 主效果钩子 ====================
  useEffect(() => {
    if (!mountRef.current || isInitializedRef.current) return;

    isInitializedRef.current = true;

    // 初始化场景
    const sceneInit = initializeScene();
    if (!sceneInit) return;
    
    const { scene, camera, renderer } = sceneInit;
    
    // 创建球体
    const sphere = createSphere(scene);
    
    // 加载纹理
    loadTexture(sphere);
    
    // 添加辅助器
    addHelpers(scene);
    
    // 设置鼠标控制
    const removeMouseListeners = setupMouseControls(renderer);
    
    // 启动动画
    startAnimation(scene, camera, renderer);
    
    // 设置窗口大小变化处理
    const removeResizeListener = setupResizeHandler();
    
    // 设置键盘事件处理
    const removeKeyboardListener = setupKeyboardHandler();

    // 清理函数
    return () => {
      removeMouseListeners();
      removeResizeListener();
      removeKeyboardListener();
      cleanup();
    };
  }, [initializeScene, createSphere, loadTexture, addHelpers, setupMouseControls, startAnimation, setupResizeHandler, setupKeyboardHandler, cleanup]);

  // ==================== 渲染UI ====================
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* 3D场景容器 */}
      <div 
        ref={mountRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: 'grab'
        }}
      />
      
      {/* 导航组件 */}
      <Navigation />
      
      {/* 返回按钮 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
          返回3D房间
        </button>
      </div>
      
      {/* 操作提示 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px 20px',
        borderRadius: '5px',
        fontSize: '14px',
        backdropFilter: 'blur(10px)'
      }}>
        按住鼠标左键并拖动来旋转视角 | ESC 键返回3D房间
      </div>
      
      {/* 自动旋转控制面板 */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '15px',
        borderRadius: '8px',
        backdropFilter: 'blur(10px)',
        color: 'white',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>自动旋转控制</h3>
        
        {/* 开关按钮 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRotation.isEnabled}
              onChange={(e) => setAutoRotation(prev => ({
                ...prev,
                isEnabled: e.target.checked
              }))}
              style={{ marginRight: '8px' }}
            />
            启用自动旋转
          </label>
        </div>
        
        {/* 速度控制 */}
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            旋转速度: {autoRotation.speed.toFixed(4)}
          </label>
          <input
            type="range"
            min="0.0001"
            max="0.005"
            step="0.0001"
            value={autoRotation.speed}
            onChange={(e) => setAutoRotation(prev => ({
              ...prev,
              speed: parseFloat(e.target.value)
            }))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* 重置按钮 */}
        <button
          onClick={() => {
            rotationRef.current.x = 0;
            rotationRef.current.y = 0;
          }}
          style={{
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            padding: '5px 10px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          重置视角
        </button>
      </div>
    </div>
  );
};

export default PanoramicMap;