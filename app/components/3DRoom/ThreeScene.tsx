'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const ThreeScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const moveStateRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
  });
  const mouseRef = useRef({ x: 0, y: 0 });
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const isPointerLockedRef = useRef(false);
  const mouseSmoothRef = useRef({ x: 0, y: 0 });
  const mouseInvertY = useRef(false); // 是否反转Y轴
  const cameraRotationRef = useRef({ x: 0, y: 0 }); // 相机旋转角度
  const cameraDirectionRef = useRef(new THREE.Vector3(0, 0, -1)); // 相机方向向量

  // 新增：射线检测相关
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseVectorRef = useRef<THREE.Vector2 | null>(null);
  const selectableObjectsRef = useRef<THREE.Mesh[]>([]);
  const highlightedObjectRef = useRef<THREE.Mesh | null>(null);
  const originalMaterialsRef = useRef<Map<THREE.Mesh, THREE.Material>>(new Map());

  // 1. 顶部添加
  const [showLabels, setShowLabels] = useState({
    floor: false,
    ceiling: false,
    left: false,
    right: false,
    back: false,
    axes: false
  });
  const labelSpritesRef = useRef<any>({});
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  // 1. 添加handleShowLabelButton函数
  const handleShowLabelButton = (key: keyof typeof showLabels) => {
    console.log('key', key)
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    setShowLabels(s => ({ ...s, [key]: !s[key] }));
    console.log('showLabels', showLabels)
  };

  useEffect(() => {
    if (!mountRef.current) return;

    // 清理之前的实例
    if (rendererRef.current && mountRef.current) {
      mountRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    // 创建场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // 深灰色背景
    sceneRef.current = scene;

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 2); // 在房间内开始
    // 确保相机初始朝向正确
    camera.lookAt(0, 1.6, 0); // 看向房间中心
    cameraRef.current = camera;

    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // 初始化射线检测
    const raycaster = new THREE.Raycaster();
    const mouseVector = new THREE.Vector2();
    raycasterRef.current = raycaster;
    mouseVectorRef.current = mouseVector;

    // 初始化鼠标位置
    lastMousePositionRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

    // 创建房间
    const roomWidth = 6;  // 增加宽度
    const roomHeight = 3;  // 增加高度
    const roomDepth = 7;   // 增加深度

    // ====== 创建标签Sprite工具函数 ======
    function createLabelSprite(text: string) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 32px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(material);
      sprite.scale.set(1.5, 0.4, 1);
      return sprite;
    }

    // ====== 创建并添加标签Sprite ======
    // 地板标签
    const floorLabel = createLabelSprite('地板');
    floorLabel.position.set(0, -roomHeight / 2 + 0.05, 0);
    floorLabel.visible = false;
    scene.add(floorLabel);
    labelSpritesRef.current.floorLabel = floorLabel;

    // 天花板标签
    const ceilingLabel = createLabelSprite('天花板');
    ceilingLabel.position.set(0, roomHeight / 2 - 0.05, 0);
    ceilingLabel.visible = false;
    scene.add(ceilingLabel);
    labelSpritesRef.current.ceilingLabel = ceilingLabel;

    // 左墙标签
    const leftLabel = createLabelSprite('左墙');
    leftLabel.position.set(-roomWidth / 2 + 0.05, 0, 0);
    leftLabel.rotation.y = Math.PI / 2;
    leftLabel.visible = false;
    scene.add(leftLabel);
    labelSpritesRef.current.leftLabel = leftLabel;

    // 右墙标签
    const rightLabel = createLabelSprite('右墙');
    rightLabel.position.set(roomWidth / 2 - 0.05, 0, 0);
    rightLabel.rotation.y = -Math.PI / 2;
    rightLabel.visible = false;
    scene.add(rightLabel);
    labelSpritesRef.current.rightLabel = rightLabel;

    // 后墙标签
    const backLabel = createLabelSprite('后墙');
    backLabel.position.set(0, 0, -roomDepth / 2 + 0.05);
    backLabel.visible = false;
    scene.add(backLabel);
    labelSpritesRef.current.backLabel = backLabel;

    // 地板
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 棕色木地板
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomHeight / 2;
    floor.receiveShadow = true;
    floor.userData = { name: '地板', nameEn: 'floor' };
    scene.add(floor);
    selectableObjectsRef.current.push(floor);

    // 天花板
    const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0x15418C }); // 深科技蓝
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight / 2;
    ceiling.receiveShadow = true;
    ceiling.userData = { name: '天花板', nameEn: 'ceiling' };
    scene.add(ceiling);
    selectableObjectsRef.current.push(ceiling);

    // 墙壁统一深科技蓝
    const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x15418C }); // 深科技蓝

    // 后墙
    const backWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.z = -roomDepth / 2;
    backWall.receiveShadow = true;
    backWall.userData = { name: '后墙', nameEn: 'backWall' };
    scene.add(backWall);
    selectableObjectsRef.current.push(backWall);

    // 左墙
    const leftWallGeometry = new THREE.PlaneGeometry(roomDepth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -roomWidth / 2;
    leftWall.receiveShadow = true;
    leftWall.userData = { name: '左墙', nameEn: 'leftWall' };
    scene.add(leftWall);
    selectableObjectsRef.current.push(leftWall);

    // 右墙（播放视频，带边框和玻璃窗效果）
    // 创建video元素
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

    // 创建视频纹理
    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;
    videoTexture.format = THREE.RGBFormat;

    // 视频区域参数
    const videoW = roomDepth;
    const videoH = roomHeight;
    const videoX = roomWidth / 2;
    const videoY = 0;
    const videoZ = 0;

    // 右墙视频
    const rightWallGeometry = new THREE.PlaneGeometry(videoW, videoH);
    const rightWallMaterial = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.DoubleSide });
    const rightWall = new THREE.Mesh(rightWallGeometry, rightWallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(videoX, videoY, videoZ);
    rightWall.receiveShadow = true;
    rightWall.userData = { name: '右墙视频', nameEn: 'rightWallVideo' };
    scene.add(rightWall);
    selectableObjectsRef.current.push(rightWall);

    // 视频边框
    const borderThickness = 0.08;
    const borderColor = 0x222831;
    // 上下边框
    const borderTop = new THREE.Mesh(
      new THREE.BoxGeometry(videoW + borderThickness * 2, borderThickness, borderThickness),
      new THREE.MeshLambertMaterial({ color: borderColor })
    );
    borderTop.position.set(videoX, videoY + videoH / 2 + borderThickness / 2, videoZ);
    borderTop.rotation.y = -Math.PI / 2;
    borderTop.userData = { name: '视频边框', nameEn: 'videoBorderTop' };
    scene.add(borderTop);
    selectableObjectsRef.current.push(borderTop);

    const borderBottom = borderTop.clone();
    borderBottom.position.set(videoX, videoY - videoH / 2 - borderThickness / 2, videoZ);
    borderBottom.userData = { name: '视频边框', nameEn: 'videoBorderBottom' };
    scene.add(borderBottom);
    selectableObjectsRef.current.push(borderBottom);

    // 左右边框
    const borderSide = new THREE.Mesh(
      new THREE.BoxGeometry(borderThickness, videoH + borderThickness * 2, borderThickness),
      new THREE.MeshLambertMaterial({ color: borderColor })
    );
    borderSide.position.set(videoX, videoY, videoZ - videoW / 2 - borderThickness / 2);
    borderSide.rotation.y = -Math.PI / 2;
    borderSide.userData = { name: '视频边框', nameEn: 'videoBorderSide' };
    scene.add(borderSide);
    selectableObjectsRef.current.push(borderSide);

    const borderSide2 = borderSide.clone();
    borderSide2.position.set(videoX, videoY, videoZ + videoW / 2 + borderThickness / 2);
    borderSide2.userData = { name: '视频边框', nameEn: 'videoBorderSide2' };
    scene.add(borderSide2);
    selectableObjectsRef.current.push(borderSide2);

    // 玻璃效果
    const glassGeometry = new THREE.PlaneGeometry(videoW * 0.98, videoH * 0.98);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x99ccff,
      transparent: true,
      opacity: 0.25,
      roughness: 0.1,
      metalness: 0.3,
      reflectivity: 0.7,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      transmission: 0.8,
      ior: 1.45,
    });
    const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
    glassMesh.position.set(videoX + 0.01, videoY, videoZ); // 稍微前移防止z冲突
    glassMesh.rotation.y = -Math.PI / 2;
    glassMesh.userData = { name: '玻璃窗', nameEn: 'glassWindow' };
    scene.add(glassMesh);
    selectableObjectsRef.current.push(glassMesh);

    // 床
    const bedGeometry = new THREE.BoxGeometry(1.8, 0.3, 2.2);
    const bedMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A }); // 深灰色床架
    const bed = new THREE.Mesh(bedGeometry, bedMaterial);
    // 贴近后墙，床中心z = -roomDepth/2 + 床长/2 + 0.05
    bed.position.set(-2, -roomHeight / 2 + 0.15, -3.4); // roomDepth=7, 后墙z=-3.5, 床长2.2, -3.5+1.1+0.05=-2.35, 但更贴近后墙可用-3.4
    bed.castShadow = true;
    bed.receiveShadow = true;
    bed.userData = { name: '床架', nameEn: 'bed' };
    scene.add(bed);
    selectableObjectsRef.current.push(bed);

    // 床垫
    const mattressGeometry = new THREE.BoxGeometry(1.6, 0.09, 2.0);
    const mattressMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF }); // 白色床垫
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial);
    mattress.position.set(-2, -roomHeight / 2 + 0.3 + 0.09 / 2, -3.4); // y为床架顶面+床垫一半厚度
    mattress.castShadow = true;
    mattress.receiveShadow = true;
    mattress.userData = { name: '床垫', nameEn: 'mattress' };
    scene.add(mattress);
    selectableObjectsRef.current.push(mattress);

    // 枕头
    const pillowGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.6);
    const pillowMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
    const pillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    pillow.position.set(-2, -roomHeight / 2 + 0.45, -2.7);
    pillow.castShadow = true;
    pillow.receiveShadow = true;
    pillow.userData = { name: '枕头', nameEn: 'pillow' };
    scene.add(pillow);
    selectableObjectsRef.current.push(pillow);

    // 床头柜
    const nightstandGeometry = new THREE.BoxGeometry(0.5, 0.6, 0.4);
    const nightstandMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // 棕色
    const nightstand = new THREE.Mesh(nightstandGeometry, nightstandMaterial);
    // 贴近后墙，且在床右侧（x轴更大，z与床一致）
    nightstand.position.set(-1.1 + 0.25, -roomHeight / 2 + 0.3, -3.4); // 床右侧边缘+床头柜一半宽度
    nightstand.castShadow = true;
    nightstand.receiveShadow = true;
    nightstand.userData = { name: '床头柜', nameEn: 'nightstand' };
    scene.add(nightstand);
    selectableObjectsRef.current.push(nightstand);

    // 书桌
    const deskGeometry = new THREE.BoxGeometry(1.2, 0.05, 0.6);
    const deskMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(0, -roomHeight / 2 + 0.75, 3);
    desk.castShadow = true;
    desk.receiveShadow = true;
    desk.userData = { name: '书桌', nameEn: 'desk' };
    scene.add(desk);
    selectableObjectsRef.current.push(desk);

    // 书桌腿
    const deskLegGeometry = new THREE.BoxGeometry(0.05, 0.7, 0.05);
    const deskLegMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    for (let i = 0; i < 4; i++) {
      const leg = new THREE.Mesh(deskLegGeometry, deskLegMaterial);
      const x = 0 + (i % 2 === 0 ? -0.55 : 0.55);
      const z = 3 + (i < 2 ? -0.25 : 0.25);
      leg.position.set(x, -roomHeight / 2 + 0.35, z);
      leg.castShadow = true;
      leg.receiveShadow = true;
      leg.userData = { name: `书桌腿${i + 1}`, nameEn: `deskLeg${i + 1}` };
      scene.add(leg);
      selectableObjectsRef.current.push(leg);
    }

    // 椅子
    const chairSeatGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.4);
    const chairMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
    const chairSeat = new THREE.Mesh(chairSeatGeometry, chairMaterial);
    chairSeat.position.set(0, -roomHeight / 2 + 0.45, 2.7);
    chairSeat.castShadow = true;
    chairSeat.receiveShadow = true;
    chairSeat.userData = { name: '椅子座垫', nameEn: 'chairSeat' };
    scene.add(chairSeat);
    selectableObjectsRef.current.push(chairSeat);

    // 椅子靠背
    const chairBackGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.05);
    const chairBack = new THREE.Mesh(chairBackGeometry, chairMaterial);
    chairBack.position.set(0, -roomHeight / 2 + 0.75, 2.5);
    chairBack.castShadow = true;
    chairBack.receiveShadow = true;
    chairBack.userData = { name: '椅子靠背', nameEn: 'chairBack' };
    scene.add(chairBack);
    selectableObjectsRef.current.push(chairBack);

    // 窗户（在右墙上）
    const windowGeometry = new THREE.PlaneGeometry(1, 1);
    const windowMaterial = new THREE.MeshLambertMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3
    });
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(roomWidth / 2 + 0.01, 0, 0);
    windowMesh.rotation.y = -Math.PI / 2;
    windowMesh.userData = { name: '窗户', nameEn: 'window' };
    scene.add(windowMesh);
    selectableObjectsRef.current.push(windowMesh);

    // 上排三个显示器分别播放不同视频
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

    // 显示器（2行3列矩阵排列在桌子前方）
    const monitorGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.05);
    const monitorMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });

    // 桌子中心位置
    const deskCenterX = 0;
    const deskCenterZ = 3;

    // 2行3列矩阵参数
    const rows = 2;
    const cols = 3;
    const monitorGapX = 1.4; // 水平间距
    const monitorGapY = 1.1; // 垂直间距
    const baseZ = deskCenterZ + 1.6; // 距离桌子前方的距离
    const baseY = -0.2; // 显示器中心高度，进一步降低整体高度

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 计算每个显示器的中心位置
        const x = (col - 1) * monitorGapX;
        const y = baseY + (rows - 1 - row) * monitorGapY;
        const z = baseZ;
        let material;
        if (row === 0) {
          // 上排，分别用不同视频材质
          material = new THREE.MeshBasicMaterial({ map: videoTextures[col], side: THREE.FrontSide });
        } else if (row === 1 && col === 0) {
          // 第二排第一个显示器，展示me.png
          const texture = new THREE.TextureLoader().load('/3dRoom/me.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else if (row === 1 && col === 1) {
          // 第二排第二个显示器，展示gongzuotai.png
          const texture = new THREE.TextureLoader().load('/3dRoom/gongzuotai.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else if (row === 1 && col === 2) {
          // 第二排最后一个显示器，展示wenzhang.png
          const texture = new THREE.TextureLoader().load('/3dRoom/wenzhang.png');
          material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide });
        } else {
          // 其它下排，黑色
          material = monitorMaterial;
        }
        // 显示器主体
        const monitor = new THREE.Mesh(monitorGeometry, material);
        monitor.position.set(x, y, z);
        monitor.rotation.y = Math.PI; // 正面朝向桌子
        monitor.castShadow = true;
        monitor.receiveShadow = true;
        monitor.userData = { name: `显示器${row + 1}-${col + 1}`, nameEn: `monitor${row + 1}-${col + 1}` };
        scene.add(monitor);
        selectableObjectsRef.current.push(monitor);
      }
    }

    // 桌面上添加键盘
    const keyboardGeometry = new THREE.BoxGeometry(0.7, 0.04, 0.22);
    const keyboardMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(deskCenterX, -roomHeight / 2 + 0.79, deskCenterZ + 0.35);
    keyboard.castShadow = true;
    keyboard.receiveShadow = true;
    keyboard.userData = { name: '键盘', nameEn: 'keyboard' };
    scene.add(keyboard);
    selectableObjectsRef.current.push(keyboard);

    // 桌面上添加鼠标
    const mouseGeometry = new THREE.SphereGeometry(0.06, 32, 16);
    mouseGeometry.scale(1.2, 0.5, 2.0); // 椭圆形
    const mouseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
    const mouse = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouse.position.set(deskCenterX + 0.25, -roomHeight / 2 + 0.81, deskCenterZ + 0.45);
    mouse.castShadow = true;
    mouse.receiveShadow = true;
    mouse.userData = { name: '鼠标', nameEn: 'mouse' };
    scene.add(mouse);
    selectableObjectsRef.current.push(mouse);

    // 更明亮的环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.1); // 强度提升
    scene.add(ambientLight);

    // 更自然的主方向光（模拟窗户外阳光）
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // 强度提升
    directionalLight.position.set(roomWidth / 2, roomHeight / 2, 4); // 更靠近窗户方向
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

    // 射线检测函数
    const checkIntersection = (mouseX: number, mouseY: number) => {
      if (!raycasterRef.current || !mouseVectorRef.current || !cameraRef.current) return;

      // 将鼠标位置归一化为设备坐标。x 和 y 方向的取值范围是 (-1 to +1)
      mouseVectorRef.current.x = (mouseX / window.innerWidth) * 2 - 1;
      mouseVectorRef.current.y = -(mouseY / window.innerHeight) * 2 + 1;

      // 通过摄像机和鼠标位置更新射线
      raycasterRef.current.setFromCamera(mouseVectorRef.current, cameraRef.current);

      // 计算物体和射线的焦点
      const intersects = raycasterRef.current.intersectObjects(selectableObjectsRef.current);

      // 清除之前的高亮
      if (highlightedObjectRef.current) {
        const originalMaterial = originalMaterialsRef.current.get(highlightedObjectRef.current);
        if (originalMaterial) {
          highlightedObjectRef.current.material = originalMaterial;
        }
        highlightedObjectRef.current = null;
      }

      // 高亮当前选中的物体
      if (intersects.length > 0) {
        const selectedObject = intersects[0].object as THREE.Mesh;
        const currentMaterial = selectedObject.material;

        // 检查是否是视频材质或图片材质，如果是则跳过高亮处理
        const isVideoMaterial = currentMaterial instanceof THREE.MeshBasicMaterial &&
          currentMaterial.map && currentMaterial.map instanceof THREE.VideoTexture;
        const isImageMaterial = currentMaterial instanceof THREE.MeshBasicMaterial &&
          currentMaterial.map && currentMaterial.map instanceof THREE.Texture &&
          !(currentMaterial.map instanceof THREE.VideoTexture);

        if (isVideoMaterial || isImageMaterial) {
          // 对于视频材质和图片材质，跳过高亮处理以避免克隆问题
          return;
        }

        highlightedObjectRef.current = selectedObject;

        // 保存原始材质
        if (!originalMaterialsRef.current.has(selectedObject)) {
          const material = selectedObject.material;
          if (material) {
            if (Array.isArray(material) && material[0]) {
              originalMaterialsRef.current.set(selectedObject, (material[0] as THREE.Material).clone());
            } else if (!Array.isArray(material)) {
              originalMaterialsRef.current.set(selectedObject, (material as THREE.Material).clone());
            }
          }
        }

        // 创建高亮材质
        let highlightMaterial: THREE.Material | null = null;

        if (Array.isArray(currentMaterial) && currentMaterial[0]) {
          highlightMaterial = (currentMaterial[0] as THREE.Material).clone();
        } else if (currentMaterial) {
          highlightMaterial = (currentMaterial as THREE.Material).clone();
        }

        if (highlightMaterial) {
          if (highlightMaterial instanceof THREE.MeshLambertMaterial) {
            highlightMaterial.emissive.setHex(0x444444);
          } else if (highlightMaterial instanceof THREE.MeshBasicMaterial) {
            // 对于视频材质，添加发光效果
            (highlightMaterial as any).emissive = new THREE.Color(0x222222);
          }
          selectedObject.material = highlightMaterial;
        }
      }
    };

    // 点击处理函数
    const handleObjectClick = (mouseX: number, mouseY: number) => {
      if (!raycasterRef.current || !mouseVectorRef.current || !cameraRef.current) return;

      mouseVectorRef.current.x = (mouseX / window.innerWidth) * 2 - 1;
      mouseVectorRef.current.y = -(mouseY / window.innerHeight) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseVectorRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(selectableObjectsRef.current);

      if (intersects.length > 0) {
        const clickedObject = intersects[0].object as THREE.Mesh;
        const objectName = clickedObject.userData.name || '未知物体';
        const objectNameEn = clickedObject.userData.nameEn || 'unknown object';
        console.log(`点击了: ${objectName}`);

        // 这里可以添加更多交互逻辑
        // 例如：显示物体信息、播放音效、触发动画等
        console.log(`您点击了: ${objectName}`);

        switch (objectNameEn) {
          case 'monitor2-1':
            alert('境外服务器，可能需要上梯子');
            window.open('https://zhangshuming-blog.vercel.app/me.html', '_blank');
            break;

          case 'monitor2-2':
            //打开新的页面跳转到/work页面，不刷新当前页面
            window.open('/work', '_blank');
            break;
          case 'monitor2-3':
            alert('境外服务器,可能需要上梯子');
            window.open('https://zhangshuming-blog.vercel.app/post.html', '_blank');
            break;
        }
      }
    };

    // 键盘控制
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          moveStateRef.current.forward = true;
          break;
        case 'KeyS':
          moveStateRef.current.backward = true;
          break;
        case 'KeyA':
          moveStateRef.current.left = true;
          break;
        case 'KeyD':
          moveStateRef.current.right = true;
          break;
        case 'Space':
          moveStateRef.current.up = true;
          break;
        case 'ShiftLeft':
          moveStateRef.current.down = true;
          break;
        case 'Escape':
          // ESC键退出指针锁定
          if (isPointerLockedRef.current) {
            document.exitPointerLock();
          }
          break;
        case 'KeyI':
          // I键切换Y轴反转
          mouseInvertY.current = !mouseInvertY.current;
          console.log('Y轴反转:', mouseInvertY.current ? '开启' : '关闭');
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW':
          moveStateRef.current.forward = false;
          break;
        case 'KeyS':
          moveStateRef.current.backward = false;
          break;
        case 'KeyA':
          moveStateRef.current.left = false;
          break;
        case 'KeyD':
          moveStateRef.current.right = false;
          break;
        case 'Space':
          moveStateRef.current.up = false;
          break;
        case 'ShiftLeft':
          moveStateRef.current.down = false;
          break;
      }
    };

    // 鼠标控制
    const handleMouseMove = (event: MouseEvent) => {
      // 始终从屏幕中央进行射线检测（物品选择）
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      checkIntersection(centerX, centerY);

      // 控制视角旋转 - 只在指针锁定时进行
      if (isPointerLockedRef.current) {
        // 在指针锁定模式下，使用movementX/Y，更精确
        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;

        // 平滑鼠标移动
        const smoothingFactor = 0.8;
        mouseSmoothRef.current.x = mouseSmoothRef.current.x * smoothingFactor + deltaX * (1 - smoothingFactor);
        mouseSmoothRef.current.y = mouseSmoothRef.current.y * smoothingFactor + deltaY * (1 - smoothingFactor);

        // 调整灵敏度 - 更平滑的控制
        const sensitivity = 0.0015;

        // 使用方向向量系统，避免局部坐标系问题
        const yMultiplier = mouseInvertY.current ? -1 : 1;

        // 更新旋转角度
        cameraRotationRef.current.y -= mouseSmoothRef.current.x * sensitivity;
        cameraRotationRef.current.x -= mouseSmoothRef.current.y * sensitivity * yMultiplier;

        // 限制垂直旋转角度
        const maxPitch = Math.PI / 2.2; // 约82度
        const minPitch = -Math.PI / 2.2; // 约-82度
        cameraRotationRef.current.x = Math.max(minPitch, Math.min(maxPitch, cameraRotationRef.current.x));

        // 使用方向向量重新计算相机朝向
        const direction = new THREE.Vector3(0, 0, -1);
        const euler = new THREE.Euler(
          cameraRotationRef.current.x,
          cameraRotationRef.current.y,
          0,
          'YXZ' // 使用YXZ顺序，先Y后X，避免万向锁
        );
        direction.applyEuler(euler);

        // 设置相机朝向
        const target = new THREE.Vector3();
        target.copy(camera.position).add(direction);
        camera.lookAt(target);

        // 确保相机up向量正确
        camera.up.set(0, 1, 0);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!isPointerLockedRef.current) {
        // 如果指针未锁定，强制请求指针锁定
        renderer.domElement.requestPointerLock().catch(() => {
          // 如果指针锁定失败，显示提示
          alert('请点击"允许"来锁定鼠标指针，以获得最佳体验');
        });
      } else {
        // 如果指针已锁定，从屏幕中央处理物体点击
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        handleObjectClick(centerX, centerY);
      }
    };

    const handlePointerLockChange = () => {
      isPointerLockedRef.current = document.pointerLockElement === renderer.domElement;

      // 根据锁定状态设置鼠标光标样式
      if (isPointerLockedRef.current) {
        document.body.style.cursor = 'none'; // 隐藏鼠标光标
        if (mountRef.current) {
          mountRef.current.style.cursor = 'none';
        }
        // 重置平滑值
        mouseSmoothRef.current = { x: 0, y: 0 };
        // 重置旋转角度
        cameraRotationRef.current = { x: 0, y: 0 };
        // 重置方向向量
        cameraDirectionRef.current.set(0, 0, -1);
      } else {
        document.body.style.cursor = 'default'; // 显示默认光标
        if (mountRef.current) {
          mountRef.current.style.cursor = 'default';
        }
        // 重置平滑值
        mouseSmoothRef.current = { x: 0, y: 0 };
        // 重置旋转角度
        cameraRotationRef.current = { x: 0, y: 0 };
        // 重置方向向量
        cameraDirectionRef.current.set(0, 0, -1);
      }
    };

    // 移动函数
    const moveCamera = () => {
      const speed = 0.1;
      const direction = new THREE.Vector3();

      // 获取相机的前进方向
      camera.getWorldDirection(direction);

      // 计算右方向
      const right = new THREE.Vector3();
      right.crossVectors(camera.up, direction).normalize();

      if (moveStateRef.current.forward) {
        camera.position.add(direction.multiplyScalar(speed));
      }
      if (moveStateRef.current.backward) {
        camera.position.add(direction.multiplyScalar(-speed));
      }
      if (moveStateRef.current.left) {
        camera.position.add(right.multiplyScalar(speed));
      }
      if (moveStateRef.current.right) {
        camera.position.add(right.multiplyScalar(-speed));
      }
      if (moveStateRef.current.up) {
        camera.position.y += speed;
      }
      if (moveStateRef.current.down) {
        camera.position.y -= speed;
      }

      // 限制相机在房间内
      const roomBounds = {
        x: { min: -roomWidth / 2 + 0.5, max: roomWidth / 2 - 0.5 },
        y: { min: -roomHeight / 2 + 0.5, max: roomHeight / 2 - 0.5 },
        z: { min: -roomDepth / 2 + 0.5, max: roomDepth / 2 - 0.5 }
      };

      camera.position.x = Math.max(roomBounds.x.min, Math.min(roomBounds.x.max, camera.position.x));
      camera.position.y = Math.max(roomBounds.y.min, Math.min(roomBounds.y.max, camera.position.y));
      camera.position.z = Math.max(roomBounds.z.min, Math.min(roomBounds.z.max, camera.position.z));
    };

    // 更新相机旋转 - 现在由鼠标移动事件直接处理
    const updateCameraRotation = () => {
      // 相机旋转现在由handleMouseMove中的lookAt方法处理
      // 这里只确保相机up向量正确
      camera.up.set(0, 1, 0);
    };

    // 事件监听器
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('pointerlockerror', () => {
      console.log('指针锁定失败');
    });

    // 渲染循环
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      moveCamera();
      updateCameraRotation();

      renderer.render(scene, camera);
    };
    animate();

    // 处理窗口大小变化
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // 物体创建完毕后，添加坐标轴辅助线
    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.visible = false;
    scene.add(axesHelper);
    axesHelperRef.current = axesHelper;

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('pointerlockerror', () => { });

      // 恢复鼠标光标
      document.body.style.cursor = 'default';
      if (mountRef.current) {
        mountRef.current.style.cursor = 'default';
      }

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // 5. useEffect监听showLabels，控制visible
  useEffect(() => {
    Object.entries({
      floor: 'floorLabel',
      ceiling: 'ceilingLabel',
      left: 'leftLabel',
      right: 'rightLabel',
      back: 'backLabel',
      axes: 'axesHelper',
    }).forEach(([key, refKey]) => {
      if (key === 'axes') {
        if (axesHelperRef.current) axesHelperRef.current.visible = showLabels.axes;
      } else {
        if (labelSpritesRef.current[refKey]) {
          console.log('labelSpritesRef.current[refKey]', labelSpritesRef.current[refKey])
          labelSpritesRef.current[refKey].visible = showLabels[key as keyof typeof showLabels];
        }
      }
    });
  }, [showLabels]);

  // 6. 页面右上角渲染按钮
  return (
    <div
      ref={mountRef}
      className='home-main'
      style={{
        width: '100%',
        height: '100%',
        position: 'relative'
      }}
    >
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
        <div>点击屏幕进入FPS模式（鼠标将被锁定）</div>
        <div>屏幕中央十字准星瞄准物品</div>
        <div>点击选择当前瞄准的物品</div>
        <div>WASD移动，空格/Shift上下</div>
        <div>SC退出FPS模式，I键切换Y轴反转</div>
        <div>提示：请允许浏览器锁定鼠标指针</div>
      </div>

      {/* 固定在屏幕中央的十字准星 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '20px',
        height: '20px',
        pointerEvents: 'none',
        zIndex: 1001
      }}>
        {/* 十字准星 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '2px',
          height: '20px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '1px'
        }}></div>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '20px',
          height: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '1px'
        }}></div>

        {/* 中心点 */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '4px',
          height: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '50%'
        }}></div>
      </div>
      {/* 7. 不新增标签，只控制初始化自带的标签和坐标轴 */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 9999, background: '#222', color: '#fff', padding: 10, borderRadius: 8 }}>
        <div>标签显隐：</div>
        <button onClick={() => handleShowLabelButton('floor')}>地板</button>
        <button onClick={() => handleShowLabelButton('ceiling')}>天花板</button>
        <button onClick={() => handleShowLabelButton('left')}>左墙</button>
        <button onClick={() => handleShowLabelButton('right')}>右墙</button>
        <button onClick={() => handleShowLabelButton('back')}>后墙</button>
        <button onClick={() => handleShowLabelButton('axes')}>坐标轴</button>
      </div>
    </div>
  );
};

export default ThreeScene; 