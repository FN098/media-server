import { AccentColor } from "@/lib/page-meta/types";
import { cn } from "@/shadcn/lib/utils";

const glowMap: Record<AccentColor, { top: string; bl: string; br: string }> = {
  indigo: {
    top: "bg-indigo-600/10",
    bl: "bg-violet-600/7",
    br: "bg-sky-600/6",
  },
  violet: {
    top: "bg-violet-600/10",
    bl: "bg-purple-600/7",
    br: "bg-indigo-600/6",
  },
  sky: {
    top: "bg-sky-600/10",
    bl: "bg-cyan-600/7",
    br: "bg-blue-600/6",
  },
  cyan: {
    top: "bg-cyan-500/10",
    bl: "bg-teal-600/7",
    br: "bg-sky-600/6",
  },
  teal: {
    top: "bg-teal-600/10",
    bl: "bg-emerald-600/7",
    br: "bg-cyan-600/6",
  },
  emerald: {
    top: "bg-emerald-600/10",
    bl: "bg-green-600/7",
    br: "bg-teal-600/6",
  },
  red: {
    top: "bg-red-600/10",
    bl: "bg-rose-600/7",
    br: "bg-orange-600/6",
  },
  rose: {
    top: "bg-rose-600/10",
    bl: "bg-pink-600/7",
    br: "bg-red-600/6",
  },
  orange: {
    top: "bg-orange-600/10",
    bl: "bg-amber-600/7",
    br: "bg-red-600/6",
  },
  amber: {
    top: "bg-amber-600/10",
    bl: "bg-yellow-600/7",
    br: "bg-orange-600/6",
  },
  zinc: {
    top: "bg-zinc-500/10",
    bl: "bg-zinc-600/7",
    br: "bg-zinc-400/6",
  },
};

interface PageBackgroundProps {
  accent: AccentColor;
  className?: string;
}

export function PageBackground({ accent, className }: PageBackgroundProps) {
  const glow = glowMap[accent];

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden="true"
    >
      {/* グリッドパターン */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      {/* グロー */}
      <div
        className={cn(
          "absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl",
          glow.top
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-1/4 w-64 h-64 rounded-full blur-3xl",
          glow.bl
        )}
      />
      <div
        className={cn(
          "absolute bottom-1/4 right-1/4 w-44 h-44 rounded-full blur-3xl",
          glow.br
        )}
      />
    </div>
  );
}
