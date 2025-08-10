import * as THREE from 'three';

/**
 * 创建带xyz标签的坐标轴辅助线
 * @param size 坐标轴长度，默认2
 * @returns THREE.Group，包含AxesHelper和xyz标签
 */
export function createAxesHelper(size: number = 2): THREE.Group {
  const group = new THREE.Group();
  const axesHelper = new THREE.AxesHelper(size);
  group.add(axesHelper);
  
  // 默认设置为不可见
  group.visible = false;

  // 创建标签Sprite的工具函数
  function createLabelSprite(text: string, color: string = '#fff'): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1); // 可根据需要调整
    return sprite;
  }

  // X轴标签
  const xLabel = createLabelSprite('X', '#ff5050');
  xLabel.position.set(size, 0, 0);
  group.add(xLabel);

  // Y轴标签
  const yLabel = createLabelSprite('Y', '#50ff50');
  yLabel.position.set(0, size, 0);
  group.add(yLabel);

  // Z轴标签
  const zLabel = createLabelSprite('Z', '#5090ff');
  zLabel.position.set(0, 0, size);
  group.add(zLabel);

  group.userData = {
    name: '坐标轴',
    nameEn: 'axesHelper',
    isAxesHelper: true,
    visible: false
  };
  
  return group;
}

/**
 * 切换坐标轴辅助线的显示状态
 * @param scene 场景对象
 * @param visible 可选的显示状态，如果不提供则切换当前状态
 */
export function toggleAxesHelper(scene: THREE.Scene, visible?: boolean): void {
  scene.traverse((object) => {
    if (object.userData && object.userData.isAxesHelper) {
      if (visible !== undefined) {
        object.visible = visible;
        object.userData.visible = visible;
      } else {
        object.visible = !object.visible;
        object.userData.visible = object.visible;
      }
    }
  });
}

/**
 * 设置坐标轴辅助线的显示状态
 * @param scene 场景对象
 * @param visible 显示状态
 */
export function setAxesHelperVisible(scene: THREE.Scene, visible: boolean): void {
  toggleAxesHelper(scene, visible);
}

/**
 * 获取坐标轴辅助线的当前显示状态
 * @param scene 场景对象
 * @returns 当前显示状态
 */
export function getAxesHelperVisible(scene: THREE.Scene): boolean {
  let visible = true;
  scene.traverse((object) => {
    if (object.userData && object.userData.isAxesHelper) {
      visible = object.visible;
      return;
    }
  });
  return visible;
} 