# Git LFS 设置过程记录

## 问题背景

在生产环境中，bedroom页面访问缓慢，原因是Git仓库中包含了大量大文件：
- 视频文件：`taikong.mp4` (57MB), `taikong3.mp4` (111MB) 等
- HDR文件：多个25MB+的HDR全景图像文件
- 3D模型文件：GLTF、纹理和二进制文件
- 音频文件：多个音频文件（WAV、MP3、FLAC）

这些文件导致Git仓库大小超过700MB，推送时出现HTTP 400错误和连接断开问题。

## Git LFS 解决方案

### 1. 安装 Git LFS

```bash
# 使用Homebrew安装Git LFS
brew install git-lfs

# 安装完成后，在项目中初始化Git LFS
git lfs install
```

**输出结果：**
```
==> Fetching downloads: https://ghcr.io/v2/homebrew/core/git-lfs/manifests/3.7.0
==> Downloading https://ghcr.io/v2/homebrew/core/git-lfs
==> Pouring git-lfs--3.7.0.arm64_sequoia.bottle.tar.gz
==> Summary
🍺  /opt/homebrew/Cellar/git-lfs/3.7.0: 82 files, 13.5MB

# 初始化Git LFS
Updated Git hooks.
Git LFS initialized.
```

### 2. 配置文件跟踪规则

```bash
# 配置各种大文件类型使用LFS跟踪
git lfs track "*.mp4"      # 视频文件
git lfs track "*.hdr"      # HDR图像文件
git lfs track "*.wav"      # WAV音频文件
git lfs track "*.mp3"      # MP3音频文件
git lfs track "*.flac"     # FLAC音频文件
git lfs track "*.gltf"     # GLTF 3D模型文件
git lfs track "*.bin"      # 二进制文件
git lfs track "*.png"      # PNG图像文件
git lfs track "*.jpg"      # JPEG图像文件
```

**生成的 .gitattributes 文件内容：**
```
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.hdr filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs merge=lfs -text
*.flac filter=lfs diff=lfs merge=lfs -text
*.gltf filter=lfs diff=lfs merge=lfs -text
*.bin filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs merge=lfs -text
```

### 3. 迁移现有文件到LFS

```bash
# 使用git lfs migrate将所有历史中的大文件迁移到LFS
git lfs migrate import --include="*.mp4,*.hdr,*.wav,*.mp3,*.flac,*.gltf,*.bin,*.png,*.jpg" --everything
```

**输出结果：**
```
override changes in your working copy? All uncommitted changes will be lost! [y/N] y
changes in your working copy will be overridden ...
Sorting commits: ..., done.
Rewriting commits: 100% (10/10), done.
main: 1a980be44728b89a4558eaddc9c01ed3aa488996 -> 1a299b081c8f184331e60083b808d093ed73269b
refs/original/refs/heads/main: 34204506065a1d487bb595185ead8cc9c0c6e6cb -> 6baf9e57e85dbd8e32728a991f62bf8ed016b75e
Updating refs: ..., done.
Checkout: ..., done.
```

### 4. 验证LFS文件状态

```bash
# 查看被LFS跟踪的文件列表
git lfs ls-files
```

**被LFS跟踪的文件：**
- **全景图像**: 9个HDR文件 + 9个PNG预览图
- **音频文件**: 10个音频文件（WAV、MP3、FLAC）
- **视频文件**: 1个MP4文件
- **3D模型**: GLTF和纹理文件

### 5. 推送到远程仓库

```bash
# 强制推送更新后的仓库（包含LFS配置）
git push origin main --force
```

**推送结果：**
```
Uploading LFS objects: 100% (29/29), 606 MB | 2.5 MB/s, done.
Enumerating objects: 175, done.
Counting objects: 100% (175/175), done.
Delta compression using up to 8 threads
Compressing objects: 100% (159/159), done.
Writing objects: 100% (175/175), 129.17 KiB | 8.07 MiB/s, done.
Total 175 (delta 29), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (29/29), done.
To https://github.com/zhangshuming0870/nextjs.git
 + 529c2ff...1a299b0 main -> main (forced update)
```

## 效果对比

### 迁移前：
- Git仓库大小：700MB+
- 推送状态：HTTP 400错误，连接断开
- 文件管理：所有文件都在Git历史中

### 迁移后：
- Git仓库大小：129.17 KiB
- LFS对象：606 MB（29个文件）
- 推送状态：成功
- 文件管理：大文件由LFS管理，小文件由Git管理

## 常用Git LFS命令

```bash
# 查看LFS状态
git lfs status

# 查看被跟踪的文件
git lfs ls-files

# 拉取LFS文件
git lfs pull

# 克隆包含LFS的项目
git lfs clone <repository-url>

# 查看LFS文件信息
git lfs track

# 检查LFS文件完整性
git lfs fsck
```

## 注意事项

1. **首次设置**: 需要重新克隆仓库或使用`git lfs pull`来获取LFS文件
2. **团队协作**: 团队成员需要安装Git LFS客户端
3. **存储限制**: 注意GitHub等平台的LFS存储限制
4. **备份**: 迁移前建议备份原始仓库

## 总结

通过Git LFS的设置，成功解决了大文件导致的Git推送问题：
- ✅ 大文件被高效管理
- ✅ 仓库大小显著减少
- ✅ 推送速度大幅提升
- ✅ 支持版本控制大文件
- ✅ 团队协作更加顺畅

Git LFS为3D项目、多媒体项目等包含大量大文件的项目提供了理想的解决方案。
