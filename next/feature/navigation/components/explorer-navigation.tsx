"use client";

import { useDetectMobileContext } from "@/__feature/mobile/providers/mobile-provider";
import { ClickToCopy } from "@/__feature/text/ui/click-to-copy";
import { DynamicBreadcrumbs } from "@/feature/breadcrumbs/components/dynamic-breadcrumbs";
import { useDynamicBreadcrumbsContext } from "@/feature/breadcrumbs/providers/dynamic-breadcrumbs-provider";
import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function ExplorerNavigation() {
  const searchParams = useSearchParams();
  const isMobile = useDetectMobileContext();
  const breadcrumbs = useDynamicBreadcrumbsContext();
  const current = breadcrumbs.items.at(-1);
  const backHref = breadcrumbs.items.at(-2)?.href ?? null;

  const buildUrl = useCallback(
    (baseUrl: string) => {
      const params = new URLSearchParams(searchParams);

      // 不要なパラメータを削除
      params.delete("page");
      params.delete("q");

      return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
    },
    [searchParams]
  );

  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* 一つ上のフォルダに戻る */}
      {backHref ? (
        <Link
          href={buildUrl(backHref)}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
        >
          <ArrowUp className="h-5 w-5" />
        </Link>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center opacity-40">
          <ArrowUp className="h-5 w-5" />
        </div>
      )}

      {/* 現在のフォルダ名 or パンくず */}
      {isMobile ? (
        <div className="min-w-0 flex-1 text-sm font-medium truncate">
          <ClickToCopy>{current?.label ?? ""}</ClickToCopy>
        </div>
      ) : (
        <div className="min-w-0 flex-1">
          <DynamicBreadcrumbs />
        </div>
      )}
    </div>
  );
}
