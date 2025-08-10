import React from 'react';
import * as THREE from 'three';

interface WorkbenchProps {
  scene: THREE.Scene;
  selectableObjects: React.MutableRefObject<THREE.Object3D[]>;
  height: number;
}

const Workbench: React.FC<WorkbenchProps> = ({ scene, selectableObjects, height }) => {
  // 创建工作台
  React.useEffect(() => {
    if (!scene) return;

    // 在桌子中间添加宽大的浅灰色矩形
    const whiteRectangle = new THREE.Mesh(
      new THREE.BoxGeometry(3, 0.02, 0.8),
      new THREE.MeshLambertMaterial({ color: 0x042586 }), // 浅灰色
    );
    whiteRectangle.position.set(0, -height / 2 + 0.78, 3.2);
    whiteRectangle.castShadow = true;
    whiteRectangle.receiveShadow = true;
    whiteRectangle.userData = { name: '浅灰色矩形', nameEn: 'lightGrayRectangle' };
    
    scene.add(whiteRectangle);
    selectableObjects.current.push(whiteRectangle);

    // 创建三个黄色方框，不重叠
    const boxes = [
      { x: -1.1, w: 0.6, name: '左方框' },
      { x: 0, w: 1.4, name: '中方框' },
      { x: 1.1, w: 0.6, name: '右方框' }
    ];
    
    boxes.forEach((box, i) => {
      // 创建方框边框（只显示边框线，无填充）
      const halfSize = box.w / 2;
      const halfDepth = 0.35; // 0.7 / 2
      const points = [
        new THREE.Vector3(-halfSize, 0, -halfDepth),
        new THREE.Vector3(halfSize, 0, -halfDepth),
        new THREE.Vector3(halfSize, 0, halfDepth),
        new THREE.Vector3(-halfSize, 0, halfDepth),
        new THREE.Vector3(-halfSize, 0, -halfDepth) // 闭合
      ];
      
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x43b2bf, // 青色边框
        linewidth: 1
      });
      
      const borderLine = new THREE.Line(lineGeometry, lineMaterial);
      borderLine.position.set(box.x, -height / 2 + 0.79, 3.2); // 降低边框位置，避免遮挡按钮
      borderLine.userData = { 
        name: box.name, 
        nameEn: `boxBorder${i + 1}`,
        isBorder: true
      };
      
      scene.add(borderLine);
      // 不将边框线条添加到可选择对象中，避免干扰按钮点击
      // selectableObjects.current.push(borderLine);
    });
    
    // 创建4×4按钮组
    const config = {
      rows: 4, cols: 4,
      spacing: 0.03, margin: 0.03,
      boxWidth: 1.4, boxDepth: 0.7
    };
    
    // 计算按钮尺寸
    const availableWidth = config.boxWidth - 2 * config.margin - (config.cols - 1) * config.spacing;
    const availableHeight = config.boxDepth - 2 * config.margin - (config.rows - 1) * config.spacing;
    const buttonWidth = availableWidth / config.cols;
    const buttonHeight = availableHeight / config.rows;
    
    // 创建按钮
    const buttonTexts = ['进入工作台', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-'];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        // 为按钮创建带文字的材质
        const buttonText = buttonTexts[row * config.cols + col];
        const buttonCanvas = document.createElement('canvas');
        const buttonContext = buttonCanvas.getContext('2d');
        
        if (buttonContext) {
          buttonCanvas.width = 1024;
          buttonCanvas.height = 1024;
          buttonContext.fillStyle = '#002a87';
          buttonContext.fillRect(0, 0, buttonCanvas.width, buttonCanvas.height);
          buttonContext.fillStyle = '#FFFFFF';
          buttonContext.font = 'bold 180px Arial';
          buttonContext.textAlign = 'center';
          buttonContext.textBaseline = 'middle';
          
          // 添加轻微文字阴影效果
          buttonContext.shadowColor = '#000000';
          buttonContext.shadowBlur = 1;
          buttonContext.shadowOffsetX = 1;
          buttonContext.shadowOffsetY = 1;
          
          // 旋转文字方向，使其在3D中正确显示
          buttonContext.save();
          buttonContext.translate(buttonCanvas.width / 2, buttonCanvas.height / 2);
          buttonContext.rotate(Math.PI); // 旋转180度
          buttonContext.fillText(buttonText, 0, 0);
          buttonContext.restore();
        }
        
        const buttonTexture = new THREE.CanvasTexture(buttonCanvas);
        
        // 创建多个材质，为不同面设置不同颜色
        const materials = [
          new THREE.MeshBasicMaterial({ color: 0x002a87, transparent: true }), // 右面
          new THREE.MeshBasicMaterial({ color: 0x002a87, transparent: true }), // 左面
          new THREE.MeshBasicMaterial({ map: buttonTexture, transparent: true }),// 顶面 - 黄色
          new THREE.MeshBasicMaterial({ map: buttonTexture, transparent: true }), // 底面 - 黄色
          new THREE.MeshBasicMaterial({ color: 0x002a87, transparent: true }), // 前面
          new THREE.MeshBasicMaterial({ color: 0x002a87, transparent: true })  // 后面
        ];
        
        const button = new THREE.Mesh(
          new THREE.BoxGeometry(buttonWidth, 0.03, buttonHeight),
          materials
        );
        
        // 计算位置（居中布局）
        const groupWidth = config.cols * buttonWidth + (config.cols - 1) * config.spacing;
        const groupHeight = config.rows * buttonHeight + (config.rows - 1) * config.spacing;
        const startX = 0 - groupWidth / 2 + buttonWidth / 2;
        const startZ = 3.2 - groupHeight / 2 + buttonHeight / 2;
        
        button.position.set(
          startX + col * (buttonWidth + config.spacing),
          -height / 2 + 0.81,
          startZ + row * (buttonHeight + config.spacing)
        );
        
        button.userData = { 
          name: `按钮${row * config.cols + col + 1}`, 
          nameEn: `button${row * config.cols + col + 1}`,
          isButton: true,
          row, col,
          onClick: () => console.log(`点击按钮 ${row + 1}-${col + 1}`)
        };
        
        scene.add(button);
        selectableObjects.current.push(button);
      }
    }

    // 清理函数
    return () => {
      // 清理工作台相关的3D对象
      // 注意：这里只清理主要对象，按钮和边框会在组件卸载时自动清理
    };
  }, [scene, selectableObjects, height]);

  return null; // 这个组件不渲染任何DOM元素
};

export default Workbench; 