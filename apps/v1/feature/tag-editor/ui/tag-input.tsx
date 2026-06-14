import { normalizeTagName } from "@/lib/tag/normalize";
import { Tag } from "@/lib/tag/types";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { useMemo, useRef, useState } from "react";

interface TagInputProps {
  value: string;
  disabled: boolean;
  suggestions: Tag[];
  autoFocus?: boolean;
  autoBlur?: boolean; // autoFocus と排反 (focus 優先)
  onChange: (val: string) => void;
  onAdd: () => void;
  onSelectSuggestion: (tag: Tag) => void;
  onApply: () => void;
  onCancel: () => void;
}

export function TagInput({
  value,
  disabled,
  suggestions,
  autoFocus,
  autoBlur,
  onChange,
  onAdd,
  onSelectSuggestion,
  onApply,
  onCancel,
}: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggests = useMemo(
    () => new Map(suggestions.map((s) => [s.name, s])),
    [suggestions]
  );
  const [activeIndex, setActiveIndex] = useState(-1);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectIndex = (index: number) => {
    const nextIndex = Math.max(0, Math.min(index, suggestions.length - 1));
    setActiveIndex(nextIndex);

    const el = itemRefs.current[nextIndex];
    if (el) {
      el?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  };

  const updateInputFocus = () => {
    if (autoFocus) {
      inputRef.current?.focus();
    } else if (autoBlur) {
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        selectIndex(activeIndex + 1);
        break;

      case "ArrowUp":
        e.preventDefault();
        selectIndex(activeIndex - 1);
        break;

      case "Escape":
        e.preventDefault();
        setActiveIndex(-1);

        if (!value) {
          onCancel();
        }
        break;

      case "Enter":
        e.preventDefault();

        // タグが選択されていればそれを入力
        if (activeIndex >= 0) {
          const tag = suggestions[activeIndex];
          if (tag) {
            onSelectSuggestion(tag);
            setActiveIndex(-1);
            updateInputFocus();
            return;
          }
        }

        // 何も入力されていない場合は確定操作とみなす
        if (!value.trim()) {
          onApply();
          setActiveIndex(-1);
          return;
        }

        // サジェストに一致する場合は選択
        const normalized = normalizeTagName(value);
        if (suggests.has(normalized)) {
          onSelectSuggestion(suggests.get(value)!);
          setActiveIndex(-1);
          updateInputFocus();
          return;
        }

        // 新規作成
        onAdd();
        onChange("");
        setActiveIndex(-1);
        updateInputFocus();
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          className="w-full bg-muted/50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 ring-primary/20 outline-none"
          placeholder="タグを入力..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <Plus
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={18}
        />
        {value && (
          <button
            onClick={onAdd}
            className={cn([
              // layout
              "absolute right-2 top-1/2 -translate-y-1/2",

              // base style
              "bg-primary text-primary-foreground",
              "px-3 py-1 rounded-lg text-xs font-medium",

              // focus (keyboard)
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-primary",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ])}
          >
            新規作成
          </button>
        )}
      </div>

      {/* サジェストリスト */}
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            key="tag-suggestions"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-[80] left-0 right-0 mt-1 bg-popover border rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-[200px] overflow-y-auto p-1">
              <p className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                既存のタグから選択
              </p>
              {suggestions.map((tag, index) => {
                const active = index === activeIndex;

                return (
                  <button
                    key={tag.id}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => {
                      onSelectSuggestion(tag);
                      setActiveIndex(-1);
                      updateInputFocus();
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-between",
                      active ? "bg-accent" : "hover:bg-accent"
                    )}
                  >
                    <span>{tag.name}</span>
                    <Check
                      size={14}
                      className={cn(
                        "text-primary transition-opacity",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
