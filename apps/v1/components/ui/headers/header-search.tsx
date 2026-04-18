"use client";

import { SearchInput } from "@/components/ui/inputs/search-input";
import { useMounted } from "@/hooks/use-mounted";
import { useQueryFilter } from "@/hooks/use-query-filter";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { cn } from "@/shadcn/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function HeaderSearch() {
  const { value, apply } = useQueryFilter();
  const [input, setInput] = useState(value.query ?? "");
  const [focused, setFocused] = useState(false);
  const isMobile = useIsMobile();
  const mounted = useMounted();
  const inputRef = useRef<HTMLInputElement>(null);
  const { register } = useSearchFocusContext();

  useEffect(() => {
    // 他のコンポーネントから検索バーにフォーカスできるようにする
    register(() => inputRef.current?.focus());
  }, [register]);

  const placeholder = isMobile ? "" : undefined;
  const collapsedWidth = isMobile ? 36 : 180;
  const expandedWidth = isMobile ? 180 : 320;

  const debouncedApply = useDebouncedCallback(
    (v: string | null) => apply(v),
    300
  );

  const handleChange = (value: string) => {
    setInput(value); // 入力は即時反映
    debouncedApply(value); // URL同期はデバウンス
  };

  const isMobileBlur = isMobile && !focused && input === "";
  const isExpanded = focused || input.length > 0;

  // マウント前のプレースホルダー
  if (!mounted) {
    return (
      <div
        className="shrink-0 h-9 w-20"
        style={{
          maxWidth: "calc(100vw - 2rem)",
        }}
      >
        <div className="w-full h-full bg-muted/50 animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <motion.div
      initial={false}
      animate={{
        width: isExpanded ? expandedWidth : collapsedWidth,
        zIndex: focused ? 50 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative shrink-0 w-full"
      style={{ maxWidth: isMobile ? "calc(100vw - 2rem)" : "none" }}
    >
      <SearchInput
        placeholder={placeholder}
        inputRef={inputRef}
        value={input}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "transition-all duration-200 pl-9",
          isMobileBlur && [
            "pl-0 border-transparent bg-transparent shadow-none",
            "text-transparent placeholder:text-transparent",
            "[&::-webkit-search-cancel-button]:appearance-none",
          ]
        )}
      />
      <AnimatePresence>
        {!focused && !isMobile && (
          <motion.div
            key="shortcut"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <kbd className="rounded border px-1.5 py-0.5">Ctrl</kbd>
            <kbd className="rounded border px-1.5 py-0.5">K</kbd>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
