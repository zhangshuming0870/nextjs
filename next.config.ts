import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 配置端口为82
  env: {
    PORT: '80',
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // 配置静态资源
    config.module.rules.push({
      test: /\.(png|gif|jpg|jpeg|svg|xml|json)$/,
      type: 'asset/resource',
    });

    return config;
  },
};

export default nextConfig;
