'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

import FirstPersonCameraController from '../../components/3D/FirstPersonCameraController';
import { createAxesHelper, toggleAxesHelper, getAxesHelperVisible } from '../../components/3D/AxesHelperUtil';
import PerformanceMonitor from '../../components/3D/PerformanceMonitor';
import { SimpleTeleportDoorManager } from '../../components/3D/SimpleTeleportDoor';
import {  useRouter } from 'next/navigation';
const ROOM_DIMENSIONS = {
  width: 10,
  height: 5,
  depth: 10
};

const ROOM_COLORS = {
  floor: 0x8B4513,
  ceiling: 0x15418C,
  wall: 0x15418C
};

const createMaterial = (color: number, options: any = {}) => 
  new THREE.MeshLambertMaterial({ color, ...options });

const Bedroom: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const router = useRouter();
  
  const [ready, setReady] = useState(false);
  const [selectedObjectInfo, setSelectedObjectInfo] = useState<string>('');
  const [axesVisible, setAxesVisible] = useState(false);
  
  const doorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);
  const backDoorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);
  const rightDoorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);
  const frontDoorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);

  const handleObjectSelect = (object: THREE.Object3D, point: THREE.Vector3) => {

    if (object.userData && object.userData.nameEn === 'door') {
      if (object.parent === doorManagerRef.current?.getDoor()) {
        doorManagerRef.current?.toggleDoor();
      } else if (object.parent === backDoorManagerRef.current?.getDoor()) {
        backDoorManagerRef.current?.toggleDoor();
      } else if (object.parent === rightDoorManagerRef.current?.getDoor()) {
        rightDoorManagerRef.current?.toggleDoor();
      } else if (object.parent === frontDoorManagerRef.current?.getDoor()) {
        frontDoorManagerRef.current?.toggleDoor();
      }
    }

    const objectInfo = generateObjectInfo(object, point);
    setSelectedObjectInfo(objectInfo);

    setTimeout(() => {
      setSelectedObjectInfo('');
    }, 3000);
  };

  const generateObjectInfo = (object: THREE.Object3D, point: THREE.Vector3): string => {
    let objectInfo = '';

    if (object.name) {
      objectInfo += `物体名称: ${object.name}\n`;
    }
    objectInfo += `物体类型: ${object.type}\n`;
    objectInfo += `位置: (${object.position.x.toFixed(2)}, ${object.position.y.toFixed(2)}, ${object.position.z.toFixed(2)})\n`;
    objectInfo += `点击位置: (${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})\n`;

    if (object instanceof THREE.Mesh) {
      objectInfo += `几何体: ${object.geometry.type}\n`;
      if (object.material) {
        const material = Array.isArray(object.material) ? object.material[0] : object.material;
        objectInfo += `材质: ${material.type}\n`;
        if (material.color) {
          objectInfo += `颜色: #${material.color.getHexString()}\n`;
        }
      }
    }

    return objectInfo;
  };

  const handleToggleAxes = () => {
    if (sceneRef.current) {
      toggleAxesHelper(sceneRef.current);
      setAxesVisible(!axesVisible);
    }
  };

  const createScene = (): THREE.Scene => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    return scene;
  };

  const createCamera = (): THREE.PerspectiveCamera => {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);
    return camera;
  };

  const createRenderer = (): THREE.WebGLRenderer => {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  };

  const createFloor = (): THREE.Mesh => {
    const geometry = new THREE.PlaneGeometry(ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.depth);
    const material = createMaterial(ROOM_COLORS.floor);
    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -ROOM_DIMENSIONS.height / 2;
    floor.receiveShadow = true;
    return floor;
  };

  const createCeiling = (): THREE.Mesh => {
    const geometry = new THREE.PlaneGeometry(ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.depth);
    const material = createMaterial(ROOM_COLORS.ceiling);
    const ceiling = new THREE.Mesh(geometry, material);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM_DIMENSIONS.height / 2;
    ceiling.receiveShadow = true;
    return ceiling;
  };

  const createWalls = (): THREE.Mesh[] => {
    const walls: THREE.Mesh[] = [];
    const wallMaterial = createMaterial(ROOM_COLORS.wall);

    // 左墙
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DIMENSIONS.depth, ROOM_DIMENSIONS.height),
      wallMaterial
    );
    leftWall.position.set(-ROOM_DIMENSIONS.width / 2, 0, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.name = '左墙';
    leftWall.userData = { 
      name: '左墙', 
      nameEn: 'leftWall',
      isWall: true,
      collision: true
    };
    walls.push(leftWall);

    // 右墙
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DIMENSIONS.depth, ROOM_DIMENSIONS.height),
      wallMaterial
    );
    rightWall.position.set(ROOM_DIMENSIONS.width / 2, 0, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.name = '右墙';
    rightWall.userData = { 
      name: '右墙', 
      nameEn: 'rightWall',
      isWall: true,
      collision: true
    };
    walls.push(rightWall);

    // 后墙
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.height),
      wallMaterial
    );
    backWall.position.set(0, 0, -ROOM_DIMENSIONS.depth / 2);
    backWall.receiveShadow = true;
    backWall.name = '后墙';
    backWall.userData = { 
      name: '后墙', 
      nameEn: 'backWall',
      isWall: true,
      collision: true
    };
    walls.push(backWall);

    // 前墙（开放入口，但添加边界墙）
    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_DIMENSIONS.width, ROOM_DIMENSIONS.height),
      wallMaterial
    );
    frontWall.position.set(0, 0, ROOM_DIMENSIONS.depth / 2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    frontWall.name = '前墙';
    frontWall.userData = { 
      name: '前墙', 
      nameEn: 'frontWall',
      isWall: true,
      collision: true
    };
    walls.push(frontWall);

    return walls;
  };

  const createSimpleTeleportDoor = (scene: THREE.Scene) => {
    doorManagerRef.current = new SimpleTeleportDoorManager({
      width: 1,
      position: new THREE.Vector3(-ROOM_DIMENSIONS.width / 2, -ROOM_DIMENSIONS.height / 2 + 1, 0),
      rotation: new THREE.Euler(0, Math.PI, 0),
      onTeleport: () => {
        router.push('/');
      }
    });

    backDoorManagerRef.current = new SimpleTeleportDoorManager({
      width: 1,
      position: new THREE.Vector3(0, -ROOM_DIMENSIONS.height / 2 + 1, -ROOM_DIMENSIONS.depth / 2),
      rotation: new THREE.Euler(0, Math.PI / 2, 0),
      onTeleport: () => {

        router.push('/bedroom');
      }
    });

    rightDoorManagerRef.current = new SimpleTeleportDoorManager({
      width: 1,
      position: new THREE.Vector3(ROOM_DIMENSIONS.width / 2, -ROOM_DIMENSIONS.height / 2 + 1, 0),
      rotation: new THREE.Euler(0, 0, 0),
      onTeleport: () => {
        router.push('/bedroom');
      }
    });

    // 前墙传送门
    frontDoorManagerRef.current = new SimpleTeleportDoorManager({
      width: 1,
      position: new THREE.Vector3(0, -ROOM_DIMENSIONS.height / 2 + 1, ROOM_DIMENSIONS.depth / 2),
      rotation: new THREE.Euler(0, Math.PI / 2, 0), // 面向房间内部
      openAngle: -Math.PI / 2,
      onTeleport: () => {
        console.log('前墙传送门');
        
        router.push('/');
      }
    });

    const components1 = doorManagerRef.current.createComponents();
    const components2 = backDoorManagerRef.current.createComponents();
    const components3 = rightDoorManagerRef.current.createComponents();
    const components4 = frontDoorManagerRef.current.createComponents();
    
    if (components1.door) scene.add(components1.door);
    if (components1.teleportBox) scene.add(components1.teleportBox);
    if (components2.door) scene.add(components2.door);
    if (components2.teleportBox) scene.add(components2.teleportBox);
    if (components3.door) scene.add(components3.door);
    if (components3.teleportBox) scene.add(components3.teleportBox);
    if (components4.door) scene.add(components4.door);
    if (components4.teleportBox) scene.add(components4.teleportBox);
  };

  const createLights = (scene: THREE.Scene) => {
    const ambientLight = new THREE.AmbientLight(0x87CEEB, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.5, 10);
    pointLight.position.set(0, 2, 0);
    pointLight.castShadow = true;
    scene.add(pointLight);
  };







  const createAnimationLoop = (renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) => {
    let lastTime = 0;
    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // 检测传送门
      if (doorManagerRef.current && camera) {
        doorManagerRef.current.checkTeleport(camera.position);
      }
      if (backDoorManagerRef.current && camera) {
        backDoorManagerRef.current.checkTeleport(camera.position);
      }
      if (rightDoorManagerRef.current && camera) {
        rightDoorManagerRef.current.checkTeleport(camera.position);
      }
      if (frontDoorManagerRef.current && camera) {
        frontDoorManagerRef.current.checkTeleport(camera.position);
      }
      
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate(0);
  };

  const handleResize = (camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => {
    const resizeHandler = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', resizeHandler);
    return resizeHandler;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    
    const existingCanvas = mountRef.current.querySelector('canvas');
    if (existingCanvas) {
      mountRef.current.removeChild(existingCanvas);
    }
    
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer();

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const axesHelper = createAxesHelper();
    scene.add(axesHelper);

    const floor = createFloor();
    const ceiling = createCeiling();
    const walls = createWalls();

    scene.add(floor);
    scene.add(ceiling);
    walls.forEach(wall => scene.add(wall));

    createSimpleTeleportDoor(scene);
    createLights(scene);



    mountRef.current.appendChild(renderer.domElement);
    createAnimationLoop(renderer, scene, camera);

    const resizeHandler = handleResize(camera, renderer);
    setReady(true);

    return () => {
      window.removeEventListener('resize', resizeHandler);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
      cameraRef.current = null;
      rendererRef.current = null;
      sceneRef.current = null;
      doorManagerRef.current = null;
      backDoorManagerRef.current = null;
      rightDoorManagerRef.current = null;
      frontDoorManagerRef.current = null;
    };
  }, []);



  // 定义房间边界，用于第一人称控制器的碰撞检测
  const margin = 0.5; // 增加边界距离，防止穿过墙壁
  const bounds = {
    x: { min: -ROOM_DIMENSIONS.width / 2 + margin, max: ROOM_DIMENSIONS.width / 2 - margin },
    y: { min: -ROOM_DIMENSIONS.height / 2 + margin, max: ROOM_DIMENSIONS.height / 2 - margin },
    z: { min: -ROOM_DIMENSIONS.depth / 2 + margin, max: ROOM_DIMENSIONS.depth / 2 - margin },
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
      
      {ready && (
        <>
          <FirstPersonCameraController
            camera={cameraRef.current!}
            renderer={rendererRef.current!}
            scene={sceneRef.current!}
            bounds={bounds}
            showCrosshair={true}
            onObjectSelect={handleObjectSelect}
          />
          <PerformanceMonitor />
          
          {/* XYZ轴显隐控制按钮 */}
          <button
            onClick={handleToggleAxes}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              padding: '8px 12px',
              backgroundColor: axesVisible ? '#4CAF50' : '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'monospace',
              zIndex: 1000
            }}
            title="切换XYZ轴显示"
          >
            {axesVisible ? '隐藏' : '显示'} XYZ轴
          </button>
        </>
      )}
      
      {selectedObjectInfo && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          whiteSpace: 'pre-line',
          zIndex: 1000
        }}>
          {selectedObjectInfo}
        </div>
      )}
    </div>
  );
};

export default Bedroom; 