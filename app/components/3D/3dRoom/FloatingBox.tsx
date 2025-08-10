import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';

interface FloatingBoxProps {
  scene: THREE.Scene;
  selectableObjects: React.MutableRefObject<THREE.Object3D[]>;
  showFloatingBox: boolean;
  setShowFloatingBox: (value: boolean | ((prev: boolean) => boolean)) => void;
}

// 全景图片配置
const PANORAMIC_CONFIG = [
  { png: '/panoramic/christmas_photo_studio_01.png', hdr: '/panoramic/christmas_photo_studio_01_4k.hdr' },
  { png: '/panoramic/climbing_gym.png', hdr: '/panoramic/climbing_gym_4k.hdr' },
  { png: '/panoramic/furstenstein.png', hdr: '/panoramic/furstenstein_4k.hdr' },
  { png: '/panoramic/kiara_8_sunset.png', hdr: '/panoramic/kiara_8_sunset_4k.hdr' },
  { png: '/panoramic/lakeside_sunrise.png', hdr: '/panoramic/lakeside_sunrise_4k.hdr' },
  { png: '/panoramic/moulton_station_train_tunnel_west.png', hdr: '/panoramic/moulton_station_train_tunnel_west_4k.hdr' },
  { png: '/panoramic/mpumalanga_veld_puresky.png', hdr: '/panoramic/mpumalanga_veld_puresky_4k.hdr' },
  { png: '/panoramic/poly_haven_studio.png', hdr: '/panoramic/poly_haven_studio_4k.hdr' },
  { png: '/panoramic/metro_noord.png', hdr: '/panoramic/metro_noord_4k.hdr' }
];

const FloatingBox: React.FC<FloatingBoxProps> = ({ 
  scene, 
  selectableObjects, 
  showFloatingBox, 
  setShowFloatingBox 
}) => {
  const floatingBoxRef = useRef<THREE.Mesh | null>(null);
  const imagePlanesRef = useRef<THREE.Mesh[]>([]);
  const router = useRouter();

  // 处理图片点击事件
  const handleImageClick = (cellIndex: number) => {
    const config = PANORAMIC_CONFIG[cellIndex];
    if (config) {
      router.push(`/3D/panoramicMap?hdr=${encodeURIComponent(config.hdr)}`);
    }
  };

  // 创建悬浮框和图片格子
  useEffect(() => {
    if (!scene) return;

    // 悬浮框尺寸
    const boxWidth = 3.2;
    const boxHeight = 2.2;
    const boxDepth = 0.02;

    // 创建悬浮透明框
    const floatingBoxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
    const floatingBoxMaterial = new THREE.MeshBasicMaterial({
      color: 0x084aff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const floatingBox = new THREE.Mesh(floatingBoxGeometry, floatingBoxMaterial);
    floatingBox.position.set(0, 0.5, 3.5);
    floatingBox.visible = false;
    floatingBox.userData = { 
      name: '悬浮透明框', 
      nameEn: 'floatingBox',
      isFloatingBox: true
    };
    
    scene.add(floatingBox);
    floatingBoxRef.current = floatingBox;

    // 创建九个图片格子
    const textureLoader = new THREE.TextureLoader();
    const imagePlanes: THREE.Mesh[] = [];
    
    // 基于悬浮框尺寸计算格子
    const gridSize = 3;
    const cellWidth = boxWidth / gridSize * 0.8;
    const cellHeight = boxHeight / gridSize * 0.8;
    const gap = 0.05;
    
    // 计算格子起始位置
    const startX = -cellWidth;
    const startY = cellHeight + 0.5;

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellIndex = row * gridSize + col;
        const config = PANORAMIC_CONFIG[cellIndex] || PANORAMIC_CONFIG[PANORAMIC_CONFIG.length - 1];
        
        const planeGeometry = new THREE.PlaneGeometry(cellWidth, cellHeight);
        const texture = textureLoader.load(config.png);
        
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const planeMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 1.0,
          side: THREE.DoubleSide
        });
        
        const imagePlane = new THREE.Mesh(planeGeometry, planeMaterial);
        
        // 计算位置
        const x = startX + col * (cellWidth + gap);
        const y = startY - row * (cellHeight + gap);
        
        imagePlane.position.set(x, y, 3.5 + boxDepth / 2 - 0.03);
        imagePlane.visible = false;
        
        imagePlane.userData = {
          name: `图片格子_${row}_${col}`,
          nameEn: `imageCell_${row}_${col}`,
          isImageCell: true,
          cellIndex,
          onClick: () => handleImageClick(cellIndex)
        };
        
        scene.add(imagePlane);
        imagePlanes.push(imagePlane);
      }
    }
    
    imagePlanesRef.current = imagePlanes;

    // 清理函数
    return () => {
      if (floatingBoxRef.current) {
        scene.remove(floatingBoxRef.current);
        floatingBoxRef.current = null;
      }
      
      imagePlanesRef.current.forEach(plane => {
        scene.remove(plane);
        if (plane.geometry) plane.geometry.dispose();
        if (plane.material) {
          if (Array.isArray(plane.material)) {
            plane.material.forEach(mat => mat.dispose());
          } else {
            plane.material.dispose();
          }
        }
      });
      imagePlanesRef.current = [];
    };
      }, [scene, selectableObjects, router]);

  // 监听悬浮框显示状态变化
  useEffect(() => {
    if (floatingBoxRef.current) {
      floatingBoxRef.current.visible = showFloatingBox;
    }
    
    imagePlanesRef.current.forEach(plane => {
      plane.visible = showFloatingBox;
    });
  }, [showFloatingBox]);

  return null;
};

export default FloatingBox; 