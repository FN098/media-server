"use client";

import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs/dynamic-breadcrumbs";
import { ViewModeSwitch } from "@/components/ui/buttons/view-mode-switch";
import { Search } from "@/components/ui/inputs/search";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function HeaderNavigation({ basePath }: { basePath?: string }) {
  const breadcrumbs = useBreadcrumbs(basePath ?? "");
  const isMobile = useIsMobile();
  const current = breadcrumbs.at(-1);
  const backHref = breadcrumbs.at(-2)?.href ?? null;

  return (
    <>
      {backHref ? (
        <Link
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center opacity-40">
          <ArrowLeft className="h-5 w-5" />
        </div>
      )}

      {isMobile ? (
        <div className="min-w-0 flex-1 text-sm font-medium truncate">
          {current?.label ?? ""}
        </div>
      ) : (
        <DynamicBreadcrumbs items={breadcrumbs} />
      )}
    </>
  );
}

export function HeaderSearch() {
  const { inputRef, query, setQuery } = useSearchContext();
  const [input, setInput] = useState(query);
  const [focused, setFocused] = useState(false);
  const isMobile = useIsMobile();

  const debouncedSetQuery = useDebouncedCallback(
    (v: string) => setQuery(v),
    300
  );

  // 外部 query → input 同期
  useEffect(() => {
    setInput(query);
  }, [query]);

  // input → query（debounce）
  useEffect(() => {
    debouncedSetQuery(input);
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery, input]);

  return (
    <motion.div
      initial={{ width: 180 }}
      animate={{ width: focused ? 320 : 180 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="relative shrink-0"
    >
      <Search
        inputRef={inputRef}
        value={input}
        setValue={setInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
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

export function HeaderViewModeSwitch() {
  const { viewMode, setViewMode } = useViewModeContext();

  return (
    <ViewModeSwitch
      viewMode={viewMode}
      setViewMode={setViewMode}
      className="shrink-0"
    />
  );
}
