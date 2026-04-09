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
  outputFileTracingIncludes: {
    // kuromoji の辞書ファイルをビルド成果物に含める設定
    "lib/utils/kana.ts": ["./node_modules/kuromoji/dict/**/*"],
  },
};

export default nextConfig;
