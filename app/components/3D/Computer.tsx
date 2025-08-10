import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export interface ComputerProps {
  scene: THREE.Scene;
  selectableObjects: React.MutableRefObject<THREE.Object3D[]>;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  initialText?: string;
  onSelect?: (screenMesh: THREE.Mesh) => void;
  onInput?: (text: string) => void;
}

export interface ComputerRef {
  getScreenMesh: () => THREE.Mesh | null;
  setText: (text: string) => void;
  getText: () => string;
  enterInputMode: () => void;
  exitInputMode: () => void;
}

const DEFAULT_POSITION: [number, number, number] = [2.48, -1.05, 3.21];
const DEFAULT_ROTATION: [number, number, number] = [0, -Math.PI * 0.9, 0];
const DEFAULT_SCALE: [number, number, number] = [0.25, 0.25, 0.25];
const DEFAULT_TEXT = 'Terminal Ready\n> ';

const Computer = forwardRef<ComputerRef, ComputerProps>((props, ref) => {
  const {
    scene,
    selectableObjects,
    position,
    rotation,
    scale = DEFAULT_SCALE,
    initialText = DEFAULT_TEXT,
    onSelect,
    onInput,
  } = props;

  // 状态管理
  const [selectedComputer, setSelectedComputer] = useState<THREE.Mesh | null>(null);
  const [screenText, setScreenText] = useState(initialText);
  const [isTyping, setIsTyping] = useState(false);

  // 引用
  const screenMeshRef = useRef<THREE.Mesh | null>(null);
  const dpr = window.devicePixelRatio || 1;
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const screenTexture = useRef<THREE.CanvasTexture | null>(null);
  const maxLines = 25;

  // 初始化canvas和texture
  useEffect(() => {
    const c = document.createElement('canvas');
    c.width = 1024 * dpr;
    c.height = 1024 * dpr;
    const context = c.getContext('2d')!;
    context.scale(dpr, dpr);
    canvas.current = c;
    ctx.current = context;
    const tex = new THREE.CanvasTexture(c);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    screenTexture.current = tex;
  }, [dpr]);

  // 屏幕渲染逻辑
  const updateDisplay = (text: string) => {
    if (!ctx.current || !canvas.current || !screenTexture.current) return;
    const context = ctx.current;
    const c = canvas.current;
    const dpr = window.devicePixelRatio || 1;
    
    // 清空画布
    context.fillStyle = '#000000';
    context.fillRect(0, 0, c.width / dpr, c.height / dpr);
    
    // 设置文字样式
    context.fillStyle = '#00ff00';
    context.font = '20px monospace';
    context.textAlign = 'left';
    context.textBaseline = 'top';
    
    // 自动换行处理
    const maxWidth = (c.width / dpr) - 40;
    const rawLines = text.split('\n');
    const wrappedLines: string[] = [];
    
    for (let rawLine of rawLines) {
      let current = '';
      for (let char of rawLine) {
        const testLine = current + char;
        if (context.measureText(testLine).width > maxWidth) {
          wrappedLines.push(current);
          current = char;
        } else {
          current = testLine;
        }
      }
      wrappedLines.push(current);
    }
    
    const lineHeight = 25;
    const startIndex = Math.max(0, wrappedLines.length - maxLines);
    const displayLines = wrappedLines.slice(startIndex);
    
    displayLines.forEach((line, index) => {
      const y = 20 + index * lineHeight;
      context.fillText(line, 20, y);
    });
    
    if (wrappedLines.length > maxLines) {
      context.fillStyle = '#ffff00';
      context.fillText(`... (显示最后 ${maxLines} 行，共 ${wrappedLines.length} 行)`, 20, 20 + maxLines * lineHeight);
    }
    
    screenTexture.current.needsUpdate = true;
  };

  // 监听屏幕文字变化，更新显示
  useEffect(() => {
    if (selectedComputer && selectedComputer.userData.updateDisplay) {
      selectedComputer.userData.updateDisplay(screenText);
    }
  }, [screenText, selectedComputer]);

  // 专门的输入事件监听器
  useEffect(() => {
    const handleInputKeyDown = (event: KeyboardEvent) => {
      if (isTyping && selectedComputer) {
        event.preventDefault();
        event.stopPropagation();
        
        if (event.code === 'Enter') {
          setScreenText(prev => prev + '\n> ');
        } else if (event.code === 'Backspace') {
          setScreenText(prev => prev.slice(0, -1));
        } else if (event.code === 'Escape') {
          setIsTyping(false);
          setSelectedComputer(null);
        } else if (event.key && event.key.length === 1) {
          setScreenText(prev => prev + event.key);
        }
      }
    };

    if (isTyping) {
      document.addEventListener('keydown', handleInputKeyDown, true);
    }

    return () => {
      if (isTyping) {
        document.removeEventListener('keydown', handleInputKeyDown, true);
      }
    };
  }, [isTyping, selectedComputer]);

  // 电脑模型和屏幕创建
  useEffect(() => {
    if (!scene) return;
    
    // 加载显示器模型
    const loader = new GLTFLoader();
    loader.load(
      '/3dRoom/computer_monitor_lowpoly_model/scene.gltf',
      (gltf) => {
        const monitor = gltf.scene;
        monitor.position.set(...position!);
        monitor.rotation.set(...rotation!);
        monitor.scale.set(...scale);
        monitor.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.userData = { name: '电脑显示器', nameEn: 'computerMonitor' };
          }
        });
        scene.add(monitor);
        selectableObjects.current.push(monitor);
      }
    );
    
    // 创建屏幕
    if (!screenTexture.current) return;
    const screenGeometry = new THREE.PlaneGeometry(0.95, 0.48);
    const screenMaterial = new THREE.MeshBasicMaterial({
      map: screenTexture.current,
      side: THREE.DoubleSide,
      transparent: false,
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(...position!);
    screen.position.y += 0.363; // 屏幕高于底座
    screen.position.z += 0.05; // 稍微前移
    screen.position.x += 0.01; // 稍微前移
    screen.rotation.set(...rotation!);
    screen.userData = {
      name: '电脑屏幕',
      nameEn: 'computerScreen',
      updateDisplay,
      getText: () => screenText,
      setText: (t: string) => {
        setScreenText(t);
        updateDisplay(t);
      },
      onSelect: () => {
        setSelectedComputer(screen);
        setIsTyping(true);
        setScreenText('Terminal Ready\n> ');
        onSelect?.(screen);
      },
    };
    screenMeshRef.current = screen;
    scene.add(screen);
    selectableObjects.current.push(screen);
    
    // 初始渲染
    updateDisplay(screenText);
    
    return () => {
      scene.remove(screen);
      if (screenMaterial.map) (screenMaterial.map as any).dispose?.();
      screenMaterial.dispose();
      screenGeometry.dispose();
    };
  }, [scene, selectableObjects, position, rotation, scale, screenTexture.current]);

  // 提供外部方法
  useImperativeHandle(ref, () => ({
    getScreenMesh: () => screenMeshRef.current,
    setText: (text: string) => {
      setScreenText(text);
      updateDisplay(text);
    },
    getText: () => screenText,
    enterInputMode: () => {
      if (screenMeshRef.current) {
        setSelectedComputer(screenMeshRef.current);
        setIsTyping(true);
        setScreenText('Terminal Ready\n> ');
      }
    },
    exitInputMode: () => {
      setIsTyping(false);
      setSelectedComputer(null);
    },
  }), [screenText]);




  return (
    <>
      {isTyping && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0, 0, 0, 0.7)',
          color: '#00ff00',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 1000
        }}>
          电脑输入模式 - 直接输入文字，Enter换行，ESC退出
        </div>
      )}
    </>
  );
});

export default Computer; 