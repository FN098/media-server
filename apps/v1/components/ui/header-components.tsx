"use client";

import { DynamicBreadcrumbs } from "@/components/ui/breadcrumbs";
import { Search } from "@/components/ui/search";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { useBreadcrumbs } from "@/hooks/use-breadcrumbs";
import { useSearchContext } from "@/providers/search-provider";
import { useViewModeContext } from "@/providers/view-mode-provider";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
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
    <Search
      inputRef={inputRef}
      value={input}
      setValue={setInput}
      className="w-[180px] shrink-0"
    />
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
