'use client'

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface SimpleTeleportDoorConfig {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  width?: number;
  height?: number;
  color?: number;
  onTeleport?: () => void;
  openAngle?: number; // 开门时的旋转角度（弧度），默认90度
}

class SimpleTeleportDoorManager {
  private config: SimpleTeleportDoorConfig;
  private doorGroup: THREE.Group | null = null;
  private teleportBox: THREE.Mesh | null = null;

  private isOpen: boolean = false;
  private isAnimating: boolean = false;
  private onTeleport?: () => void;

  constructor(config: SimpleTeleportDoorConfig) {
    this.config = {
      width: 0.9,
      height: 2.0,
      color: 0x8B4513,
      rotation: new THREE.Euler(0, 0, 0),
      openAngle: Math.PI / 2, // 默认90度
      ...config
    };
    this.onTeleport = config.onTeleport;
  }

  private createDoorGeometry(): THREE.BoxGeometry {
    const { width, height } = this.config;
    const geometry = new THREE.BoxGeometry(0.05, height!, width!); // 减小厚度从0.15到0.05
    geometry.translate(0, 0, -width! / 2);
    return geometry;
  }

  private createDoorMaterial(): THREE.MeshLambertMaterial {
    return new THREE.MeshLambertMaterial({ color: this.config.color });
  }

  private createDoorGroup(): THREE.Group {
    const { width, position, rotation } = this.config;
    const group = new THREE.Group();
    const hingePosition = position.clone();

    const directionInfo = this.getDoorFrontDirection();
    if (directionInfo.direction === 'z') {
      hingePosition.x += width! / 2;
    } else {
      if (directionInfo.degrees >= 180) {
        hingePosition.z -= width! / 2;
      } else {
        hingePosition.z += width! / 2;
      }
    }
    group.position.copy(hingePosition);
    if (rotation) {
      group.rotation.copy(rotation);
    }
    return group;
  }

  private createDoorMesh(): THREE.Mesh {
    const geometry = this.createDoorGeometry();
    const material = this.createDoorMaterial();
    const door = new THREE.Mesh(geometry, material);
    door.castShadow = true;
    door.receiveShadow = true;
    door.userData = {
      name: '传送门',
      nameEn: 'door',
      isDoor: true
    };
    return door;
  }

  private createTeleportBox(): THREE.Mesh {
    const { width, height } = this.config;
    const teleportWidth = width! * 0.8;
    const teleportHeight = height! * 0.9;
    const geometry = new THREE.BoxGeometry(0.02, teleportHeight, teleportWidth);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.8
    });

    const teleportBox = new THREE.Mesh(geometry, material);
    teleportBox.userData = {
      name: '传送框',
      nameEn: 'teleportBox',
      isTeleport: true
    };
    teleportBox.visible = true;
    return teleportBox;
  }



  public createComponents() {
    const doorGroup = this.createDoorGroup();
    const door = this.createDoorMesh();
    doorGroup.add(door);
    this.doorGroup = doorGroup;

    this.teleportBox = this.createTeleportBox();

    if (this.teleportBox) {
      const { position, rotation } = this.config;
      const doorCenter = position.clone();
      if (rotation) {
        this.teleportBox.rotation.copy(rotation);
      }
      this.teleportBox.position.copy(doorCenter);
    }

    return {
      door: doorGroup,
      teleportBox: this.teleportBox
    };
  }

  public toggleDoor() {
    if (this.isAnimating) return;
    this.setDoorOpen(!this.isOpen);
  }

  public setDoorOpen(open: boolean) {
    if (this.isAnimating || this.isOpen === open) return;
    this.isOpen = open;
    this.animateDoor();
  }

  private animateDoor() {
    if (!this.doorGroup || this.isAnimating) return;
    this.isAnimating = true;
    const group = this.doorGroup;
    const duration = 0.6;
    const start = group.rotation.y;

    const doorDirection = this.config.rotation?.y || 0;
    const openDirection = doorDirection + (this.config.openAngle || Math.PI / 2);
    const target = this.isOpen ? openDirection : doorDirection;

    const startTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000;
      let t = Math.min(elapsed / duration, 1);
      t = t < 1 ? 1 - Math.pow(1 - t, 3) : 1;
      group.rotation.y = start + (target - start) * t;
      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        group.rotation.y = target;
        this.isAnimating = false;
      }
    };
    animate();
  }

  public checkTeleport(cameraPosition: THREE.Vector3): boolean {
    if (!this.teleportBox) return false;
    const distance = cameraPosition.distanceTo(this.teleportBox.position);
    if (distance < 1.0) {
      this.onTeleport?.();
      return true;
    }
    return false;
  }

  public getDoorState(): boolean {
    return this.isOpen;
  }

  public getDoor(): THREE.Group | null {
    return this.doorGroup;
  }

  public getTeleportBox(): THREE.Mesh | null {
    return this.teleportBox;
  }





  private getDoorFrontDirection(): { direction: 'x' | 'z'; degrees: number } {
    const { rotation } = this.config;
    if (!rotation) {
      return { direction: 'x', degrees: 0 };
    }

    const initialRotationY = rotation.y;
    const normalizedY = ((initialRotationY % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const degrees = Math.round(normalizedY * 180 / Math.PI);

    if (normalizedY < Math.PI / 4 || normalizedY > 7 * Math.PI / 4 ||
      (normalizedY > 3 * Math.PI / 4 && normalizedY < 5 * Math.PI / 4)) {
      return { direction: 'x', degrees };
    } else {
      return { direction: 'z', degrees };
    }
  }
}

const SimpleTeleportDoor: React.FC<{
  config: SimpleTeleportDoorConfig;
}> = ({ config }) => {
  const doorManagerRef = useRef<SimpleTeleportDoorManager | null>(null);

  useEffect(() => {
    doorManagerRef.current = new SimpleTeleportDoorManager(config);
  }, [config]);

  return null;
};

export default SimpleTeleportDoor;
export { SimpleTeleportDoorManager };
export type { SimpleTeleportDoorConfig }; 