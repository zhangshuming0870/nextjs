import * as THREE from 'three';

export interface TextureLoadOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  fallbackUrls?: string[];
  onProgress?: (progress: any) => void;
  onSuccess?: (texture: THREE.Texture) => void;
  onError?: (error: any) => void;
}

export class TextureLoaderUtil {
  private textureLoader: THREE.TextureLoader;
  private loadingTextures: Map<string, Promise<THREE.Texture>>;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.loadingTextures = new Map();
  }

  /**
   * 加载纹理，支持重试和降级
   */
  async loadTexture(url: string, options: TextureLoadOptions = {}): Promise<THREE.Texture> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      timeout = 30000,
      fallbackUrls = [],
      onProgress,
      onSuccess,
      onError
    } = options;

    // 检查是否已经在加载
    if (this.loadingTextures.has(url)) {
      return this.loadingTextures.get(url)!;
    }

    const loadPromise = this.loadTextureWithRetry(url, maxRetries, retryDelay, timeout, onProgress, onSuccess, onError);
    this.loadingTextures.set(url, loadPromise);

    try {
      const texture = await loadPromise;
      this.loadingTextures.delete(url);
      return texture;
    } catch (error) {
      this.loadingTextures.delete(url);
      
      // 尝试降级纹理
      if (fallbackUrls.length > 0) {
        console.log(`主纹理加载失败，尝试降级纹理: ${url}`);
        return this.loadFallbackTexture(fallbackUrls, options);
      }
      
      throw error;
    }
  }

  /**
   * 带重试的纹理加载
   */
  private loadTextureWithRetry(
    url: string,
    maxRetries: number,
    retryDelay: number,
    timeout: number,
    onProgress?: (progress: any) => void,
    onSuccess?: (texture: THREE.Texture) => void,
    onError?: (error: any) => void
  ): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
      let retryCount = 0;

      const attemptLoad = () => {
        const timeoutId = setTimeout(() => {
          reject(new Error(`纹理加载超时: ${url}`));
        }, timeout);

        this.textureLoader.load(
          url,
          (texture) => {
            clearTimeout(timeoutId);
            console.log(`纹理加载成功: ${url}`);
            
            // 设置纹理属性
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.generateMipmaps = false; // 大图片禁用mipmap
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            onSuccess?.(texture);
            resolve(texture);
          },
          (progress) => {
            onProgress?.(progress);
            console.log(`纹理加载进度: ${url}`, progress);
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error(`纹理加载失败: ${url}`, error);
            onError?.(error);

            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`重试加载纹理 (${retryCount}/${maxRetries}): ${url}`);
              setTimeout(attemptLoad, retryDelay * retryCount);
            } else {
              reject(new Error(`纹理加载失败，已重试${maxRetries}次: ${url}`));
            }
          }
        );
      };

      attemptLoad();
    });
  }

  /**
   * 加载降级纹理
   */
  private async loadFallbackTexture(fallbackUrls: string[], options: TextureLoadOptions): Promise<THREE.Texture> {
    for (const fallbackUrl of fallbackUrls) {
      try {
        console.log(`尝试加载降级纹理: ${fallbackUrl}`);
        const texture = await this.loadTextureWithRetry(
          fallbackUrl,
          options.maxRetries || 2,
          options.retryDelay || 500,
          options.timeout || 15000,
          options.onProgress,
          options.onSuccess,
          options.onError
        );
        console.log(`降级纹理加载成功: ${fallbackUrl}`);
        return texture;
      } catch (error) {
        console.error(`降级纹理加载失败: ${fallbackUrl}`, error);
        continue;
      }
    }

    throw new Error('所有纹理加载失败');
  }

  /**
   * 预加载纹理
   */
  preloadTexture(url: string, options: TextureLoadOptions = {}): Promise<THREE.Texture> {
    return this.loadTexture(url, options);
  }

  /**
   * 清理加载缓存
   */
  clearCache(): void {
    this.loadingTextures.clear();
  }

  /**
   * 检查纹理是否适合加载
   */
  static async checkTextureSize(url: string): Promise<{ width: number; height: number; size: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = img.width * img.height * 4; // 4 bytes per pixel (RGBA)
        resolve({
          width: img.width,
          height: img.height,
          size: size
        });
      };
      img.onerror = () => reject(new Error(`无法获取图片尺寸: ${url}`));
      img.src = url;
    });
  }

  /**
   * 建议的纹理尺寸限制
   */
  static readonly MAX_TEXTURE_SIZE = 4096; // 大多数GPU支持的最大纹理尺寸
  static readonly MAX_TEXTURE_MEMORY = 100 * 1024 * 1024; // 100MB内存限制
} 