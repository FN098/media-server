"use client";

import { AccentColor } from "@/lib/page-meta/types";
import { cn } from "@/shadcn/lib/utils";
import { motion } from "framer-motion";

const glowMap: Record<AccentColor, { top: string; bl: string; br: string }> = {
  indigo: {
    top: "bg-indigo-500/8 dark:bg-indigo-600/10",
    bl: "bg-violet-500/6 dark:bg-violet-600/7",
    br: "bg-sky-500/5 dark:bg-sky-600/6",
  },
  violet: {
    top: "bg-violet-500/8 dark:bg-violet-600/10",
    bl: "bg-purple-500/6 dark:bg-purple-600/7",
    br: "bg-indigo-500/5 dark:bg-indigo-600/6",
  },
  sky: {
    top: "bg-sky-500/8 dark:bg-sky-600/10",
    bl: "bg-cyan-500/6 dark:bg-cyan-600/7",
    br: "bg-blue-500/5 dark:bg-blue-600/6",
  },
  cyan: {
    top: "bg-cyan-500/8 dark:bg-cyan-500/10",
    bl: "bg-teal-500/6 dark:bg-teal-600/7",
    br: "bg-sky-500/5 dark:bg-sky-600/6",
  },
  teal: {
    top: "bg-teal-500/8 dark:bg-teal-600/10",
    bl: "bg-emerald-500/6 dark:bg-emerald-600/7",
    br: "bg-cyan-500/5 dark:bg-cyan-600/6",
  },
  emerald: {
    top: "bg-emerald-500/8 dark:bg-emerald-600/10",
    bl: "bg-green-500/6 dark:bg-green-600/7",
    br: "bg-teal-500/5 dark:bg-teal-600/6",
  },
  red: {
    top: "bg-red-500/8 dark:bg-red-600/10",
    bl: "bg-rose-500/6 dark:bg-rose-600/7",
    br: "bg-orange-500/5 dark:bg-orange-600/6",
  },
  rose: {
    top: "bg-rose-500/8 dark:bg-rose-600/10",
    bl: "bg-pink-500/6 dark:bg-pink-600/7",
    br: "bg-red-500/5 dark:bg-red-600/6",
  },
  orange: {
    top: "bg-orange-500/8 dark:bg-orange-600/10",
    bl: "bg-amber-500/6 dark:bg-amber-600/7",
    br: "bg-red-500/5 dark:bg-red-600/6",
  },
  amber: {
    top: "bg-amber-500/8 dark:bg-amber-600/10",
    bl: "bg-yellow-500/6 dark:bg-yellow-600/7",
    br: "bg-orange-500/5 dark:bg-orange-600/6",
  },
  zinc: {
    top: "bg-zinc-400/8 dark:bg-zinc-500/10",
    bl: "bg-zinc-500/6 dark:bg-zinc-600/7",
    br: "bg-zinc-300/5 dark:bg-zinc-400/6",
  },
};

const float = (
  xRange: [number, number],
  yRange: [number, number],
  scaleRange: [number, number],
  opacityRange: [number, number],
  duration: number
) => ({
  animate: {
    x: [0, xRange[0], xRange[1], 0],
    y: [0, yRange[0], yRange[1], 0],
    scale: [1, scaleRange[0], scaleRange[1], 1],
    opacity: [
      opacityRange[0],
      opacityRange[1],
      opacityRange[0],
      opacityRange[1],
    ],
  },
  transition: {
    duration,
    ease: "easeInOut" as const,
    repeat: Infinity,
    repeatType: "mirror" as const,
  },
});

interface PageBackgroundProps {
  accent: AccentColor;
  className?: string;
}

export function PageBackground({ accent, className }: PageBackgroundProps) {
  const glow = glowMap[accent];

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {/* グリッドパターン */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* グロー top */}
      <motion.div
        className={cn(
          "absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl",
          glow.top
        )}
        {...float([-80, 60], [40, -30], [1.15, 0.9], [0.7, 1], 9)}
      />

      <motion.div
        className={cn(
          "absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl",
          glow.bl
        )}
        {...float([40, -28], [-48, 24], [1.1, 0.85], [0.6, 1], 11)}
      />

      <motion.div
        className={cn(
          "absolute bottom-1/4 right-1/4 w-44 h-44 rounded-full blur-3xl",
          glow.br
        )}
        {...float([-36, 32], [40, -32], [1.2, 0.8], [0.5, 1], 7)}
      />
    </div>
  );
}
