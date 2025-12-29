'use client'

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createAxesHelper, toggleAxesHelper, getAxesHelperVisible } from '../AxesHelperUtil';
import Computer from '../Computer';
import { SimpleTeleportDoorManager } from '../SimpleTeleportDoor';
import FloatingBox from './FloatingBox';
import Workbench from './Workbench';
import FirstPersonCameraController from '../FirstPersonCameraController';

// 常量定义
const ROOM_CONFIG = {
  width: 6,
  height: 3,
  depth: 7,
  colors: {
    floor: 0x8B4513,
    ceiling: 0x15418C,
    wall: 0x15418C,
    bed: 0x4A4A4A,
    desk: 0x8B4513,
    chair: 0x4A4A4A
  }
};

// 工具函数
const createMaterial = (color: number) => new THREE.MeshLambertMaterial({ color });

const createBox = (geometry: THREE.BoxGeometry, material: THREE.Material, position: THREE.Vector3, userData?: any) => {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (userData) mesh.userData = userData;
  return mesh;
};

const createPlane = (width: number, height: number, material: THREE.Material, position: THREE.Vector3, rotation: THREE.Euler, userData?: any) => {
  const geometry = new THREE.PlaneGeometry(width, height);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.rotation.copy(rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (userData) mesh.userData = userData;
  return mesh;
};

/**
 * 3D房间场景组件
 */
const ThreeScene: React.FC = () => {
  const router = useRouter();
  const mountRef = useRef<HTMLDivElement>(null);

  // Three.js核心引用
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);



  // 交互相关引用
  const selectableObjectsRef = useRef<THREE.Object3D[]>([]);

  // 新增：sceneReady状态
  const [sceneReady, setSceneReady] = useState(false);
  // 新增：电脑位置和方向的 state
  const [computerPosition, setComputerPosition] = useState<[number, number, number]>([2.48, -0.65, 3.21]);
  const [computerRotation, setComputerRotation] = useState<[number, number, number]>([0, -Math.PI * 0.9, 0]);
  // 新增：传送门相关引用
  const teleportDoorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);
  // 新增：悬浮框显示状态
  const [showFloatingBox, setShowFloatingBox] = useState(false);

  // 创建房间基础结构
  const createRoomStructure = (scene: THREE.Scene) => {
    const { width, height, depth, colors } = ROOM_CONFIG;

    // 创建地板和天花板
    const floor = createPlane(
      width, depth,
      createMaterial(colors.floor),
      new THREE.Vector3(0, -height / 2, 0),
      new THREE.Euler(-Math.PI / 2, 0, 0),
      { name: '地板', nameEn: 'floor' }
    );
    scene.add(floor);
    selectableObjectsRef.current.push(floor);

    const ceiling = createPlane(
      width, depth,
      createMaterial(colors.ceiling),
      new THREE.Vector3(0, height / 2, 0),
      new THREE.Euler(Math.PI / 2, 0, 0),
      { name: '天花板', nameEn: 'ceiling' }
    );
    scene.add(ceiling);
    selectableObjectsRef.current.push(ceiling);

    // 创建墙壁
    const wallMaterial = createMaterial(colors.wall);
    const walls = [
      { pos: [0, 0, -depth / 2], rot: [0, 0, 0], size: [width, height], name: '后墙', nameEn: 'backWall' },
      { pos: [-width / 2, 0, 0], rot: [0, Math.PI / 2, 0], size: [depth, height], name: '左墙', nameEn: 'leftWall' }
    ];

    walls.forEach(({ pos, rot, size, name, nameEn }) => {
      const wall = createPlane(
        size[0], size[1],
        wallMaterial,
        new THREE.Vector3(...pos),
        new THREE.Euler(...rot),
        { name, nameEn }
      );
      scene.add(wall);
      selectableObjectsRef.current.push(wall);
    });
  };

  // 创建视频墙
  const createVideoWall = (scene: THREE.Scene) => {
    const { depth, height, width } = ROOM_CONFIG;

    const video = document.createElement('video');
    video.src = '/3dRoom/taikong.mp4';
    video.loop = true;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.style.display = 'none';
    document.body.appendChild(video);
    video.play();

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    const rightWall = createPlane(
      depth, height,
      new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide }),
      new THREE.Vector3(width / 2, 0, 0),
      new THREE.Euler(0, -Math.PI / 2, 0),
      { name: '右墙视频', nameEn: 'rightWallVideo' }
    );
    scene.add(rightWall);
    selectableObjectsRef.current.push(rightWall);
  };

  // 创建家具
  const createFurniture = (scene: THREE.Scene) => {
    const { height } = ROOM_CONFIG;

    // 床
    const bed = createBox(
      new THREE.BoxGeometry(1.8, 0.3, 2.2),
      createMaterial(ROOM_CONFIG.colors.bed),
      new THREE.Vector3(-2, -height / 2 + 0.15, -3.4),
      { name: '床架', nameEn: 'bed' }
    );
    scene.add(bed);
    selectableObjectsRef.current.push(bed);

    // 床垫
    const mattress = createBox(
      new THREE.BoxGeometry(1.6, 0.09, 2.0),
      createMaterial(0xFFFFFF),
      new THREE.Vector3(-2, -height / 2 + 0.3 + 0.09 / 2, -3.4),
      { name: '床垫', nameEn: 'mattress' }
    );
    scene.add(mattress);
    selectableObjectsRef.current.push(mattress);

    // 书桌 - 从左墙延伸到右墙
    const desk = createBox(
      new THREE.BoxGeometry(ROOM_CONFIG.width, 0.05, 1),
      createMaterial(0x061a31), // 深蓝色
      new THREE.Vector3(0, -height / 2 + 0.75, 3.2),
      { name: '书桌', nameEn: 'desk' }
    );
    scene.add(desk);
    selectableObjectsRef.current.push(desk);

    // 椅子
    const chairSeat = createBox(
      new THREE.BoxGeometry(0.4, 0.05, 0.4),
      createMaterial(ROOM_CONFIG.colors.chair),
      new THREE.Vector3(0, -height / 2 + 0.45, 2.7),
      { name: '椅子座垫', nameEn: 'chairSeat' }
    );
    scene.add(chairSeat);
    selectableObjectsRef.current.push(chairSeat);

    const chairBack = createBox(
      new THREE.BoxGeometry(0.4, 0.6, 0.05),
      createMaterial(ROOM_CONFIG.colors.chair),
      new THREE.Vector3(0, -height / 2 + 0.75, 2.5),
      { name: '椅子靠背', nameEn: 'chairBack' }
    );
    scene.add(chairBack);
    selectableObjectsRef.current.push(chairBack);

    const mouseGeometry = new THREE.SphereGeometry(0.06, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const mouse = new THREE.Mesh(mouseGeometry, createMaterial(0x333333));
    mouse.position.set(2.1, -height / 2 + 0.78, 3.2);
    mouse.scale.set(1, 1, 1.8); // 在X轴方向拉伸，形成椭圆形
    mouse.castShadow = true;
    mouse.receiveShadow = true;
    mouse.userData = { name: '鼠标', nameEn: 'mouse' };
    scene.add(mouse);
    selectableObjectsRef.current.push(mouse);

    const keyboard = createBox(
      new THREE.BoxGeometry(0.45, 0.02, 0.18),
      createMaterial(0x222222),
      new THREE.Vector3(2.48, -height / 2 + 0.78, 2.95),
      { name: '键盘', nameEn: 'keyboard' }
    );
    scene.add(keyboard);
    selectableObjectsRef.current.push(keyboard);
  };

  // 创建显示器阵列
  const createMonitorArray = (scene: THREE.Scene) => {
    const videoSrcs = ['/3dRoom/taikong2.mp4', '/3dRoom/taikong3.mp4', '/3dRoom/taikong4.mp4'];
    const videoTextures = videoSrcs.map(src => {
      const video = document.createElement('video');
      video.src = src;
      video.loop = true;
      video.muted = true;
      video.autoplay = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.style.display = 'none';
      document.body.appendChild(video);
      video.play();
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBFormat;
      return texture;
    });

    const monitorGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const monitorMaterial = createMaterial(0x000000);
    const baseZ = 3 + 1.6;
    const baseY = -0.2;

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 3; col++) {
        const x = (col - 1) * 1.4;
        const y = baseY + (1 - row) * 1.1;
        const z = baseZ;

        let material;
        if (row === 0) {
          material = new THREE.MeshBasicMaterial({ map: videoTextures[col], side: THREE.FrontSide });
        } else if (row === 1 && col === 0) {
          const texture = new THREE.TextureLoader().load('/3dRoom/me.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else if (row === 1 && col === 1) {
          const texture = new THREE.TextureLoader().load('/3dRoom/gongzuotai.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else if (row === 1 && col === 2) {
          const texture = new THREE.TextureLoader().load('/3dRoom/wenzhang.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else {
          material = monitorMaterial;
        }

        const monitor = createBox(
          monitorGeometry,
          material,
          new THREE.Vector3(x, y, z),
          { name: `显示器${row + 1}-${col + 1}`, nameEn: `monitor${row + 1}-${col + 1}` }
        );
        monitor.rotation.y = Math.PI;
        scene.add(monitor);
        selectableObjectsRef.current.push(monitor);
      }
    }
  };

  // 创建传送门
  const createTeleportDoor = (scene: THREE.Scene) => {
    // 在左墙上创建传送门，位置在左墙中间偏下
    const doorConfig = {
      position: new THREE.Vector3(-ROOM_CONFIG.width / 2, -0.5, 0), // 左墙位置
      rotation: new THREE.Euler(0, 0, 0), // 面向房间内部
      width: 0.9,
      height: 2.0,
      color: 0x8B4513,
      openAngle: -Math.PI / 2,
      onTeleport: () => {
        // 传送门触发时的回调函数
        // alert('传送门已激活！');
        // 这里可以添加导航到其他页面的逻辑
        router.push('/3D/bedroom');
      }
    };

    teleportDoorManagerRef.current = new SimpleTeleportDoorManager(doorConfig);
    const { door, teleportBox } = teleportDoorManagerRef.current.createComponents();

    scene.add(door);
    scene.add(teleportBox);

    // 将传送门组件添加到可选择对象列表中
    selectableObjectsRef.current.push(door);
    if (teleportBox) {
      selectableObjectsRef.current.push(teleportBox);
    }
  };

  // 处理物体点击
  const handleObjectClick = (object: THREE.Object3D, point: THREE.Vector3) => {
    const clickedObject = object as THREE.Mesh;
    const objectName = clickedObject.userData.name || '未知物体';
    const objectNameEn = clickedObject.userData.nameEn || 'unknown object';

    // 检查是否是图片格子
    if (clickedObject.userData.isImageCell && clickedObject.userData.onClick) {
      clickedObject.userData.onClick();
      return;
    }

    switch (objectNameEn) {
      case 'monitor2-1':
        alert('境外服务器，可能需要上梯子');
        window.open('https://zhangshuming-blog.vercel.app/me.html', '_blank');
        break;
      case 'monitor2-2':
        router.push('/work');
        break;
      case 'monitor2-3':
        alert('境外服务器,可能需要上梯子');
        window.open('https://zhangshuming-blog.vercel.app/post.html', '_blank');
        break;
      case 'computerScreen':
        if (clickedObject.userData.onSelect) {
          clickedObject.userData.onSelect();
        }
        break;
      case 'door':
        // 点击传送门时切换开关状态
        if (teleportDoorManagerRef.current) {
          teleportDoorManagerRef.current.toggleDoor();
        }
        break;
      case 'button1':
        // 点击"进入工作台"按钮，控制悬浮框显示
        setShowFloatingBox(prevState => !prevState);
        break;
      default:
        break;
    }
  };





  const [axesVisible, setAxesVisible] = useState(false);

  const handleToggleAxes = () => {
    if (sceneRef.current) {
      toggleAxesHelper(sceneRef.current);
      setAxesVisible(!axesVisible);
    }
  };

  // 主初始化函数
  useEffect(() => {
    if (!mountRef.current) return;

    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 2);
    camera.lookAt(0, 1.6, 0);
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);



    // 创建场景内容
    createRoomStructure(scene);
    createVideoWall(scene);
    createFurniture(scene);
    createMonitorArray(scene);
    createTeleportDoor(scene);

    //xyz轴
    const axesHelper = createAxesHelper();
    scene.add(axesHelper);

    // 创建灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(ROOM_CONFIG.width / 2, ROOM_CONFIG.height / 2, 4);
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



    // 渲染循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // 检测传送门
      if (teleportDoorManagerRef.current && cameraRef.current) {
        teleportDoorManagerRef.current.checkTeleport(cameraRef.current.position);
      }

      renderer.render(scene, camera);
    };
    animate();

    // 窗口大小变化处理
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneReady && sceneRef.current) {
      setSceneReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div
      ref={mountRef}
      className='home-main'
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
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
      {/* 操作说明面板 */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div>点击屏幕进入房间（鼠标将被锁定）</div>
        <div>屏幕中央十字准星瞄准物品</div>
        <div>点击选择当前瞄准的物品</div>
        <div>WASD移动，空格/Shift上下</div>
        <div>ESC退出房间模式，I键切换Y轴反转</div>
        <div>提示：请允许浏览器锁定鼠标指针</div>
      </div>

      <div style={{
        position: 'absolute',
        top: '3%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontSize: '14px',
        zIndex: 1000
      }}>
        <div>服务器带宽有捉急，在修复了...🫡</div>
      </div>


      {sceneReady && (
        <Computer
          scene={sceneRef.current as THREE.Scene}
          selectableObjects={selectableObjectsRef}
          position={computerPosition}
          rotation={computerRotation}
        />
      )}

      {/* 悬浮框组件 */}
      {sceneReady && sceneRef.current && (
        <FloatingBox
          scene={sceneRef.current}
          selectableObjects={selectableObjectsRef}
          showFloatingBox={showFloatingBox}
          setShowFloatingBox={setShowFloatingBox}
        />
      )}

      {/* 工作台组件 */}
      {sceneReady && sceneRef.current && (
        <Workbench
          scene={sceneRef.current}
          selectableObjects={selectableObjectsRef}
          height={ROOM_CONFIG.height}
        />
      )}

      {/* 第一人称相机控制器 */}
      {sceneReady && cameraRef.current && rendererRef.current && sceneRef.current && (
        <FirstPersonCameraController
          camera={cameraRef.current}
          renderer={rendererRef.current}
          scene={sceneRef.current}
          bounds={{
            x: { min: -ROOM_CONFIG.width / 2 + 0.5, max: ROOM_CONFIG.width / 2 - 0.5 },
            y: { min: -ROOM_CONFIG.height / 2 + 0.5, max: ROOM_CONFIG.height / 2 - 0.5 },
            z: { min: -ROOM_CONFIG.depth / 2 + 0.5, max: ROOM_CONFIG.depth / 2 - 0.5 }
          }}
          showCrosshair={true}
          moveSpeed={0.1}
          mouseSensitivity={0.0015}
          onObjectSelect={handleObjectClick}
        />
      )}
    </div>
  );
};

export default ThreeScene; 