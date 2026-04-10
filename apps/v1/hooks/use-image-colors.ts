import { useCallback, useState } from "react";

export function useImageColors() {
  const [colors, setColors] = useState<string[]>([
    "#6366f1",
    "#a855f7",
    "#ec4899",
  ]); // デフォルト色

  const extractColors = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // 画像の端や中央からサンプリング
      const positions = [
        { x: 0.2, y: 0.2 }, // 左上
        { x: 0.8, y: 0.8 }, // 右下
        { x: 0.5, y: 0.5 }, // 中央
      ];

      const extracted = positions.map((pos) => {
        const x = Math.floor(canvas.width * pos.x);
        const y = Math.floor(canvas.height * pos.y);
        const data = ctx.getImageData(x, y, 1, 1).data;
        return `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
      });

      setColors(extracted);
    },
    []
  );

  return { colors, extractColors };
}
