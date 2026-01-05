import { cn } from "@/shadcn/lib/utils";
import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  className?: string;
};

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Loader2
        className={cn("h-8 w-8 animate-spin text-blue-500", className)}
      />
    </div>
  );
}

export function GradientLoadingSpinner() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/10">
      <div className="relative h-10 w-10">
        {/* グラデーションの定義（SVG内部で参照するために一度だけ定義） */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient
              id="blue-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#0ea5e9" /> {/* Sky Blue */}
              <stop offset="50%" stopColor="#6366f1" /> {/* Indigo */}
              <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
            </linearGradient>
          </defs>
        </svg>

        {/* スピナー本体 */}
        <Loader2
          className="h-10 w-10 animate-spin"
          style={{ stroke: "url(#blue-gradient)" }}
        />
      </div>
    </div>
  );
}
