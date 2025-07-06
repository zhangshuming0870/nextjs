# Next.js 项目部署指南

## 构建状态 ✅
项目已成功构建，生成的文件位于 `.next` 目录中。

## 部署方案

### 1. Vercel 部署（推荐）

Vercel 是 Next.js 的官方部署平台，提供最佳性能：

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署到 Vercel
vercel

# 或直接部署到生产环境
vercel --prod
```

### 2. 传统服务器部署

#### 2.1 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "nextjs-app" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 2.2 使用 Docker 部署

创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

构建和运行：
```bash
docker build -t nextjs-app .
docker run -p 3000:3000 nextjs-app
```

### 3. 静态导出部署

如果需要静态部署，可以修改 `next.config.ts`：

```typescript
const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // ... 其他配置
};
```

然后构建：
```bash
npm run build
```

静态文件将生成在 `out` 目录中，可以部署到任何静态托管服务。

## 环境变量配置

创建 `.env.local` 文件（如果还没有）：

```env
NODE_ENV=production
# 添加其他必要的环境变量
```

## 性能优化建议

1. **图片优化**：使用 Next.js 的 Image 组件
2. **代码分割**：利用 Next.js 的自动代码分割
3. **缓存策略**：配置适当的缓存头
4. **CDN**：使用 CDN 加速静态资源

## 监控和维护

1. **日志监控**：配置应用日志
2. **性能监控**：使用 Vercel Analytics 或其他监控工具
3. **错误追踪**：集成 Sentry 等错误追踪服务

## 当前构建信息

- 构建时间：约 2 秒
- 页面数量：5 个静态页面
- 总 JS 大小：101 kB
- 支持的路由：/, /3D, /blog, /projects

## 下一步

1. 选择适合的部署方案
2. 配置域名和 SSL 证书
3. 设置 CI/CD 流水线
4. 配置监控和日志 