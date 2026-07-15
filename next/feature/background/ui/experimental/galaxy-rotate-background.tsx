"use client";

import { AccentColor } from "@/lib/page-meta/types";
import { cn } from "@/shadcn/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

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

// --- リアルな星屑 Canvas ---
function StarField({ h, s }: { h: number; s: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      // 回転コンテナに合わせて、親要素のサイズをしっかり取得
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
      isSparkle: boolean;
    };

    // 全体が回転するため、星の密度を維持しつつ数を調整（少し多めの250個）
    const stars: Star[] = Array.from({ length: 250 }, () => {
      const r = Math.random() * 1.2 + 0.2;
      return {
        x: Math.random(),
        y: Math.random(),
        r,
        opacity: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        isSparkle: r > 1.1 && Math.random() > 0.7,
      };
    });

    let raf: number;
    let t = 0;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // --- 【追加】モアレ・バンディング防止のディザリングノイズ ---
      // 画面全体に、目に見えないレベル（不透明度 0.015）の微細な白黒ノイズを敷き詰めます
      const imgData = ctx.createImageData(width, height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 12; // -6 〜 +6 の微細なブレ
        data[i] = 4 + noise; // R (ベースの宇宙の暗さに合わせる)
        data[i + 1] = 3 + noise; // G
        data[i + 2] = 10 + noise; // B
        data[i + 3] = 4; // A (ごくごく薄く)
      }
      ctx.putImageData(imgData, 0, 0);
      // --------------------------------------------------------

      for (const star of stars) {
        const twinkle = Math.max(
          0.1,
          star.opacity + Math.sin(t * star.speed + star.phase) * 0.3
        );
        const screenX = star.x * width;
        const screenY = star.y * height;

        const gradient = ctx.createRadialGradient(
          screenX,
          screenY,
          0,
          screenX,
          screenY,
          star.r * 2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${twinkle})`);
        gradient.addColorStop(0.4, `hsla(${h}, ${s}%, 80%, ${twinkle * 0.6})`);
        gradient.addColorStop(1, `hsla(${h}, ${s}%, 60%, 0)`);

        ctx.beginPath();
        ctx.arc(screenX, screenY, star.r, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        if (star.isSparkle && twinkle > 0.5) {
          ctx.beginPath();
          ctx.strokeStyle = `hsla(${h}, ${s}%, 90%, ${twinkle * 0.2})`;
          ctx.lineWidth = 0.5;
          const sSize = star.r * 5;
          ctx.moveTo(screenX - sSize, screenY);
          ctx.lineTo(screenX + sSize, screenY);
          ctx.moveTo(screenX, screenY - sSize);
          ctx.lineTo(screenX, screenY + sSize);
          ctx.stroke();
        }
      }
      t += 0.01;
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

export function GalaxyBackground({
  accent,
  className,
}: {
  accent: AccentColor;
  className?: string;
}) {
  const { h, s } = accentPalette[accent];
  const h2 = (h + 40) % 360;
  const h3 = (h + 200) % 360;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* 
        回転のメインコンテナ 
        画面（100vw/vh）の対角線をカバーするために 150vmax の正方形に設定
      */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2"
        animate={{ rotate: 360 }}
        transition={{ duration: 240, ease: "linear", repeat: Infinity }}
        style={{ willChange: "transform" }}
      >
        {/* 星屑 */}
        <StarField h={h} s={s} />

        {/* ギャラクシーディスク */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="h-[30%] w-[80%] rounded-[50%] opacity-20 blur-[100px]"
            style={{
              background: `radial-gradient(ellipse, hsl(${h},${s}%,60%) 0%, hsl(${h2},${s}%,50%) 50%, transparent 100%)`,
            }}
          />
        </div>

        {/* オーロラ layer 1 */}
        <motion.div
          className="absolute inset-0 opacity-20 blur-[80px] mix-blend-screen"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(circle at 30% 30%, hsl(${h},${s}%,50%) 0%, transparent 60%)`,
          }}
        />

        {/* オーロラ layer 2 (補色) */}
        <motion.div
          className="absolute inset-0 opacity-15 blur-[90px] mix-blend-screen"
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: `radial-gradient(circle at 70% 70%, hsl(${h3},${s}%,40%) 0%, transparent 60%)`,
          }}
        />

        {/* センターネビュラ */}
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[120px] mix-blend-screen"
          style={{
            background: `radial-gradient(circle, hsl(${h2},${s}%,60%) 0%, transparent 70%)`,
          }}
        />
      </motion.div>

      {/* 
        静止レイヤー：
        上下のフェードは回転させないことで、
        画面端の違和感を消し、コンテンツの視認性を確保する
      */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#04030a] via-[#04030a]/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#04030a] via-[#04030a]/60 to-transparent" />
    </div>
  );
}
