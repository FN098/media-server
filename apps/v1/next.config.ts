import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ローカル画像（publicフォルダやローカルサーバー）に対する設定
    localPatterns: [
      {
        pathname: "/**", // すべてのパスを許可
      },
    ],
  },
  output: "standalone",
  cacheComponents: true,
};

export default nextConfig;
