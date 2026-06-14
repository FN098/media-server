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
// --- 星屑 Canvas（リアル輝き版） ---
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

    type Star = {
      x: number;
      y: number;
      r: number;
      opacity: number;
      speed: number;
      phase: number;
      isSparkle: boolean; // 十字の光を放つ特別な星か
    };

    // 星の数を少し調整（180個。大きい星の比率を考慮）
    const stars: Star[] = Array.from({ length: 180 }, () => {
      const r = Math.random() * 1.3 + 0.2; // 0.2px 〜 1.5px
      return {
        x: Math.random(),
        y: Math.random(),
        r,
        opacity: Math.random() * 0.5 + 0.3, // ベースの不透明度を少し高めに
        speed: Math.random() * 0.6 + 0.3,
        phase: Math.random() * Math.PI * 2,
        isSparkle: r > 1.2 && Math.random() > 0.4, // 大きな星の約6割をクロス輝きにする
      };
    });

    let raf: number;
    let t = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      for (const star of stars) {
        // 現在のフレームでのリアルタイムな輝き度（0.1 〜 1.0 の間で明滅）
        const twinkle = Math.max(
          0.1,
          star.opacity + Math.sin(t * star.speed + star.phase) * 0.35
        );

        const screenX = star.x * width;
        const screenY = star.y * height;

        // 1. グラデーションの作成（中心を白、外側をアクセントカラーに）
        const gradient = ctx.createRadialGradient(
          screenX,
          screenY,
          0,
          screenX,
          screenY,
          star.r * 2 // 少し広めにグラデーションをかける
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${twinkle})`);
        gradient.addColorStop(0.3, `hsla(${h}, ${s}%, 85%, ${twinkle * 0.7})`);
        gradient.addColorStop(1, `hsla(${h}, ${s}%, 60%, 0)`);

        // 2. グロー効果（シャドウ）の設定
        ctx.save(); // 状態を保存
        if (star.r > 0.8) {
          ctx.shadowBlur = star.r * 4;
          ctx.shadowColor = `hsla(${h}, ${s}%, 70%, ${twinkle})`;
        }

        // 星のコアを描画
        ctx.beginPath();
        ctx.arc(screenX, screenY, star.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore(); // シャドウ効果をリセット

        // 3. 特別な星には薄い十字の光（スパークル）を重ねる
        if (star.isSparkle && twinkle > 0.4) {
          ctx.save();
          ctx.strokeStyle = `hsla(${h}, ${s}%, 90%, ${twinkle * 0.25})`; // 薄く繊細に
          ctx.lineWidth = 0.5;

          // 明滅に合わせて十字の長さもわずかに伸縮させる
          const sparkleSize =
            star.r * (4 + Math.sin(t * star.speed + star.phase) * 1.5);

          ctx.beginPath();
          // 横線
          ctx.moveTo(screenX - sparkleSize, screenY);
          ctx.lineTo(screenX + sparkleSize, screenY);
          // 縦線
          ctx.moveTo(screenX, screenY - sparkleSize);
          ctx.lineTo(screenX, screenY + sparkleSize);
          ctx.stroke();
          ctx.restore();
        }
      }

      t += 0.012; // 明滅の速度を少しだけ緩やかにしてリアルに
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
      {/* <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#04030a] to-transparent" /> */}
      {/* <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#04030a] to-transparent" /> */}
    </div>
  );
}
