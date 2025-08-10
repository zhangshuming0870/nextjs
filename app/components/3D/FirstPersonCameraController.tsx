import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';

// 类型定义
interface Bounds {
    x: { min: number; max: number };
    y: { min: number; max: number };
    z: { min: number; max: number };
}

interface FirstPersonCameraControllerProps {
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    scene?: THREE.Scene | null;
    bounds?: Bounds;
    showCrosshair?: boolean;
    moveSpeed?: number;
    mouseSensitivity?: number;
    smoothingFactor?: number;
    onObjectSelect?: (object: THREE.Object3D, point: THREE.Vector3) => void;
}

interface MoveState {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
}

interface MouseState {
    x: number;
    y: number;
}

interface CameraRotation {
    x: number;
    y: number;
}

// 常量配置
const DEFAULT_CONFIG = {
    moveSpeed: 0.1,
    mouseSensitivity: 0.0015,
    smoothingFactor: 0.8,
    maxPitch: Math.PI / 2.2,
    minPitch: -Math.PI / 2.2,
} as const;

// 键盘映射
const KEY_MAPPING = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'left',
    KeyD: 'right',
    Space: 'up',
    ShiftLeft: 'down',
} as const;

// 十字光标组件
const Crosshair: React.FC<{ isHovering: boolean }> = ({ isHovering }) => (
    <div 
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            pointerEvents: 'none',
            zIndex: 99999
        }}
    >
        {/* 垂直线 */}
        <div 
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '2px',
                height: '20px',
                backgroundColor: isHovering ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '1px',
                transition: 'background-color 0.2s ease'
            }}
        />
        {/* 水平线 */}
        <div 
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '20px',
                height: '2px',
                backgroundColor: isHovering ? 'rgba(255, 255, 0, 0.9)' : 'rgba(255, 255, 255, 0.8)',
                borderRadius: '1px',
                transition: 'background-color 0.2s ease'
            }}
        />
        {/* 中心点 */}
        <div 
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '4px',
                height: '4px',
                backgroundColor: isHovering ? 'rgba(255, 255, 0, 1)' : 'rgba(255, 255, 255, 0.9)',
                borderRadius: '50%',
                transition: 'background-color 0.2s ease'
            }}
        />
    </div>
);

