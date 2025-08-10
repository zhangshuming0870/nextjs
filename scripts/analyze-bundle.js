#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 开始分析Next.js打包结果...\n');

// 设置环境变量
process.env.ANALYZE = 'true';

try {
  // 清理之前的构建
  console.log('🧹 清理之前的构建...');
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  
  // 构建项目
  console.log('🏗️  开始构建项目...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 检查构建结果
  console.log('\n📊 构建完成！检查结果...');
  
  if (fs.existsSync('.next')) {
    const buildDir = '.next';
    const staticDir = path.join(buildDir, 'static');
    
    if (fs.existsSync(staticDir)) {
      const jsDir = path.join(staticDir, 'chunks');
      const cssDir = path.join(staticDir, 'css');
      
      console.log('\n📁 构建输出结构:');
      console.log(`   📂 .next/`);
      console.log(`   📂 .next/static/`);
      
      if (fs.existsSync(jsDir)) {
        const jsFiles = fs.readdirSync(jsDir);
        console.log(`   📂 .next/static/chunks/ (${jsFiles.length} 个JS文件)`);
        jsFiles.forEach(file => {
          const filePath = path.join(jsDir, file);
          const stats = fs.statSync(filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          console.log(`      📄 ${file} (${sizeKB} KB)`);
        });
      }
      
      if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir);
        console.log(`   📂 .next/static/css/ (${cssFiles.length} 个CSS文件)`);
        cssFiles.forEach(file => {
          const filePath = path.join(cssDir, file);
          const stats = fs.statSync(filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          console.log(`      📄 ${file} (${sizeKB} KB)`);
        });
      }
    }
  }
  
  // 检查bundle分析报告
  const reportPath = path.join(process.cwd(), 'bundle-report.html');
  if (fs.existsSync(reportPath)) {
    console.log('\n📈 Bundle分析报告已生成:');
    console.log(`   📄 ${reportPath}`);
    console.log('   在浏览器中打开此文件查看详细的打包分析');
  }
  
  console.log('\n✅ 分析完成！');
  console.log('\n💡 优化建议:');
  console.log('   1. 检查bundle-report.html了解详细的包大小分布');
  console.log('   2. 查看是否有重复的依赖包');
  console.log('   3. 检查Three.js相关代码是否被正确分割');
  console.log('   4. 确认静态资源是否正确压缩');
  
} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  process.exit(1);
}
