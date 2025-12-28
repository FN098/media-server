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
};

export default nextConfig;
