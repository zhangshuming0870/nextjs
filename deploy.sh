#!/bin/bash

# 部署脚本
echo "🚀 开始打包 Next.js 项目..."

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
sudo rm -rf .next

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建项目
echo "🔨 构建项目..."
sudo npm run build

# 创建部署包
echo "📦 创建部署包..."
DEPLOY_DIR="deploy-$(date +%Y%m%d-%H%M%S)"
mkdir -p $DEPLOY_DIR

# 复制必要文件
echo "📋 复制必要文件..."
cp -r .next $DEPLOY_DIR/
cp -r public $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp next.config.ts $DEPLOY_DIR/
cp tsconfig.json $DEPLOY_DIR/

# 创建启动脚本
cat > $DEPLOY_DIR/start.sh << 'EOF'
#!/bin/bash
echo "🚀 启动 Next.js 应用..."
npm install --production
npm start
EOF

chmod +x $DEPLOY_DIR/start.sh

# 创建 Dockerfile
cat > $DEPLOY_DIR/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用文件
COPY . .

# 暴露端口
EXPOSE 82

# 启动应用
CMD ["npm", "start"]
EOF

# 创建 docker-compose.yml
cat > $DEPLOY_DIR/docker-compose.yml << 'EOF'
version: '3.8'
services:
  nextjs-app:
    build: .
    ports:
      - "82:82"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
EOF

# 创建 README
cat > $DEPLOY_DIR/README.md << 'EOF'
# Next.js 应用部署包

## 部署方式

### 方式一：直接运行
```bash
chmod +x start.sh
./start.sh
```

### 方式二：使用 Docker
```bash
docker-compose up -d
```

### 方式三：手动启动
```bash
npm install --production
npm start
```

## 访问地址
- 主页: http://localhost:82
- 3D 房间: http://localhost:82/3D
- 卧室: http://localhost:82/3D/bedroom
- 全景地图: http://localhost:82/3D/panoramicMap

## 构建信息
- Next.js 版本: 15.3.3
- React 版本: 19.0.0
- 构建时间: $(date)
EOF

# 创建压缩包
echo "📦 创建压缩包..."
tar -czf "${DEPLOY_DIR}.tar.gz" $DEPLOY_DIR

echo "✅ 部署包创建完成！"
echo "📁 部署目录: $DEPLOY_DIR"
echo "📦 压缩包: ${DEPLOY_DIR}.tar.gz"
echo ""
echo "🚀 部署方式："
echo "1. 解压: tar -xzf ${DEPLOY_DIR}.tar.gz"
echo "2. 进入目录: cd $DEPLOY_DIR"
echo "3. 启动: ./start.sh 或 docker-compose up -d" 