const FirstPersonCameraController: React.FC<FirstPersonCameraControllerProps> = ({
    camera,
    renderer,
    scene,
    bounds,
    showCrosshair = true,
    moveSpeed = DEFAULT_CONFIG.moveSpeed,
    mouseSensitivity = DEFAULT_CONFIG.mouseSensitivity,
    smoothingFactor = DEFAULT_CONFIG.smoothingFactor,
    onObjectSelect,
}) => {
    const [isPointerLocked, setIsPointerLocked] = useState(false);
    const [isHoveringObject, setIsHoveringObject] = useState(false);
    
    // 状态引用
    const moveState = useRef<MoveState>({
        forward: false,
        backward: false,
        left: false,
        right: false,
        up: false,
        down: false,
    });
    
    const mouseSmooth = useRef<MouseState>({ x: 0, y: 0 });
    const mouseInvertY = useRef(false);
    const cameraRotation = useRef<CameraRotation>({ x: 0, y: 0 });
    const animationId = useRef<number | undefined>(undefined);
    const lastRaycastTime = useRef(0);
    
    // 射线检测相关
    const raycaster = useRef(new THREE.Raycaster());
    const mouse = useRef(new THREE.Vector2());
    const highlightedObject = useRef<THREE.Object3D | null>(null);
    const originalColors = useRef<Map<THREE.Object3D, THREE.Color>>(new Map());

    // 射线检测函数
    const performRaycast = useCallback(() => {
        if (!camera || !scene) return null;

        try {
            // 设置射线起点和方向（从相机中心发出）
            raycaster.current.setFromCamera(mouse.current, camera);
            
            // 执行射线检测
            const intersects = raycaster.current.intersectObjects(scene.children, true);
            
            // 过滤出可交互的物体
            const interactiveIntersects = intersects.filter(intersect => 
                intersect.object instanceof THREE.Mesh && 
                intersect.object.material && 
                !(intersect.object instanceof THREE.AxesHelper) &&
                intersect.object.visible
            );
            
            // 处理高亮
            const currentObject = interactiveIntersects.length > 0 ? interactiveIntersects[0].object : null;
            
            // 清除之前的高亮
            if (highlightedObject.current && highlightedObject.current !== currentObject) {
                const mesh = highlightedObject.current as THREE.Mesh;
                if (originalColors.current.has(highlightedObject.current)) {
                    const originalColor = originalColors.current.get(highlightedObject.current)!;
                    if (Array.isArray(mesh.material)) {
                        const material = mesh.material[0] as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    } else {
                        const material = mesh.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    }
                    originalColors.current.delete(highlightedObject.current);
                }
                highlightedObject.current = null;
            }
            
            // 设置新的高亮
            if (currentObject && currentObject !== highlightedObject.current) {
                const mesh = currentObject as THREE.Mesh;
                if (!originalColors.current.has(currentObject)) {
                    const currentMaterial = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
                    const material = currentMaterial as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                    if ('color' in material && material.color) {
                        // 保存原始颜色
                        originalColors.current.set(currentObject, material.color.clone());
                        // 让颜色变亮
                        const brightColor = material.color.clone().multiplyScalar(1.5);
                        if (Array.isArray(mesh.material)) {
                            const meshMaterial = mesh.material[0] as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                            if ('color' in meshMaterial && meshMaterial.color) {
                                meshMaterial.color.copy(brightColor);
                            }
                        } else {
                            const meshMaterial = mesh.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                            if ('color' in meshMaterial && meshMaterial.color) {
                                meshMaterial.color.copy(brightColor);
                            }
                        }
                    }
                }
                highlightedObject.current = currentObject;
            }
            
            // 更新悬停状态
            setIsHoveringObject(interactiveIntersects.length > 0);
            
            return interactiveIntersects.length > 0 ? interactiveIntersects[0] : null;
        } catch (error) {
            console.warn('Raycast failed:', error);
            return null;
        }
    }, [camera, scene]);

    // 键盘事件处理
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        const key = event.code as keyof typeof KEY_MAPPING;
        if (key in KEY_MAPPING) {
            const direction = KEY_MAPPING[key];
            moveState.current[direction] = true;
        }
        
        // 特殊按键处理
        switch (event.code) {
            case 'Escape':
                if (document.pointerLockElement === renderer?.domElement) {
                    try {
                        document.exitPointerLock();
                    } catch (error) {
                        console.warn('Exit pointer lock failed:', error);
                    }
                }
                break;
            case 'KeyI':
                mouseInvertY.current = !mouseInvertY.current;
                break;
        }
    }, [renderer]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        const key = event.code as keyof typeof KEY_MAPPING;
        if (key in KEY_MAPPING) {
            const direction = KEY_MAPPING[key];
            moveState.current[direction] = false;
        }
    }, []);

    // 鼠标移动处理
    const handleMouseMove = useCallback((event: MouseEvent) => {
        if (!camera || !renderer || document.pointerLockElement !== renderer.domElement) return;

        const deltaX = event.movementX || 0;
        const deltaY = event.movementY || 0;

        // 平滑处理
        mouseSmooth.current.x = mouseSmooth.current.x * smoothingFactor + deltaX * (1 - smoothingFactor);
        mouseSmooth.current.y = mouseSmooth.current.y * smoothingFactor + deltaY * (1 - smoothingFactor);

        // 更新相机旋转
        const yMultiplier = mouseInvertY.current ? -1 : 1;
        cameraRotation.current.y -= mouseSmooth.current.x * mouseSensitivity;
        cameraRotation.current.x -= mouseSmooth.current.y * mouseSensitivity * yMultiplier;

        // 限制俯仰角度
        cameraRotation.current.x = Math.max(
            DEFAULT_CONFIG.minPitch, 
            Math.min(DEFAULT_CONFIG.maxPitch, cameraRotation.current.x)
        );

        // 应用旋转到相机
        const direction = new THREE.Vector3(0, 0, -1);
        const euler = new THREE.Euler(
            cameraRotation.current.x,
            cameraRotation.current.y,
            0,
            'YXZ'
        );
        direction.applyEuler(euler);
        
        const target = new THREE.Vector3();
        target.copy(camera.position).add(direction);
        camera.lookAt(target);
        camera.up.set(0, 1, 0);
        
        // 执行射线检测（节流，每16ms执行一次，约60fps）
        const now = performance.now();
        if (now - lastRaycastTime.current > 16) {
            performRaycast();
            lastRaycastTime.current = now;
        }
    }, [camera, renderer, mouseSensitivity, smoothingFactor, performRaycast]);

    // 鼠标点击处理
    const handleMouseClick = useCallback((event: MouseEvent) => {
        if (!camera || !renderer || document.pointerLockElement !== renderer.domElement) return;
        
        try {
            const intersect = performRaycast();
            if (intersect && onObjectSelect) {
                onObjectSelect(intersect.object, intersect.point);
            }
        } catch (error) {
            console.warn('Mouse click handling failed:', error);
        }
    }, [camera, renderer, performRaycast, onObjectSelect]);

    // 相机移动处理
    const moveCamera = useCallback(() => {
        if (!camera) return;

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();

        // 应用移动
        if (moveState.current.forward) {
            camera.position.add(direction.clone().multiplyScalar(moveSpeed));
        }
        if (moveState.current.backward) {
            camera.position.add(direction.clone().multiplyScalar(-moveSpeed));
        }
        if (moveState.current.left) {
            camera.position.add(right.clone().multiplyScalar(moveSpeed));
        }
        if (moveState.current.right) {
            camera.position.add(right.clone().multiplyScalar(-moveSpeed));
        }
        if (moveState.current.up) {
            camera.position.y += moveSpeed;
        }
        if (moveState.current.down) {
            camera.position.y -= moveSpeed;
        }

        // 边界限制
        if (bounds) {
            camera.position.x = Math.max(bounds.x.min, Math.min(bounds.x.max, camera.position.x));
            camera.position.y = Math.max(bounds.y.min, Math.min(bounds.y.max, camera.position.y));
            camera.position.z = Math.max(bounds.z.min, Math.min(bounds.z.max, camera.position.z));
        }
    }, [camera, moveSpeed, bounds]);

    // 指针锁定处理
    const handleClick = useCallback(() => {
        if (document.pointerLockElement !== renderer?.domElement) {
            renderer?.domElement.requestPointerLock().catch((error) => {
                console.warn('Pointer lock request failed:', error);
            });
        }
    }, [renderer]);

    const handlePointerLockChange = useCallback(() => {
        const locked = document.pointerLockElement === renderer?.domElement;
        setIsPointerLocked(locked);

        if (locked) {
            document.body.style.cursor = 'none';
            mouseSmooth.current = { x: 0, y: 0 };
            cameraRotation.current = { x: 0, y: 0 };
        } else {
            document.body.style.cursor = 'default';
            mouseSmooth.current = { x: 0, y: 0 };
            cameraRotation.current = { x: 0, y: 0 };
            
            // 清除高亮
            if (highlightedObject.current) {
                const mesh = highlightedObject.current as THREE.Mesh;
                if (originalColors.current.has(highlightedObject.current)) {
                    const originalColor = originalColors.current.get(highlightedObject.current)!;
                    if (Array.isArray(mesh.material)) {
                        const material = mesh.material[0] as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    } else {
                        const material = mesh.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    }
                    originalColors.current.delete(highlightedObject.current);
                }
                highlightedObject.current = null;
            }
            setIsHoveringObject(false);
        }
    }, [renderer]);

    // 动画循环
    const animate = useCallback(() => {
        moveCamera();
        animationId.current = requestAnimationFrame(animate);
    }, [moveCamera]);

    // 主效果
    useEffect(() => {
        if (!camera || !renderer) return;



        // 添加事件监听器
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('click', handleMouseClick);
        renderer.domElement.addEventListener('click', handleClick);
        document.addEventListener('pointerlockchange', handlePointerLockChange);
        document.addEventListener('pointerlockerror', () => {
            console.warn('Pointer lock failed');
        });

        // 启动动画循环
        animate();

        // 清理函数
        return () => {
            if (animationId.current) {
                cancelAnimationFrame(animationId.current);
            }
            
            // 清除高亮
            if (highlightedObject.current) {
                const mesh = highlightedObject.current as THREE.Mesh;
                if (originalColors.current.has(highlightedObject.current)) {
                    const originalColor = originalColors.current.get(highlightedObject.current)!;
                    if (Array.isArray(mesh.material)) {
                        const material = mesh.material[0] as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    } else {
                        const material = mesh.material as THREE.MeshBasicMaterial | THREE.MeshLambertMaterial | THREE.MeshPhongMaterial;
                        if ('color' in material && material.color) {
                            material.color.copy(originalColor);
                        }
                    }
                    originalColors.current.delete(highlightedObject.current);
                }
            }
            
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('click', handleMouseClick);
            renderer.domElement.removeEventListener('click', handleClick);
            document.removeEventListener('pointerlockchange', handlePointerLockChange);
            document.removeEventListener('pointerlockerror', () => {});
            
            document.body.style.cursor = 'default';
        };
    }, [camera, renderer, handleKeyDown, handleKeyUp, handleMouseMove, handleMouseClick, handleClick, handlePointerLockChange, animate]);

    // 渲染十字光标
    const shouldShowCrosshair = document.pointerLockElement === renderer?.domElement && showCrosshair;
    
    return shouldShowCrosshair ? <Crosshair isHovering={isHoveringObject} /> : null;
};

export default FirstPersonCameraController; 