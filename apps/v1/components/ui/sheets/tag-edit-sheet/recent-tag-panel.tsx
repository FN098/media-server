import { Tag, TagOperator, TagState } from "@/lib/tag/types";
import { cn } from "@/shadcn/lib/utils";
import { Check, History } from "lucide-react";

interface RecentTagPanelProps {
  recentTags: Tag[];
  tagStates: Record<string, TagState>;
  pendingChanges: Record<string, TagOperator>;
  onToggle: (tag: Tag) => void;
  opacity: number;
}

export function RecentTagPanel({
  recentTags,
  tagStates,
  pendingChanges,
  onToggle,
  opacity,
}: RecentTagPanelProps) {
  if (recentTags.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <History size={11} className="text-muted-foreground" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          最近のタグ
        </p>
      </div>

      <div className="flex flex-wrap gap-2 max-h-[300px] overflow-auto">
        {recentTags.map((tag) => {
          const op = pendingChanges[tag.id];

          const isOnAfterApply =
            op === "add"
              ? true
              : op === "remove"
                ? false
                : tagStates[tag.name] === "all";

          const isPartiallyOn = op == null && tagStates[tag.name] === "some";
          const isHighlighted = isOnAfterApply || isPartiallyOn;

          return (
            <button
              key={tag.id}
              onClick={() => onToggle(tag)}
              className={cn(
                "relative flex items-center gap-1.5 py-2 px-4 rounded-xl",
                "text-xs font-medium transition-all active:scale-95 border-none",
                isOnAfterApply &&
                  "text-primary-foreground shadow-sm shadow-primary/20",
                isPartiallyOn && "text-primary",
                !isHighlighted && "text-muted-foreground",
                op === "remove" && "opacity-40 line-through"
              )}
              style={{
                backgroundColor: isOnAfterApply
                  ? `color-mix(in oklch, var(--primary) ${opacity}%, transparent)`
                  : isPartiallyOn
                    ? `color-mix(in oklch, var(--primary) ${opacity * 0.15}%, transparent)`
                    : `color-mix(in oklch, var(--muted) ${opacity}%, transparent)`,
                color: isOnAfterApply
                  ? `color-mix(in oklch, var(--primary-foreground) ${Math.max(80, opacity)}%, transparent)`
                  : undefined,
                outline: isPartiallyOn
                  ? "1.5px dashed color-mix(in oklch, var(--primary) 60%, transparent)"
                  : undefined,
              }}
            >
              <span className="flex items-center gap-1.5 pointer-events-none">
                {isOnAfterApply && <Check size={12} />}
                {tag.name}
              </span>

              {op && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full border-2 border-background" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
