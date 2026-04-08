import { PendingNewTag, Tag, TagOperator, TagState } from "@/lib/tag/types";
import { Badge } from "@/shadcn/components/ui/badge";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface TagListProps {
  opacity: number;
  isEditing: boolean;
  tags: Tag[];
  pendingChanges: Record<string, TagOperator>;
  pendingNewTags: PendingNewTag[];
  tagStates: Record<string, TagState>;
  onToggle: (tag: Tag) => void;
}

export function TagList({
  opacity,
  isEditing,
  tags,
  pendingChanges,
  pendingNewTags,
  tagStates,
  onToggle,
}: TagListProps) {
  // --- 閲覧モード ---
  if (!isEditing) {
    return (
      <div
        style={
          {
            "--scrollbar-color": `color-mix(in oklch, var(--muted-foreground) ${Math.max(20, opacity * 0.5)}%, transparent)`,
          } as React.CSSProperties
        }
        className={cn(
          "flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1 pr-1",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-color)]",
          "[&::-webkit-scrollbar-thumb]:rounded-full"
        )}
      >
        <AnimatePresence mode="wait">
          {tags.length > 0 ? (
            <motion.div
              key="tags-container"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-wrap gap-2 w-full"
            >
              {tags.map((tag, index) => (
                <motion.div
                  key={tag.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      "py-2 px-4 rounded-xl text-xs border-none",
                      "select-text cursor-text"
                    )}
                    style={{
                      backgroundColor: `color-mix(in oklch, var(--secondary) ${opacity}%, transparent)`,
                      color: `color-mix(in oklch, var(--secondary-foreground) ${Math.max(70, opacity)}%, transparent)`,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty-message"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-muted-foreground py-2 w-full text-center italic"
            >
              タグがありません
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // --- 編集モード ---
  return (
    <div
      style={
        {
          "--scrollbar-color": `color-mix(in oklch, var(--muted-foreground) ${Math.max(20, opacity * 0.5)}%, transparent)`,
        } as React.CSSProperties
      }
      className={cn(
        "flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto py-1 px-1",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-[var(--scrollbar-color)]",
        "[&::-webkit-scrollbar-thumb]:rounded-full"
      )}
    >
      {tags.map((tag) => {
        const op = pendingChanges[tag.id];

        const isOnAfterApply =
          op === "add"
            ? true
            : op === "remove"
              ? false
              : tagStates[tag.name] === "all";

        const isPartiallyOn = op == null && tagStates[tag.name] === "some";
        const isHighlighted = isOnAfterApply || isPartiallyOn;
        const isPendingNew = pendingNewTags.some((t) => t.tempId === tag.id);

        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag)}
            className={cn(
              "relative flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-medium transition-all active:scale-95 border-none",
              isHighlighted
                ? "text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground",
              op === "add" && "ring-2 ring-yellow-400 ring-offset-2",
              op === "remove" && "opacity-40 line-through",
              isPendingNew &&
                "border-2 border-dashed border-primary/60 text-primary"
            )}
            style={{
              backgroundColor: isHighlighted
                ? `color-mix(in oklch, var(--primary) ${opacity}%, transparent)`
                : `color-mix(in oklch, var(--muted) ${opacity}%, transparent)`,

              color: isHighlighted
                ? `color-mix(in oklch, var(--primary-foreground) ${Math.max(80, opacity)}%, transparent)`
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
            {isPendingNew && (
              <span className="absolute -top-1 -right-1 rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground shadow">
                NEW
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
