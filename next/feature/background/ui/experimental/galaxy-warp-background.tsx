"use client";

import { AccentColor } from "@/lib/page-meta/types";
import { cn } from "@/shadcn/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

// accentカラー → 宇宙風HSLパレット
const accentPalette: Record<AccentColor, { h: number; s: number }> = {
  indigo: { h: 245, s: 70 },
  violet: { h: 270, s: 70 },
  sky: { h: 200, s: 80 },
  cyan: { h: 185, s: 80 },
  teal: { h: 170, s: 65 },
  emerald: { h: 150, s: 60 },
  red: { h: 0, s: 70 },
  rose: { h: 340, s: 70 },
  orange: { h: 25, s: 80 },
  amber: { h: 40, s: 80 },
  zinc: { h: 220, s: 15 },
};

interface GalaxyBackgroundProps {
  accent: AccentColor;
  className?: string;
}

// --- 星屑 Canvas ---
function StarField({ h, s }: { h: number; s: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const STAR_COUNT = 300;
    const SPEED = 0.004; // z の減速量（大きいほど速く吸い込まれる）

    type Star = {
      x: number; // -1 ~ 1 の正規化座標（中心原点）
      y: number;
      z: number; // 0(手前) ~ 1(奥) — 毎フレーム減少
      hue: boolean; // accent色かどうか
    };

    const spawn = (): Star => ({
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: Math.random(), // 奥からランダムに配置
      hue: Math.random() > 0.6,
    });

    const stars: Star[] = Array.from({ length: STAR_COUNT }, spawn);

    let raf: number;

    const draw = () => {
      const { width, height } = canvas;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        // z を減らす（奥→手前へ移動）
        star.z -= SPEED;

        // 画面外 or z が 0 以下になったら中心付近にリスポーン
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * 0.2; // 中心付近から
          star.y = (Math.random() - 0.5) * 0.2;
          star.z = 0.8 + Math.random() * 0.2;
        }

        // 透視投影：z が小さいほど中心から遠くへ
        const perspective = 1 / star.z;
        const sx = cx + star.x * perspective * cx;
        const sy = cy + star.y * perspective * cy;

        // 画面外なら skip
        if (sx < 0 || sx > width || sy < 0 || sy > height) {
          star.z = 0.8 + Math.random() * 0.2;
          star.x = (Math.random() - 0.5) * 0.2;
          star.y = (Math.random() - 0.5) * 0.2;
          continue;
        }

        // z が小さい（手前）ほど大きく・明るく
        const r = (1 - star.z) * 2.5 + 0.2;
        const opacity = Math.min(1, (1 - star.z) * 1.2 + 0.1);

        // 軌跡（motion blur 風）
        const pz = star.z + SPEED * 6;
        const px = cx + star.x * (1 / pz) * cx;
        const py = cy + star.y * (1 / pz) * cy;

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.strokeStyle = star.hue
          ? `hsla(${h}, ${s}%, 80%, ${opacity * 0.7})`
          : `hsla(0, 0%, 100%, ${opacity * 0.7})`;
        ctx.lineWidth = r * 0.8;
        ctx.stroke();

        // 先端の点
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = star.hue
          ? `hsla(${h}, ${s}%, 90%, ${opacity})`
          : `hsla(0, 0%, 100%, ${opacity})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [h, s]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// --- メインコンポーネント ---
export function GalaxyBackground({ accent, className }: GalaxyBackgroundProps) {
  const { h, s } = accentPalette[accent];

  // accent隣接色（補色寄り）でオーロラの2色目を作る
  const h2 = (h + 40) % 360;
  const h3 = (h + 200) % 360; // 補色

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* ベース：深宇宙の暗黒 */}

      {/* 星屑 */}
      <StarField h={h} s={s} />

      {/* ギャラクシーディスク（回転する楕円グロー） */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 120, ease: "linear", repeat: Infinity }}
      >
        <div
          className="w-[140%] h-[35%] rounded-[50%] blur-[80px] opacity-20"
          style={{
            background: `radial-gradient(ellipse, hsl(${h},${s}%,60%) 0%, hsl(${h2},${s}%,50%) 50%, transparent 100%)`,
          }}
        />
      </motion.div>

      {/* オーロラ layer 1 */}
      <motion.div
        className="absolute inset-x-0 top-0 h-[55%] blur-[60px] opacity-25"
        animate={{
          y: [0, 30, -20, 0],
          scaleX: [1, 1.08, 0.95, 1],
          opacity: [0.25, 0.35, 0.2, 0.25],
        }}
        transition={{ duration: 14, ease: "easeInOut", repeat: Infinity }}
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, hsl(${h},${s}%,55%) 0%, transparent 100%)`,
        }}
      />

      {/* オーロラ layer 2（補色） */}
      <motion.div
        className="absolute inset-x-0 bottom-0 h-[45%] blur-[70px] opacity-15"
        animate={{
          y: [0, -25, 20, 0],
          scaleX: [1, 0.92, 1.06, 1],
          opacity: [0.15, 0.22, 0.12, 0.15],
        }}
        transition={{
          duration: 18,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 3,
        }}
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 100%, hsl(${h3},60%,45%) 0%, transparent 100%)`,
        }}
      />

      {/* ネビュラ（中央の星雲状グロー） */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.12, 0.92, 1],
          opacity: [0.12, 0.18, 0.1, 0.12],
        }}
        transition={{
          duration: 20,
          ease: "easeInOut",
          repeat: Infinity,
          delay: 1,
        }}
        style={{
          background: `radial-gradient(circle, hsl(${h2},${s}%,65%) 0%, hsl(${h},${s - 10}%,40%) 50%, transparent 100%)`,
        }}
      />

      {/* 暗黒物質風：上下をfadeで締める */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#04030a] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#04030a] to-transparent" />
    </div>
  );
}
